const express = require("express");
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

// Middleware to serve static files from the appropriate directories
app.use(express.static(path.join(__dirname, ".."))); // Serve static files from 'assets'

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

exports.app = functions.https.onRequest(app);

// Open a port for local development (only if not in a Firebase environment)
if (!process.env.FUNCTIONS_EMULATOR && !process.env.FUNCTIONS_RUNTIME) {
  const PORT = process.env.PORT || 5500;
  app.listen(PORT, () => {
    console.log(`Server is running locally on http://localhost:${PORT}`);
  });
}
