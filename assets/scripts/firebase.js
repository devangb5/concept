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
                    <a href="https://blogs.aroundtheville.com/blogs/${data.blog_number}" class="read-more">Read More</a>
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
                    <a href="https://blogs.aroundtheville.com/blogs/${data.blog_number}" class="read-more">Read More</a>
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
        let allPosts = [];

        // Fetch posts from the "blogs" collection
        const blogsRef = collection(db, "blogs");
        const blogsQuery = query(blogsRef, orderBy("createdAt", "desc")); // No limit here
        const blogsSnapshot = await getDocs(blogsQuery);

        if (!blogsSnapshot.empty) {
            blogsSnapshot.forEach(doc => {
                const data = doc.data();
                allPosts.push({ ...data, collection: 'blogs' });
            });
        }

        // Fetch posts from the "people" collection
        const peopleRef = collection(db, "people");
        const peopleQuery = query(peopleRef, orderBy("createdAt", "desc")); // No limit here
        const peopleSnapshot = await getDocs(peopleQuery);

        if (!peopleSnapshot.empty) {
            peopleSnapshot.forEach(doc => {
                const data = doc.data();
                allPosts.push({ ...data, collection: 'people' });
            });
        }

        // Combine and sort all posts by createdAt
        allPosts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // Get the top 6 posts
        const topSixPosts = allPosts.slice(0, 6);

        if (topSixPosts.length === 0) {
            console.log("No posts found in either 'blogs' or 'people' collection!");
            return;
        }

        let feedHTML = "";
        topSixPosts.forEach(post => {
            feedHTML += `
                <div class="feed-item">
                    <img src="${post.image}" alt="${post.collection} Post">
                </div>
            `;
        });
        document.querySelector(".feed-grid").innerHTML = feedHTML;

    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}



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

