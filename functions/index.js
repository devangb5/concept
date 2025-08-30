const express = require("express");
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const corsOptions = {
  origin: [
    "https://blogs.aroundtheville.com",
    "https://aroundtheville.com",
    "https://people.aroundtheville.com",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

let slideshowCount = 0; // for unique IDs

/**
 * Generate HTML for a single image or multiple images slideshow.
 * @param {string|string[]} imageData
 * @return {string} HTML string with images or slideshow
 */
function generateImageHTML(imageData) {
  if (!imageData) {
    return `<img src="default-image.jpg" alt="Default Image" style="width:100%; border-radius:1rem;">`;
  }

  if (typeof imageData === "string") {
    // Single image
    return `<img src="${imageData}" alt="Image" style="width:100%; border-radius:1rem;">`;
  }

  if (Array.isArray(imageData) && imageData.length > 0) {
    slideshowCount++;
    const slideshowId = `slideshow-${slideshowCount}`;

    const imagesHTML = imageData
        .map(
            (src, i) =>
              `<img class="slide" src="${src}" alt="Slide ${i + 1}" style="width:100%; border-radius:1rem; display: ${
            i === 0 ? "block" : "none"
              }; object-fit: cover;">`,
        )
        .join("");

    return `
      <div id="${slideshowId}" class="slideshow-container" style="position:relative; 
      max-width:100%; border-radius:1rem; overflow:hidden;">
        ${imagesHTML}
        <button class="prevBtn" style="position:absolute; top:50%; left:10px; transform:translateY(-50%);
          background:rgba(0,0,0,0.5); color:white;
          border:none; padding:8px 12px; cursor:pointer; border-radius:5px; z-index:10;">&#10094;</button>
        <button class="nextBtn" style="position:absolute; top:50%; right:10px; transform:translateY(-50%);
          background:rgba(0,0,0,0.5); color:white;
          border:none; padding:8px 12px; cursor:pointer; border-radius:5px; z-index:10;">&#10095;</button>
      </div>

      <script>
        (function() {
          const container = document.getElementById('${slideshowId}');
          const slides = container.querySelectorAll('.slide');
          const prevBtn = container.querySelector('.prevBtn');
          const nextBtn = container.querySelector('.nextBtn');
          let currentIndex = 0;

          function showSlide(index) {
            slides.forEach((slide, i) => {
              slide.style.display = i === index ? 'block' : 'none';
            });
          }

          prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(currentIndex);
          });

          nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
          });

          // Automatic slideshow removed as requested
        })();
      </script>
    `;
  }

  // fallback
  return `<img src="default-image.jpg" alt="Default Image" style="width:100%; border-radius:1rem;">`;
}

/**
 * Format an array of content objects into an HTML string.
 * @param {Array<Object>} contentArray
 * @return {string}
 */
function formatContentArray(contentArray = []) {
  return contentArray
      .map((item) => {
        const textHTML = Array.isArray(item.text)?
        item.text.map((paragraph) => `<p>${paragraph}</p>`).join(""):
        `<p>${item.text || ""}</p>`;
        return `<h2>${item.heading || "Untitled Section"}</h2>${textHTML}`;
      })
      .join("");
}

/**
 * Fetch blog data by blog number.
 * @param {string} blogNumber
 * @return {Promise<Object>}
 * @throws {Error} When blog is not found
 */
async function fetchBlogData(blogNumber) {
  const blogSnapshot = await db
      .collection("blogs")
      .where("blog_number", "==", blogNumber)
      .limit(1)
      .get();

  if (blogSnapshot.empty) {
    throw new Error("Blog not found");
  }

  return blogSnapshot.docs[0].data();
}

/**
 * Fetch person data by person ID.
 * @param {string} personId
 * @return {Promise<Object>}
 * @throws {Error} When person is not found
 */
async function fetchPersonData(personId) {
  const personSnapshot = await db.collection("people").doc(personId).get();

  if (!personSnapshot.exists) {
    throw new Error("Person not found");
  }

  return personSnapshot.data();
}

// Helper to extract first image url for meta tags
/**
 * Extract the first image URL from the image field.
 * @param {string|string[]} imageData - Image URL string or array of image URLs.
 * @return {string} The first image URL or a default image.
 */
function getFirstImageUrl(imageData) {
  if (!imageData) return "default-image.jpg";
  if (typeof imageData === "string") return imageData;
  if (Array.isArray(imageData) && imageData.length > 0) return imageData[0];
  return "default-image.jpg";
}

/**
 * Route to fetch and render a blog article.
 */
app.get("/blogs/:blog_number", async (req, res) => {
  const blogNumber = req.params.blog_number;
  console.log(`Fetching blog with number: ${blogNumber}`);

  try {
    const blogData = await fetchBlogData(blogNumber);

    const templateUrl =
      "https://raw.githubusercontent.com/devangb5/concept/main/article.html";

    const response = await axios.get(templateUrl);
    const template = response.data;

    const imageHTML = generateImageHTML(blogData.image);
    const firstImageUrl = getFirstImageUrl(blogData.image);

    let populatedTemplate = template
        .replace(/{{title}}/g, blogData.title || "Untitled")
        .replace(/{{description}}/g, blogData.description || "No description available")
        .replace(/{{image}}/g, imageHTML)
        .replace(/{{url}}/g, `${req.protocol}://${req.get("host")}${req.originalUrl}`)
        // Replace meta image tags explicitly
        .replace(/<meta property="og:image" content='{{meta_image}}'>/g,
            `<meta property="og:image" content='${firstImageUrl}'>`)
        .replace(/<meta name="twitter:image" content='{{meta_image}}'>/g,
            `<meta name="twitter:image" content='${firstImageUrl}'>`);

    const contentHTML = formatContentArray(blogData.content);
    populatedTemplate = populatedTemplate.replace(/{{content}}/g, contentHTML);

    res.send(populatedTemplate);
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(404).send("Blog not found");
  }
});

/**
 * Route to fetch and render a person's profile.
 */
app.get("/people/:person_id", async (req, res) => {
  const personId = req.params.person_id;
  console.log(`Fetching profile for person ID: ${personId}`);

  try {
    const personData = await fetchPersonData(personId);

    const templateUrl =
      "https://raw.githubusercontent.com/devangb5/concept/main/people_article.html";

    const response = await axios.get(templateUrl);
    const template = response.data;

    const imageHTML = generateImageHTML(personData.image);
    const firstImageUrl = getFirstImageUrl(personData.image);

    let populatedTemplate = template
        .replace(/{{name}}/g, personData.name || "Unnamed")
        .replace(/{{description}}/g, personData.description || "No description available")
        .replace(/{{image}}/g, imageHTML)
        .replace(/{{url}}/g, `${req.protocol}://${req.get("host")}${req.originalUrl}`)
        // Replace meta image tags explicitly
        .replace(/<meta property="og:image" content='{{meta_image}}'>/g,
            `<meta property="og:image" content='${firstImageUrl}'>`)
        .replace(/<meta name="twitter:image" content='{{meta_image}}'>/g,
            `<meta name="twitter:image" content='${firstImageUrl}'>`);

    const contentHTML = formatContentArray(personData.content);
    populatedTemplate = populatedTemplate.replace(/{{content}}/g, contentHTML);

    res.send(populatedTemplate);
  } catch (error) {
    console.error("Error fetching person:", error.message);
    res.status(404).send("Person not found");
  }
});

/**
 * Route to serve a server-rendered link map page
 */
app.get("/assets/link-map", async (req, res) => {
  try {
    const now = new Date();

    // --- Fetch blogs ---
    const blogSnapshot = await db.collection("blogs")
        .orderBy("createdAt", "desc")
        .get();

    const blogs = [];
    blogSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = (data.createdAt && typeof data.createdAt.toDate === "function")?
      data.createdAt.toDate():
      new Date(data.createdAt);
      if (createdAt <= now) {
        blogs.push({
          id: doc.id,
          type: "blog",
          title: data.title || "Untitled",
          description: data.description || "",
          blog_number: data.blog_number,
          image: Array.isArray(data.image) ? data.image[0] : (data.image || "default-image.jpg"),
          createdAt,
        });
      }
    });

    // --- Fetch people ---
    const peopleSnapshot = await db.collection("people")
        .orderBy("createdAt", "desc")
        .get();

    const people = [];
    peopleSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = (data.createdAt && typeof data.createdAt.toDate === "function")?
      data.createdAt.toDate():
      new Date(data.createdAt);
      if (createdAt <= now) {
        people.push({
          id: doc.id,
          type: "person",
          name: data.name || "Unnamed",
          image: Array.isArray(data.image) ? data.image[0] : (data.image || "default-image.jpg"),
          createdAt,
        });
      }
    });

    // --- Combine and sort all items by createdAt descending ---
    const allItems = [...blogs, ...people];
    allItems.sort((a, b) => b.createdAt - a.createdAt);

    // --- Determine the recent blog and grid items ---
    let recentBlog = null;
    const gridItems = [];

    allItems.forEach((item) => {
      if (!recentBlog && item.type === "blog") {
        // first blog is recent
        recentBlog = {
          ...item,
          url: `https://blogs.aroundtheville.com/blogs/${item.blog_number}`,
        };
      } else {
        const url = item.type === "blog"?
        `https://blogs.aroundtheville.com/blogs/${item.blog_number}`:
        `https://people.aroundtheville.com/people/${item.id}`;
        gridItems.push({...item, url});
      }
    });

    // --- HTML template ---
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Link Map</title>
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TYCR7B2T5J"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TYCR7B2T5J');
</script>
<style>
body {
  font-family: Georgia, serif;
  background: #000;
  color: #fff;
  margin: 0;
  padding: 0 10px;
  text-align: center;
}

header {
  padding: 20px 0;
}
.logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid #555;
  object-fit: cover;
}
h1 {
  margin: 10px 0;
  font-size: 1.4rem;
}

