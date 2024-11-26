import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { db } from './firebaseConfig.js';

// Flag to prevent fetching after reaching the bottom
let hasFetchedRelatedArticles = false;

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

        let blogHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Create HTML for the blog
            blogHTML += `
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
                    content.text.forEach((paragraph) => {
                        blogHTML += `<p>${paragraph}</p>`;
                    });
                } else {
                    blogHTML += `<p>${content.text}</p>`;
                }

                blogHTML += `</div>`;
            });

            // Update Meta tags dynamically
            updateMetaTags(data);

            // Update social media share links
            updateSocialMediaLinks(window.location.href);
        });

        document.getElementById("blog-content").innerHTML = blogHTML;

        // Initialize smooth scrolling behavior only for internal anchor links
        document.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Only handle internal anchor links (starting with #)
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error fetching blog:", error);
        document.getElementById("blog-content").innerHTML = "<p>Error loading blog. Please try again later.</p>";
    }
}

// Function to update the meta tags dynamically
function updateMetaTags(data) {
    // Set page title dynamically
    document.title = data.title;

    // Update Open Graph meta tags
    document.querySelector('meta[property="og:title"]').setAttribute('content', data.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', data.description);
    document.querySelector('meta[property="og:image"]').setAttribute('content', data.image);
    document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);

    // Update Twitter Card meta tags
    document.querySelector('meta[name="twitter:title"]').setAttribute('content', data.title);
    document.querySelector('meta[name="twitter:description"]').setAttribute('content', data.description);
    document.querySelector('meta[name="twitter:image"]').setAttribute('content', data.image);
    document.querySelector('meta[name="twitter:url"]').setAttribute('content', window.location.href);
}

// Function to fetch and display random related articles
async function fetchRelatedArticles() {
    // Prevent fetching if articles have already been displayed
    if (hasFetchedRelatedArticles) {
        return;
    }

    try {
        // Fetch all blogs from the "blogs" collection
        const blogsRef = collection(db, "blogs");
        const querySnapshot = await getDocs(blogsRef);

        // If no blogs are found
        if (querySnapshot.empty) {
            console.log("No blogs found.");
            return;
        }

        // Create an array to hold the fetched articles
        let allBlogs = [];
        querySnapshot.forEach((doc) => {
            allBlogs.push(doc.data());
        });

        // Shuffle the array to randomize the order
        allBlogs = shuffleArray(allBlogs);

        // Select the first 3 articles from the shuffled array
        const randomBlogs = allBlogs.slice(0, 3);

        // Prepare HTML content for the related articles
        let relatedArticlesHTML = "<h3>Related Articles</h3>";
        randomBlogs.forEach(blog => {
            relatedArticlesHTML += `
                <div class="related-article">
                    <a href="/article.html?blog_number=${blog.blog_number}">
                        <img src="${blog.image}" alt="${blog.title}" class="related-article-image">
                        <p>${blog.title}</p>
                    </a>
                </div>
            `;
        });

        // Display the related articles in the "related-articles" container
        document.getElementById("related-articles").innerHTML = relatedArticlesHTML;

        // Set flag to true to indicate articles have been fetched
        hasFetchedRelatedArticles = true;

    } catch (error) {
        console.error("Error fetching related articles:", error);
    }
}

// Function to shuffle an array (for randomizing the order)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

// Handle the scroll event for progress bar and related articles fetching
window.addEventListener("scroll", () => {
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPos = window.scrollY;

    // Calculate the scroll progress
    const progress = (scrollPos / (docHeight - winHeight)) * 100;

    // Update progress bar width
    document.getElementById("progress-bar").style.width = progress + "%";

    // Handle sticky progress bar appearance
    if (scrollPos > 100) { // Adjust the scroll position for the sticky effect
        document.getElementById("progress-bar-container").style.display = 'block'; // Show progress bar
        document.querySelector('h1').style.borderBottom = 'none'; // Hide the underline from the heading
        document.getElementById("progress-bar-container").classList.add('sticky-progress'); // Make it sticky
    } else {
        document.getElementById("progress-bar-container").style.display = 'none'; // Hide progress bar when top
        document.querySelector('h1').style.borderBottom = '4px solid #bdc3c7'; // Show the original underline on heading
        document.getElementById("progress-bar-container").classList.remove('sticky-progress'); // Remove sticky effect
    }

    // Detect if the user reached the end of the article
    if (scrollPos + winHeight >= docHeight) {
        fetchRelatedArticles();
    }
});

// Fetch blog and related articles when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayBlog();
    fetchRelatedArticles();
});

// Function to update social media share links
function updateSocialMediaLinks(url) {
    const socialLinks = {
        twitter: `https://twitter.com/share?url=${encodeURIComponent(url)}`,
        facebook: `https://facebook.com/share?url=${encodeURIComponent(url)}`,
        instagram: `https://www.instagram.com/?url=${encodeURIComponent(url)}`,  // Updated for Instagram (Linking profile or post)
        whatsapp: `https://wa.me/?text=${encodeURIComponent(url)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}`,
        email: `mailto:?subject=Check out this article&body=${encodeURIComponent(url)}`
    };

    const shareElements = {
        twitter: document.getElementById('twitter-share'),
        facebook: document.getElementById('facebook-share'),
        instagram: document.getElementById('instagram-share'),  // Updated to Instagram
        whatsapp: document.getElementById('whatsapp-share'),
        pinterest: document.getElementById('pinterest-share'),
        email: document.getElementById('email-share')
    };

    // Update each social link if the element exists
    for (const [platform, link] of Object.entries(socialLinks)) {
        const element = shareElements[platform];
        if (element) {
            element.setAttribute('href', link);
        }
    }
}
