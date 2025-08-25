import { db } from "./firebaseConfig.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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
  
async function loadFeaturedAndRecentPeople() {
  const peopleCollection = collection(db, "people");
  const now = new Date();

  try {
    // Query people where createdAt <= now and order by createdAt descending
    const peopleQuery = query(
      peopleCollection,
      where("createdAt", "<=", now),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(peopleQuery);

    let people = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      people.push({ id: doc.id, ...data, createdAtDate });
    });

    // Take top 4
    let featuredAndRecent = people.slice(0, 4);

    const featuredRecentGrid = document.querySelector('.featured-recent-grid');
    if (featuredRecentGrid) {
      featuredRecentGrid.innerHTML = featuredAndRecent.map(person => {
        const firstImage = getFirstImageUrl(person.image);
        return `
          <div class="featured-recent-card">
            <a href="https://people.aroundtheville.com/people/${person.id}" target="_blank" rel="noopener noreferrer">
              <img src="${firstImage}" alt="${person.name || 'Person image'}" class="person-image">
            </a>
          </div>
        `;
      }).join('');
    } else {
      console.warn("Element with class 'featured-recent-grid' not found.");
    }
  } catch (error) {
    console.error("Error loading featured and recent people:", error);
  }
}

// Flag to prevent fetching after reaching the bottom
let hasFetchedRelatedArticles = false;

// Function to fetch and display random related articles
async function fetchRelatedArticles() {
  if (hasFetchedRelatedArticles) return;

  try {
    const now = new Date();
    const peopleRef = collection(db, "people");

    // Query only published people (createdAt <= now)
    const peopleQuery = query(
      peopleRef,
      where("createdAt", "<=", now),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(peopleQuery);

    if (querySnapshot.empty) {
      console.log("No related articles found in the 'people' collection.");
      return;
    }

    let allPeople = [];
    querySnapshot.forEach((doc) => {
      allPeople.push({ id: doc.id, ...doc.data() });
    });

    // Shuffle and pick 3
    allPeople = shuffleArray(allPeople);
    const randomPeople = allPeople.slice(0, 3);

    let relatedArticlesHTML = "<h3>Related Articles</h3>";
    randomPeople.forEach(person => {
      const firstImage = getFirstImageUrl(person.image);
      relatedArticlesHTML += `
        <div class="related-article">
          <a href="https://people.aroundtheville.com/people/${person.id}" target="_blank" rel="noopener noreferrer">
            <img src="${firstImage}" alt="${person.name || 'Related article image'}" class="related-article-image">
            <p>${person.name || 'Untitled Article'}</p>
          </a>
        </div>
      `;
    });

    const relatedArticlesContainer = document.getElementById("related-articles");
    if (relatedArticlesContainer) {
      relatedArticlesContainer.innerHTML = relatedArticlesHTML;
      hasFetchedRelatedArticles = true;
    } else {
      console.warn("Element with id 'related-articles' not found.");
    }

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
    // Avoid division by zero if docHeight - winHeight is 0 or negative (very short content)
    let progress = 0;
    if (docHeight - winHeight > 0) {
        progress = (scrollPos / (docHeight - winHeight)) * 100;
    }


    // Update progress bar width
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
        progressBar.style.width = progress + "%";
    }


    // Handle sticky progress bar appearance
    const progressBarContainer = document.getElementById("progress-bar-container");
    const mainHeading = document.querySelector('h1'); // Assuming h1 is the main heading with the border
    if (progressBarContainer && mainHeading) { // Check if elements exist
        if (scrollPos > 100) { // Adjust the scroll position for the sticky effect
            progressBarContainer.style.display = 'block'; // Show progress bar
            mainHeading.style.borderBottom = 'none'; // Hide the underline from the heading
            progressBarContainer.classList.add('sticky-progress'); // Make it sticky
        } else {
            progressBarContainer.style.display = 'none'; // Hide progress bar when top
            mainHeading.style.borderBottom = '4px solid #bdc3c7'; // Show the original underline on heading
            progressBarContainer.classList.remove('sticky-progress'); // Remove sticky effect
        }
    }


    // Detect if the user reached the end of the article to fetch related articles
    // Add a small buffer (e.g., 50px) to ensure it triggers before the very last pixel
    if (scrollPos + winHeight >= docHeight - 50) {
        fetchRelatedArticles();
    }
});

// Function to update social media share links
function updateSocialMediaLinks(url) {
    const socialLinks = {
        twitter: `https://twitter.com/share?url=${encodeURIComponent(url)}`,
        facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, // Corrected Facebook share URL
        instagram: `https://www.instagram.com/?url=${encodeURIComponent(url)}`, // Links to Instagram's homepage with URL parameter
        whatsapp: `https://wa.me/?text=${encodeURIComponent(url)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}`,
        email: `mailto:?subject=Check out this article&body=${encodeURIComponent(url)}`
    };

    const shareElements = {
        twitter: document.getElementById('twitter-share'),
        facebook: document.getElementById('facebook-share'),
        instagram: document.getElementById('instagram-share'),
        whatsapp: document.getElementById('whatsapp-share'),
        pinterest: document.getElementById('pinterest-share'),
        email: document.getElementById('email-share')
    };

    // Update each social link if the element exists
    for (const [platform, link] of Object.entries(socialLinks)) {
        const element = shareElements[platform];
        if (element) {
            element.setAttribute('href', link);
            element.setAttribute('target', '_blank'); // Open in new tab for all social links
            element.setAttribute('rel', 'noopener noreferrer'); // Security best practice
        }
    }
}

// Call this function to update social media links when the article is loaded
function initializeSocialMediaLinks() {
    const articleUrl = window.location.href; // Get current URL for sharing
    updateSocialMediaLinks(articleUrl); // Update the social links
}

// Call the functions on page load
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedAndRecentPeople();
    // fetchRelatedArticles(); // This is called by scroll listener, no need to call on DOMContentLoaded unless you want it immediately visible
    initializeSocialMediaLinks();
});