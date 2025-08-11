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
 * Generate HTML for a single image or a multiple images slideshow.
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
              }; max-height: 500px; object-fit: cover;">`,
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

          // Removed automatic slideshow interval
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
        const textHTML = Array.isArray(item.text) ?
         item.text.map((paragraph) => `<p>${paragraph}</p>`).join("") :
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

    let populatedTemplate = template
        .replace(/{{title}}/g, blogData.title || "Untitled")
        .replace(
            /{{description}}/g,
            blogData.description || "No description available",
        )
        .replace(/{{image}}/g, imageHTML)
        .replace(
            /{{url}}/g,
            `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        );

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

    let populatedTemplate = template
        .replace(/{{name}}/g, personData.name || "Unnamed")
        .replace(
            /{{description}}/g,
            personData.description || "No description available",
        )
        .replace(/{{image}}/g, imageHTML)
        .replace(
            /{{url}}/g,
            `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        );

    const contentHTML = formatContentArray(personData.content);
    populatedTemplate = populatedTemplate.replace(/{{content}}/g, contentHTML);

    res.send(populatedTemplate);
  } catch (error) {
    console.error("Error fetching person:", error.message);
    res.status(404).send("Person not found");
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