/* Main links */
.link-btn {
  display: block;
  margin: 10px auto;
  padding: 12px 20px;
  background: #111;
  border: 1px solid #fff;
  border-radius: 25px;
  text-decoration: none;
  color: #fff;
  font-size: 1rem;
  max-width: 300px;
}

/* Recent Blog Card */
.recent {
  margin: 20px auto;
  max-width: 250px;
  text-align: center;
}
.recent-grid {
  margin: 20px auto;
  
  text-align: center;
}
.recent-grid h2 {
  font-size: 1rem;
  color: #aaa;
  margin-bottom: 15px;
}
.recent h2 {
  font-size: 1rem;
  color: #aaa;
  margin-bottom: 15px;
}
.recent-card {
  display: block;
  position: relative;
  margin: 0 auto 20px auto;
  background: #111;
  border-radius: 15px;
  border: 3px solid #ccc; /* highlight recent */
  overflow: hidden;
  text-decoration: none;
  color: #fff;
  max-width: 100%;
  box-shadow: 0 5px 15px rgba(255,255,255,0.1);
}
.recent-card img {
  width: 100%;
  object-fit: cover;
  aspect-ratio: 1/1;
  border-radius: 12px 12px 0 0;
}
.recent-card h3 {
  margin: 10px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
}
.recent-card .badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6347;
  color: #fff;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 10px;
}

