import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Path to the footer HTML file
const footerPath = 'components/footer.html'; // Update this path accordingly

async function loadFooter() {
    try {
        // Fetch the footer HTML content from the separate file
        const response = await fetch(footerPath);
        const footerHTML = await response.text();

        // Inject the footer HTML into the container
        const footerContainer = document.getElementById('footer-container');
        footerContainer.innerHTML = footerHTML;

        // Set the current year dynamically
        document.getElementById('current-year').textContent = new Date().getFullYear();

        // Dynamic footer links
        const privacyPolicyLink = document.getElementById("privacy-policy-link");
        const contactUsLink = document.getElementById("contact-us-link");

        // Example dynamic conditions (e.g., user logged in or specific page)
        const isUserLoggedIn = false; // Example condition
        const currentPage = "home"; // Example current page

        // Change link destination based on conditions
        if (isUserLoggedIn) {
            contactUsLink.href = "/user-dashboard";
            privacyPolicyLink.href = "/user-privacy-policy";
        } else {
            contactUsLink.href = "/login";
            privacyPolicyLink.href = "/general-privacy-policy";
        }

        // Handle newsletter form submission
        const newsletterForm = document.getElementById("newsletter-form");
        if (newsletterForm) {
            newsletterForm.addEventListener("submit", async function (e) {
                e.preventDefault();
                const email = newsletterForm.querySelector("input").value;

                try {
                    // Add the email to the Firestore "subscribers" collection
                    await addDoc(collection(db, "subscribers"), {
                        email: email,
                        timestamp: new Date(),
                    });
                    alert("Thank you for subscribing!");
                    newsletterForm.reset();
                } catch (error) {
                    console.error("Error adding subscriber: ", error);
                    alert("Failed to subscribe. Please try again later.");
                }
            });
        }
    } catch (error) {
        console.error("Error loading footer: ", error);
    }
}

// Wait for the document to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
    loadFooter();
});
