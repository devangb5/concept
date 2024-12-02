import { db } from './firebaseConfig.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

/**
 * Fetch all blogs from Firebase and sort them by blog_number in descending order.
 * @returns {Promise<Array>} - An array of blog objects.
 */
async function fetchBlogs() {
    try {
        const blogsRef = collection(db, "blogs");
        const querySnapshot = await getDocs(blogsRef);
        const blogs = [];
        querySnapshot.forEach(doc => {
            blogs.push({ id: doc.id, ...doc.data() });
        });

        // Sort blogs by blog_number in descending order
        return blogs.sort((a, b) => b.blog_number - a.blog_number);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return [];
    }
}

/**
 * Display blogs in the container.
 * @param {Array} blogs - Array of blog objects to display.
 */
function displayBlogs(blogs) {
    const container = document.getElementById("blogs-grid");
    if (!container) return;

    container.innerHTML = blogs.length > 0
        ? blogs.map(blog => `
            <div class="blog-card">
                <img src="${blog.image}" alt="${blog.title}" class="blog-image" />
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-description">${blog.description}</p>
                <a href="/blogs/${blog.blog_number}" class="read-more">Read More</a>
                
            </div>
        `).join('')
        : `<p class="no-results">No blogs found.</p>`;
}

/**
 * Filter blogs based on the search query and selected category.
 * @param {Array} blogs - Array of all blogs.
 * @param {string} query - Search query.
 * @param {string} category - Selected category.
 * @returns {Array} - Filtered blogs.
 */
function filterBlogs(blogs, query, category) {
    return blogs.filter(blog => {
        const matchesQuery = blog.title.toLowerCase().includes(query.toLowerCase()) ||
            blog.description.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "" || blog.category?.toLowerCase() === category.toLowerCase();
        return matchesQuery && matchesCategory;
    });
}

/**
 * Debounce function to limit the rate of function calls.
 * @param {Function} func - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} - Debounced function.
 */
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Initialize blogs on page load
document.addEventListener("DOMContentLoaded", async () => {
    const allBlogs = await fetchBlogs();
    displayBlogs(allBlogs);

    const searchInput = document.getElementById("search-input");
    const filterIcon = document.getElementById("filter-icon");
    const categoryMenu = document.getElementById("category-menu");
    const categoryButtons = document.getElementById("category-buttons"); // Category buttons for smaller screens
    let selectedCategory = "";

    // Toggle category menu visibility
    filterIcon.addEventListener("click", () => {
        categoryMenu.classList.toggle("hidden");
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (event) => {
        if (!categoryMenu.contains(event.target) && !filterIcon.contains(event.target)) {
            categoryMenu.classList.add("hidden");
        }
    });

    // Handle category selection
    categoryMenu.addEventListener("click", (event) => {
        if (event.target.classList.contains("category-option")) {
            selectedCategory = event.target.dataset.category;
            categoryMenu.classList.add("hidden"); // Hide menu after selection
            updateDisplayedBlogs();
        }
    });

    // Handle category selection for smaller screens
    categoryButtons.addEventListener("click", (event) => {
        if (event.target.classList.contains("category-option")) {
            selectedCategory = event.target.dataset.category;
            updateDisplayedBlogs();
        }
    });

    // Update displayed blogs
    const updateDisplayedBlogs = debounce(() => {
        const query = searchInput.value.trim();
        const filteredBlogs = filterBlogs(allBlogs, query, selectedCategory);
        displayBlogs(filteredBlogs);
    }, 300); // Adjust debounce delay as needed

    // Search input listener
    searchInput.addEventListener("input", updateDisplayedBlogs);
});
