import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_M3kGDf-esoqMDLnxfYQ4CV8-xboYQwA",
    authDomain: "around-the-ville.firebaseapp.com",
    projectId: "around-the-ville",
    storageBucket: "around-the-ville.firebasestorage.app",
    messagingSenderId: "431313384928",
    appId: "1:431313384928:web:d4693371a9e0083d1f6785"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch the latest blog
async function fetchLatestBlog() {
    try {
        const blogsRef = collection(db, "blogs");
        const latestBlogQuery = query(blogsRef, orderBy("createdAt", "desc"), limit(1)); // Fetch the latest blog
        const querySnapshot = await getDocs(latestBlogQuery);

        if (querySnapshot.empty) {
            console.log("No blogs found!");
            document.getElementById("latest-articles-grid").innerHTML = "<p>No blog posts available.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Fetched Latest Blog Data: ", data); // Debugging line
            const latestBlogHTML = `
                <div class="article-card">
                    <img src="${data.image}" alt="${data.title}" class="article-image">
                    <h3>${data.title}</h3>
                    <p >${data.description}</p>
                    <a href="${data.link}" class="read-more">Read More</a>
                </div>
            `;
            document.getElementById("latest-articles-grid").innerHTML = latestBlogHTML;
        });
    } catch (error) {
        console.error("Error fetching the latest blog:", error);
        document.getElementById("latest-articles-grid").innerHTML = "<p>Error loading blog post. Please try again later.</p>";
    }
}

// Function to fetch blogs by category
async function fetchBlogsByCategory(category) {
    try {
        const blogsRef = collection(db, "blogs");
        const categoryQuery = query(
            blogsRef,
            where("category", "==", category),  // Filter blogs by category
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(categoryQuery);

        if (querySnapshot.empty) {
            console.log("No blogs found for this category.");
            document.getElementById("category-articles-grid").innerHTML = "<p>No blog posts available for this category.</p>";
            return;
        }

        let blogsHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            blogsHTML += `
                <div class="article-card">
                    <img src="${data.image}" alt="${data.title}" class="article-image">
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <a href="${data.link}" class="read-more">Read More</a>
                </div>
            `;
        });
        document.getElementById("category-articles-grid").innerHTML = blogsHTML;
    } catch (error) {
        console.error("Error fetching blogs by category:", error);
        document.getElementById("category-articles-grid").innerHTML = "<p>Error loading blog posts. Please try again later.</p>";
    }
}

// Call the function to fetch the latest blog when the page loads
fetchLatestBlog();

// Handle form submission for email signup
document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const formMessage = document.getElementById("form-message");

    if (email) {
        try {
            // Add email to Firestore (for signing up to updates)
            await addDoc(collection(db, 'subscribers'), {
                email: email
            });

            formMessage.textContent = "Thank you for signing up! We'll keep you updated.";
            formMessage.style.color = "green";
        } catch (error) {
            formMessage.textContent = "Error: " + error.message;
            formMessage.style.color = "red";
        }
    } else {
        formMessage.textContent = "Please enter a valid email.";
        formMessage.style.color = "red";
    }
});

// Add event listeners to category items
const categoryItems = document.querySelectorAll('.category-item-container');

categoryItems.forEach(item => {
    item.addEventListener('click', function () {
        const isSelected = item.classList.contains('selected');

        // Remove 'selected' class from all items
        categoryItems.forEach(i => i.classList.remove('selected'));

        if (!isSelected) {
            // If the clicked category was not selected, select it
            item.classList.add('selected');
            const selectedCategory = item.getAttribute('data-category');
            fetchBlogsByCategory(selectedCategory); // Fetch blogs for the selected category
        } else {
            // If it was already selected, clear the content grid
            document.getElementById("category-articles-grid").innerHTML = "<p>Select a category to explore blogs.</p>";
        }
    });
});

// Function to fetch Instagram posts
async function fetchInstagramPosts() {
    try {
        const postsRef = collection(db, "blogs");
        const postsQuery = query(postsRef, orderBy("createdAt", "desc"), limit(6)); // Fetch the latest 6 posts
        const querySnapshot = await getDocs(postsQuery);

        if (querySnapshot.empty) {
            console.log("No Instagram posts found!");
            return;
        }

        let feedHTML = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            feedHTML += `
                <div class="feed-item">
                    <img src="${data.image}" alt="Instagram Post">
                </div>
            `;
        });

        // Update the feed grid with Instagram posts
        document.querySelector(".feed-grid").innerHTML = feedHTML;
    } catch (error) {
        console.error("Error fetching Instagram posts:", error);
    }
}

// Call the function to load the posts on page load
fetchInstagramPosts();