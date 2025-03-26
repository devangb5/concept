const express = require("express");
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios");

// Initialize Firebase Admin SDK with the service account
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configure CORS options
const corsOptions = {
  origin: ["https://blogs.aroundtheville.com", "https://aroundtheville.com", "https://people.aroundtheville.com"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

/**
 * Fetch and render a blog article.
 */
app.get("/blogs/:blog_number", async (req, res) => {
  const blogNumber = req.params.blog_number;
  console.log(`Fetching blog with number: ${blogNumber}`);

  try {
    const blogData = await fetchBlogData(blogNumber);

    // GitHub URL for the raw template file
    const templateUrl =
      "https://raw.githubusercontent.com/devangb5/concept/main/article.html";

    // Fetch the template from GitHub
    const response = await axios.get(templateUrl);
    const template = response.data;

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
    console.error("Error fetching blog:", error.message);
    res.status(404).send("Blog not found");
  }
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
 ** Fetch and render a person's profile.*/
app.get("/people/:person_id", async (req, res) => {
  const personId = req.params.person_id;
  console.log(`Fetching profile for person ID: ${personId}`);

  try {
    const personData = await fetchPersonData(personId);

    // GitHub URL for the raw template file for person profile
    const templateUrl = "https://raw.githubusercontent.com/devangb5/concept/main/people_article.html";

    // Fetch the template from GitHub
    const response = await axios.get(templateUrl);
    const template = response.data;

    // Populate the HTML template with dynamic content
    let populatedTemplate = template
        .replace(/{{name}}/g, personData.name || "Unnamed")
        .replace(/{{description}}/g, personData.description || "No description available")
        .replace(/{{image}}/g, personData.image || "default-image.jpg")
        .replace(/{{url}}/g, `${req.protocol}://${req.get("host")}${req.originalUrl}`);
    // Build the content for the blog from the 'content' array
    const contentHTML = formatContentArray(personData.content);
    populatedTemplate = populatedTemplate.replace(/{{content}}/g, contentHTML);

    // Send the populated template as the response
    res.send(populatedTemplate);
  } catch (error) {
    console.error("Error fetching person:", error.message);
    res.status(404).send("Person not found");
  }
});

/**
 * Fetches person details.
 * @param {string} personId - The unique ID of the person.
 * @return {Promise<Object>} The person's details.
 */
async function fetchPersonData(personId) {
  const personSnapshot = await db.collection("people").doc(personId).get();
  if (!personSnapshot.exists) {
    throw new Error("Person not found");
  }
  return personSnapshot.data();
}

/**
 * Formats an array of content items into HTML.
 * @param {Array<Object>} contentArray - The array of content items.
 * @return {string} The formatted HTML string.
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

exports.app = functions.https.onRequest(app);

// Start the server locally if running directly
const PORT = process.env.PORT || 5500;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
