import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";




// Function to Load Featured and Recent People
async function loadFeaturedAndRecentPeople() {
    const peopleCollection = collection(db, "people");
    const querySnapshot = await getDocs(peopleCollection);
    let people = [];

    querySnapshot.forEach(doc => {
        people.push({ id: doc.id, ...doc.data() });
    });

    // Sort by timestamp (assuming you have a 'timestamp' field in your Firestore documents)
    let sortedPeople = people.sort((a, b) => b.timestamp - a.timestamp);

    // Get the top 4 recent people to feature
    let featuredAndRecent = sortedPeople.slice(0, 4);

    // Update the inner HTML to display featured people
    document.querySelector('.featured-recent-grid').innerHTML = featuredAndRecent.map(person => `
        <div class="featured-recent-card" >
        <a href="https://people.aroundtheville.com/people/${person.id}">    
        <img src="${person.image}" alt="${person.name}" class="person-image">
        </a>
        </div>
    `).join('');
}
// Flag to prevent fetching after reaching the bottom
let hasFetchedRelatedArticles = false;

async function fetchRelatedArticles() {
    // Prevent fetching if articles have already been displayed
    if (hasFetchedRelatedArticles) {
        return;
    }

    try {
        // Fetch all people from the "people" collection
        const peopleRef = collection(db, "people");
        const querySnapshot = await getDocs(peopleRef);

        // If no people are found
        if (querySnapshot.empty) {
            console.log("No related people found.");
            return;
        }

        // Map people data correctly
        let allPeople = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Shuffle the array to randomize the order
        allPeople = shuffleArray(allPeople);

        // Select the first 3 people from the shuffled array
        const randomPeople = allPeople.slice(0, 3);

        // Prepare HTML content for the related people
        let relatedPeopleHTML = "<h3>Related People</h3>";
        relatedPeopleHTML += randomPeople.map(person => `
            <div class="related-article">
                <a href="https://people.aroundtheville.com/people/${person.id}">
                    <img src="${person.image}" alt="${person.name}" class="related-article-image">
                    <p>${person.name}</p>
                </a>
            </div>
        `).join('');

        // Display the related people in the "related-articles" container
        document.getElementById("related-articles").innerHTML = relatedPeopleHTML;

        // Set flag to true to indicate people have been fetched
        hasFetchedRelatedArticles = true;

    } catch (error) {
        console.error("Error fetching related people:", error);
    }
}

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