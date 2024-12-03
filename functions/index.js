const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs/promises"); // Use promises for async operations
const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK with the service account
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Enable CORS for your domain
const corsOptions = {
  origin: "https://devangb5.github.io/concept/", // Allow this origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
  credentials: true, // Allow cookies or authentication headers
};

app.use(cors(corsOptions)); // Use cors middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, ".."))); // Serve static files from 'assets'

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

    // Path to the HTML template
    const templatePath = path.join(__dirname, "..", "article.html");

    // Check if the template file exists
    try {
      const template = await fs.readFile(templatePath, "utf8");

      // Populate the HTML template
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
    } catch (readError) {
      console.error("Template file read error:", readError.message);
      res.status(500).send("Template file not found or read error.");
    }
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(404).send(error.message || "Blog not found");
  }
});

// Route to handle the POST request for fetching blog number based on URL path
app.post("/cloudfunctions/app", async (req, res) => {
  const {url} = req.body; // Get the current URL path from the request body
  const blogNumber = extractBlogNumberFromPath(url); // Extract the blog number from the URL

  try {
    await fetchBlogData(blogNumber); // Check if blog exists to avoid unused variable warning
    res.json({blogNumber}); // Respond with the blog number
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(404).json({message: "Blog not found"}); // Respond with a 404 status
  }
});

// Helper function to extract blog number from the URL path
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