import { db } from './firebaseConfig.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Function to fetch and display offers
async function fetchOffers() {
    const offersContainer = document.querySelector('.offers-container');

    try {
        // Fetch documents from the 'specials' collection
        const offersSnapshot = await getDocs(collection(db, 'specials'));

        // Check if there are any documents
        if (offersSnapshot.empty) {
            offersContainer.innerHTML = '<p>No special offers available at the moment. Please check back later!</p>';
            return;
        }

        // Create a document fragment to avoid repeated innerHTML changes
        const fragment = document.createDocumentFragment();

        // Iterate over the documents and create offer cards
        offersSnapshot.forEach(doc => {
            const offer = doc.data();

            // Use the imageURL directly from Firestore (assuming it's already a valid URL)
            const imageSrc = offer.imageUrl || 'https://via.placeholder.com/400x200'; // Fallback if imageURL is not available

            // Generate HTML for each offer card
            const offerCard = document.createElement('div');
            offerCard.classList.add('offer-card');
            offerCard.innerHTML = `
                <img src="${imageSrc}" alt="${offer.title || 'Special Offer'}">
                <div class="offer-details">
                    <h2>${offer.title || 'Untitled Offer'}</h2>
                    <p class="business-name">Business: <strong>${offer.businessName || 'Unknown'}</strong></p>
                    <p class="description">${offer.description || 'No description available.'}</p>
                    <p class="valid-until">Valid Until: <strong>${offer.validUntil || 'N/A'}</strong></p>
                </div>
            `;

            // Append the offer card to the fragment
            fragment.appendChild(offerCard);
        });

        // Once all cards are created, append the fragment to the offers container
        offersContainer.appendChild(fragment);

    } catch (error) {
        console.error('Error fetching offers:', error);

        // Display an error message
        offersContainer.innerHTML = '<p>Failed to load special offers. Please try again later.</p>';
    }
}

// Call the function to load offers
fetchOffers();
