const express = require("express");
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios"); // Use axios to fetch raw assets from GitHub

// Initialize Firebase Admin SDK with the service account
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configure CORS options
const corsOptions = {
  origin: "https://blogs.aroundtheville.com", // Allow all origins for testing
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions)); // Use cors middleware
app.use(express.json()); // Middleware to parse JSON bodies

app.get("/", (req, res) => {
  res.send("CORS-enabled function is working!");
});

/**
 * Fetch blog data from Firestore.
 * @param {string} blogNumber - The number of the blog to fetch.
 * @return {Promise<Object>} The blog data.
 * @throws {Error} If the blog is not found.
 */
async function fetchBlogData(blogNumber) {
  try {
    const blogSnapshot = await db
        .collection("blogs")
        .where("blog_number", "==", blogNumber)
        .limit(1)
        .get();

    if (blogSnapshot.empty) {
      throw new Error("Blog not found");
    }

    return blogSnapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching blog data:", error);
    throw error; // Re-throw the error to be handled by the calling function
  }
}

/**
 * Format an array of content items into HTML.
 * @param {Array<Object>} contentArray - The array of content items.
 * @return {string} The formatted HTML string.
 */
function formatContentArray(contentArray) {
  return contentArray
      .map((item) => {
        const textHTML = Array.isArray(item.text)?
        item.text.map((paragraph) => `<p>${paragraph}</p>`).join(""):
        `<p>${item.text}</p>`;

        return `<h2>${item.heading}</h2>${textHTML}`;
      })
      .join(""); // Join all formatted content into a single string
}

// Route to fetch and render a blog article
app.get("/blogs/:blog_number", async (req, res) => {
  const blogNumber = req.params.blog_number;
  console.log(`Fetching blog with number: ${blogNumber}`);

  try {
    const blogData = await fetchBlogData(blogNumber);

    // GitHub URL for the raw template file
    const templateUrl = "https://raw.githubusercontent.com/devangb5/concept/main/article.html";

    try {
      // Fetch the template from GitHub
      const response = await axios.get(templateUrl);
      const template = response.data; // This is the HTML template

      // Populate the HTML template with dynamic content
      let populatedTemplate = template
          .replace(/{{title}}/g, blogData.title || "Untitled")
          .replace(/{{description}}/g, blogData.description || "No description available")
          .replace(/{{image}}/g, blogData.image || "default-image.jpg")
          .replace(/{{url}}/g, `${req.protocol}://${req.get("host")}${req.originalUrl}`);

      // Build the content for the blog from the 'content' array
      const contentHTML = formatContentArray(blogData.content);
      populatedTemplate = populatedTemplate.replace(/{{content}}/g, contentHTML);

      // Send the populated template as the response
      res.send(populatedTemplate);
    } catch (error) {
      console.error("Error fetching template from GitHub:", error.message);
      res.status(500).send("Template file not found or read error.");
    }
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(404).send(error.message || "Blog not found");
  }
});

// Route to handle the POST request for fetching blog number based on URL path
app.post("/blogs", async (req, res) => {
  const {url} = req.body;
  const blogNumber = extractBlogNumberFromPath(url);

  if (!blogNumber) {
    return res.status(400).json({message: "Invalid blog URL"});
  }

  try {
    await fetchBlogData(blogNumber);
    res.json({blogNumber});
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(404).json({message: "Blog not found"});
  }
});

/**
 * Extracts the blog number from a given URL path.
 * @param {string} path - The URL path to extract the blog number from.
 * @return {string|null} The blog number or null if not found.
 */
function extractBlogNumberFromPath(path) {
  const match = path.match(/\/blogs\/(\d+)/);
  return match ? match[1] : null; // Returns the blog number or null if not found
}


exports.app = functions.https.onRequest(app);

// Start the server locally if running directly (not deployed)
const PORT = process.env.PORT || 5500; // Use environment port or default to 3000
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
