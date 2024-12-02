import { db } from './firebaseConfig.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Track whether offers are being fetched
let isFetching = false;
let offersArray = [];  // Store offers globally to avoid re-fetching

// Function to fetch and display offers
document.addEventListener('DOMContentLoaded', () => {
    fetchOffers();  // Wait for the DOM to be fully loaded before running fetchOffers
});

async function fetchOffers() {
    if (isFetching) return;  // Prevent fetching if already in progress
    isFetching = true;  // Set fetching state to true

    const offersContainer = document.querySelector('.offers-container');
    const searchBar = document.getElementById('searchBar');
    const sortSelect = document.getElementById('sortOffers');

    if (!searchBar || !sortSelect) {
        console.error("Search bar or sort dropdown not found!");
        isFetching = false;  // Reset fetching state in case of error
        return;
    }

    const fragment = document.createDocumentFragment(); // Create fragment to minimize reflows

    try {
        // Fetch documents from the 'specials' collection
        const offersSnapshot = await getDocs(collection(db, 'specials'));

        if (offersSnapshot.empty) {
            offersContainer.innerHTML = '<p>No special offers available at the moment. Please check back later!</p>';
            isFetching = false;
            return;
        }

        // Create offer cards and push them into the offersArray
        offersSnapshot.forEach(doc => {
            const offer = doc.data();
            const offerCard = document.createElement('div');
            offerCard.classList.add('offer-card');
            const imageSrc = offer.imageUrl || 'https://via.placeholder.com/400x200';

            offerCard.innerHTML = `
                <img src="${imageSrc}" alt="${offer.title || 'Special Offer'}">
                <div class="offer-details">
                    <h2>${offer.title || 'Untitled Offer'}</h2>
                    <p class="business-name">Business: <strong>${offer.businessName || 'Unknown'}</strong></p>
                    <p class="description">${offer.description || 'No description available.'}</p>
                    <p class="valid-until">Valid Until: <strong>${offer.validUntil || 'N/A'}</strong></p>
                    <button class="share-btn">Share</button> <!-- Added Share Button -->
                </div>
            `;
            
            offersArray.push({ offerCard, offer });
            fragment.appendChild(offerCard);
        });

        offersContainer.appendChild(fragment);

        // Implement search functionality
        searchBar.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            offersArray.forEach(({ offerCard, offer }) => {
                const title = offer.title.toLowerCase();
                const businessName = offer.businessName.toLowerCase();

                if (title.includes(query) || businessName.includes(query)) {
                    offerCard.style.display = '';
                } else {
                    offerCard.style.display = 'none';
                }
            });
        });

        // Implement sorting functionality
        sortSelect.addEventListener('change', function (e) {
            const sortValue = e.target.value;
            const sortedOffers = [...offersArray];

            sortedOffers.sort((a, b) => {
                const dateA = new Date(a.offer.validUntil);
                const dateB = new Date(b.offer.validUntil);

                return sortValue === 'validUntilAsc' ? dateA - dateB : dateB - dateA;
            });

            offersContainer.innerHTML = '';
            sortedOffers.forEach(({ offerCard }) => {
                offersContainer.appendChild(offerCard);
            });
        });

        // Implement expiration logic (Highlight offers expiring soon)
        offersArray.forEach(({ offerCard, offer }) => {
            const validUntil = new Date(offer.validUntil);
            const today = new Date();
            const timeDifference = validUntil - today;

            if (timeDifference < 3 * 24 * 60 * 60 * 1000) {  // Less than 3 days
                offerCard.classList.add('expiring-soon');
            }
        });

        // Remove modal functionality (No need to open modal on card click)

        // Implement share button functionality (Web Share API)
        offersArray.forEach(({ offerCard, offer }) => {
            const shareButton = offerCard.querySelector('.share-btn');

            shareButton.addEventListener('click', function () {
                if (navigator.share) {
                    navigator.share({
                        title: offer.title,
                        text: offer.description,
                        url: window.location.href
                    })
                    .then(() => console.log('Offer shared successfully'))
                    .catch(error => console.error('Error sharing offer: ', error));
                } else {
                    alert('Web share is not supported on this device.');
                }
            });
        });

    } catch (error) {
        console.error('Error fetching offers:', error);
        offersContainer.innerHTML = '<p>Failed to load special offers. Please try again later.</p>';
    } finally {
        isFetching = false;  // Reset fetching state after the operation
    }
}

// Infinite scroll functionality
window.addEventListener('scroll', function () {
    const bottom = document.documentElement.scrollHeight === window.innerHeight + window.scrollY;
    if (bottom && !isFetching) {
        fetchOffers();  // Load more offers if we are at the bottom of the page
    }
});