/* Grid for older blogs and people */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 5px;
  margin: 20px 0;
}
.grid a {
  display: block;
  text-decoration: none;
  color: #fff;
}
.grid img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 12px;
  transition: transform 0.2s ease;
}
.grid img:hover { transform: scale(1.05); }

/* Media query for larger screens */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* 3 columns fixed */
    gap: 15px; /* more spacing */
    max-width: 960px; /* center grid and limit total width */
    margin: 20px auto;
  }
  .grid img {
    width: 100%; 
    height: auto; /* height adjusts to keep square via aspect-ratio */
  }
}
</style>
</head>
<body>
<header>
  <img src="https://aroundtheville.com/assets/link-map/logo_final.png" alt="Logo" class="logo">
  <h1>Around The Ville</h1>
</header>

<!-- Highlighted Recent Blog -->
${recentBlog ? `
<div class="recent">
  <h2>Recent Article</h2>
  <a href="${recentBlog.url}" class="recent-card">
    <img src="${recentBlog.image}" alt="${recentBlog.title}">
    <h3>${recentBlog.title}</h3>
  </a>
</div>` : ""}

<!-- Main Links -->
<a href="https://aroundtheville.com" class="link-btn">Visit Website</a>
<a href="https://aroundtheville.com/people.html" class="link-btn">People of Louisville</a>
<a href="https://aroundtheville.com/blogs.html" class="link-btn">All Stories</a>

<!-- Grid with older blogs + people -->
<div class="recent-grid">
  <h2>Click on an image to read the full article!</h2>
  <div class="grid">
    ${gridItems.map((item) => `
      <a href="${item.url}">
        <img src="${item.image}" alt="${item.type === "blog" ? item.title : item.name}">
      </a>
    `).join("")}
  </div>
</div>
</body>
</html>
`;

    res.set("Cache-Control", "public, max-age=300, s-maxage=600"); // cache for performance
    res.send(html);
  } catch (error) {
    console.error("Error generating link map:", error);
    res.status(500).send("Error loading link map");
  }
});

exports.app = functions.https.onRequest(app);
// Start the server locally if running directly
const PORT = process.env.PORT || 5500;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
