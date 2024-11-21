import { db } from './firebaseConfig.js';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";



// Function to fetch the latest blog
async function fetchLatestBlog() {
    try {
        const blogsRef = collection(db, "blogs");
        const latestBlogQuery = query(blogsRef, orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(latestBlogQuery);

        if (querySnapshot.empty) {
            console.log("No blogs found!");
            document.getElementById("latest-articles-grid").innerHTML = "<p>No blog posts available.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const latestBlogHTML = `
                <div class="article-card">
                    <img src="${data.image}" alt="${data.title}" class="article-image">
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <a href="article.html?blog_number=${data.blog_number}" class="read-more">Read More</a>
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
            where("category", "==", category),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(categoryQuery);

        if (querySnapshot.empty) {
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
                    <a href="article.html?blog_number=${data.blog_number}" class="read-more">Read More</a>
                </div>
            `;
        });
        document.getElementById("category-articles-grid").innerHTML = blogsHTML;
    } catch (error) {
        console.error("Error fetching blogs by category:", error);
        document.getElementById("category-articles-grid").innerHTML = "<p>Error loading blog posts. Please try again later.</p>";
    }
}

// Function to fetch Instagram posts
async function fetchInstagramPosts() {
    try {
        const postsRef = collection(db, "blogs");
        const postsQuery = query(postsRef, orderBy("createdAt", "desc"), limit(6));
        const querySnapshot = await getDocs(postsQuery);

        if (querySnapshot.empty) {
            console.log("No Instagram posts found!");
            return;
        }

        let feedHTML = "";
        querySnapshot.forEach(doc => {
            const data = doc.data();
            feedHTML += `
                <div class="feed-item">
                    <img src="${data.image}" alt="Instagram Post">
                </div>
            `;
        });
        document.querySelector(".feed-grid").innerHTML = feedHTML;
    } catch (error) {
        console.error("Error fetching Instagram posts:", error);
    }
}

// Handle form submission for email signup
document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const formMessage = document.getElementById("form-message");

    if (email) {
        try {
            await addDoc(collection(db, "subscribers"), { email });
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
const categoryItems = document.querySelectorAll(".category-item-container");

categoryItems.forEach(item => {
    item.addEventListener("click", function () {
        const isSelected = item.classList.contains("selected");
        categoryItems.forEach(i => i.classList.remove("selected"));

        if (!isSelected) {
            item.classList.add("selected");
            const selectedCategory = item.getAttribute("data-category");
            fetchBlogsByCategory(selectedCategory);
        } else {
            document.getElementById("category-articles-grid").innerHTML = "<p>Select a category to explore blogs.</p>";
        }
    });
});

// Initial calls to fetch data on page load
fetchLatestBlog();
fetchInstagramPosts();

