import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { db } from './firebaseConfig.js';



// Function to fetch and display the blog
async function fetchAndDisplayBlog() {
    const params = new URLSearchParams(window.location.search);
    const blogNumber = params.get("blog_number");

    if (!blogNumber) {
        document.getElementById("blog-content").innerHTML = "<p>Blog number is missing in the URL.</p>";
        return;
    }

    try {
        const blogsRef = collection(db, "blogs");
        const blogQuery = query(blogsRef, where("blog_number", "==", blogNumber));
        const querySnapshot = await getDocs(blogQuery);

        if (querySnapshot.empty) {
            console.error(`Blog not found with ID: ${blogNumber}`);
            document.getElementById("blog-content").innerHTML = `<p>Blog not found. Please try again later.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Create HTML for the blog
            let blogHTML = `
                <h1>${data.title}</h1>
                <img src="${data.image}" alt="${data.title}" class="blog-image">
            `;

            // Iterate through the sections in the "content" field
            data.content.forEach((content) => {
                blogHTML += `
                    <div class="section">
                        <h2>${content.heading}</h2>
                `;

                // Handle content.text: if it's an array, iterate over it; if it's a string, just display it
                if (Array.isArray(content.text)) {
                    // If content.text is an array, iterate through paragraphs
                    content.text.forEach((paragraph) => {
                        blogHTML += `<p>${paragraph}</p>`;
                    });
                } else {
                    // If content.text is a string, display it as a single paragraph
                    blogHTML += `<p>${content.text}</p>`;
                }

                blogHTML += `</div>`;
            });

            document.getElementById("blog-content").innerHTML = blogHTML;
        });
    } catch (error) {
        console.error("Error fetching blog:", error);
        document.getElementById("blog-content").innerHTML = "<p>Error loading blog. Please try again later.</p>";
    }
}

// Call the function when the page loads
fetchAndDisplayBlog();
