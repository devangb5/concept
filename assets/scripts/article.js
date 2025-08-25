import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { db } from './firebaseConfig.js';


function getFirstImageUrl(imageData) {
  if (!imageData) {
    return "https://aroundtheville.com/default-image.jpg"; // default fallback
  }
  if (typeof imageData === "string") {
    return imageData;
  }
  if (Array.isArray(imageData) && imageData.length > 0) {
    return imageData[0];
  }
  return "https://aroundtheville.com/default-image.jpg"; // fallback
}
// Flag to prevent fetching after reaching the bottom
let hasFetchedRelatedArticles = false;

async function fetchRelatedArticles() {
  if (hasFetchedRelatedArticles) {
    return;
  }

  try {
    const now = new Date();
    const blogsRef = collection(db, "blogs");

    // Query blogs where createdAt > now
    const blogsQuery = query(blogsRef, where("createdAt", ">", now));
    const querySnapshot = await getDocs(blogsQuery);

    if (querySnapshot.empty) {
      console.log("No blogs found after current date.");
      return;
    }

    let allBlogs = [];
    querySnapshot.forEach((doc) => {
      allBlogs.push(doc.data());
    });

    allBlogs = shuffleArray(allBlogs);
    const randomBlogs = allBlogs.slice(0, 3);

    let relatedArticlesHTML = "<h3>Related Articles</h3>";
    randomBlogs.forEach(blog => {
      const firstImage = getFirstImageUrl(blog.image);
      relatedArticlesHTML += `
        <div class="related-article">
          <a href="https://blogs.aroundtheville.com/blogs/${blog.blog_number}">
            <img src="${firstImage}" alt="${blog.title}" class="related-article-image">
            <p>${blog.title}</p>
          </a>
        </div>
      `;
    });

    document.getElementById("related-articles").innerHTML = relatedArticlesHTML;
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
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.width = progress + "%";

    // Handle sticky progress bar appearance
    const progressBarContainer = document.getElementById("progress-bar-container");
    if (scrollPos > 100) { // Adjust the scroll position for the sticky effect
        progressBarContainer.style.display = 'block'; // Show progress bar
        document.querySelector('h1').style.borderBottom = 'none'; // Hide the underline from the heading
        progressBarContainer.classList.add('sticky-progress'); // Make it sticky
    } else {
        progressBarContainer.style.display = 'none'; // Hide progress bar when top
        document.querySelector('h1').style.borderBottom = '4px solid #bdc3c7'; // Show the original underline on heading
        progressBarContainer.classList.remove('sticky-progress'); // Remove sticky effect
    }

    // Detect if the user reached the end of the article
    if (scrollPos + winHeight >= docHeight) {
        fetchRelatedArticles();
    }
});


// Fetch related articles when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchRelatedArticles();
});

// Function to update social media share links
function updateSocialMediaLinks(url) {
    const socialLinks = {
        twitter: `https://twitter.com/share?url=${encodeURIComponent(url)}`,
        facebook: `https://facebook.com/share?url=${encodeURIComponent(url)}`,
        instagram: `https://www.instagram.com/?url=${encodeURIComponent(url)}`, // Updated for Instagram (Linking profile or post)
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

// Call this function to update social media links when the article is loaded
function initializeSocialMediaLinks() {
    const articleUrl = window.location.href; // Get current URL for sharing
    updateSocialMediaLinks(articleUrl); // Update the social links
}

// Run the function to initialize social media links when the document is ready
document.addEventListener('DOMContentLoaded', initializeSocialMediaLinks);