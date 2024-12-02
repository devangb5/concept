const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK with the service account
const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Middleware to serve static files from the appropriate directories
app.use(express.static(path.join(__dirname, ".."))); // Serve static files from 'assets'

// Helper function to fetch blog data from Firestore
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

// Helper function to format content array
function formatContentArray(contentArray) {
    return contentArray
        .map(item => {
            let textHTML = Array.isArray(item.text)
                ? item.text.map(paragraph => `<p>${paragraph}</p>`).join("") 
                : `<p>${item.text}</p>`;
                
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

        // Fetch related articles based on the blog's category
        

        // Path to the HTML template
        const templatePath = path.join(__dirname, "..", "article.html");

        // Check if the template file exists
        if (!fs.existsSync(templatePath)) {
            console.error("Template file not found.");
            return res.status(500).send("Template file not found.");
        }

        // Read and populate the HTML template
        let template = fs.readFileSync(templatePath, "utf8");
        template = template
            .replace(/{{title}}/g, blogData.title || "Untitled")
            .replace(/{{description}}/g, blogData.description || "No description available")
            .replace(/{{image}}/g, blogData.image || "default-image.jpg")
            .replace(/{{url}}/g, `${req.protocol}://${req.get("host")}${req.originalUrl}`)
            

        // Build the content for the blog from the 'content' array
        const contentHTML = formatContentArray(blogData.content);
        template = template.replace(/{{content}}/g, contentHTML);

        // Send the populated template as the response
        res.send(template);
    } catch (error) {
        console.error("Error fetching blog:", error.message);
        res.status(404).send(error.message || "Blog not found");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
