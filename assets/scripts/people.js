import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";




// Function to Load Featured and Recent People
async function loadFeaturedAndRecentPeople() {
    const peopleCollection = collection(db, "people");
    const querySnapshot = await getDocs(peopleCollection);
    const now = new Date();
    let people = [];

    querySnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (createdAt <= now) {
            people.push({ id: doc.id, ...data });
        }
    });

    // Sort by timestamp descending
    let sortedPeople = people.sort((a, b) => b.timestamp - a.timestamp);

    // Get the top 4 recent people
    let featuredAndRecent = sortedPeople.slice(0, 4);

    // Update HTML
    document.querySelector('.featured-recent-grid').innerHTML = featuredAndRecent.map(person => `
        <div class="featured-recent-card">
            <a href="https://people.aroundtheville.com/people/${person.id}">
                <img src="${person.image}" alt="${person.name}" class="person-image">
            </a>
        </div>
    `).join('');
}

// Flag to prevent fetching after reaching the bottom
let hasFetchedRelatedArticles = false;

// Function to fetch and display random related articles
async function fetchRelatedArticles() {
    if (hasFetchedRelatedArticles) return;

    try {
        const blogsRef = collection(db, "people");
        const querySnapshot = await getDocs(blogsRef);
        const now = new Date();

        if (querySnapshot.empty) {
            console.log("No blogs found.");
            return;
        }

        let allPeople = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            if (createdAt <= now) {
                allPeople.push({ id: doc.id, ...data });
            }
        });

        // Shuffle and pick 3
        allPeople = shuffleArray(allPeople);
        const randomPeople = allPeople.slice(0, 3);

        let relatedArticlesHTML = "<h3>Related Articles</h3>";
        randomPeople.forEach(person => {
            relatedArticlesHTML += `
                <div class="related-article">
                    <a href="https://people.aroundtheville.com/people/${person.id}">
                        <img src="${person.image}" alt="${person.name}" class="related-article-image">
                        <p>${person.name}</p>
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
// Call the function to load people on page load
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedAndRecentPeople();
    fetchRelatedArticles();
    initializeSocialMediaLinks();
});