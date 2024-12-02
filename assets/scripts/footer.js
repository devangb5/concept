import { db } from './firebaseConfig.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Path to the footer HTML file
const footerPath = '/components/footer.html'; // Ensure this path points to your footer file

// Helper function to dynamically wrap content based on the field names
function wrapContentFromArray(contentArray) {
    return contentArray
        .map(item => {
            let html = "";

            // Wrap heading in <h2> if it's available
            if (item.heading) {
                html += `<h2>${item.heading}</h2>`;
            }

            // Wrap paragraph in <p> if it's available
            if (item.paragraph) {
                html += `<p>${item.paragraph}</p>`;
            }

            return html;
        })
        .join(""); // Join all parts into a single string
}

// Function to load and inject the footer content
async function loadFooter() {
    try {
        // Load footer HTML content
        const response = await fetch(footerPath);
        if (!response.ok) throw new Error("Failed to load footer HTML file.");
        const footerHTML = await response.text();
        document.getElementById('footer-container').innerHTML = footerHTML;

        // Set the current year dynamically
        const yearElement = document.getElementById('current-year');
        if (yearElement) yearElement.textContent = new Date().getFullYear();

        // Attach event listener to the privacy policy link
        const privacyPolicyLink = document.getElementById("privacy-policy-link");
        if (privacyPolicyLink) {
            privacyPolicyLink.addEventListener("click", async function (e) {
                e.preventDefault();
                try {
                    const docRef = doc(db, "privacy-policy", "general-privacy-policy");
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const policyContent = docSnap.data().content; // Assumes 'content' is an array of objects
                        const title = docSnap.data().title; // Separate field for title

                        // Create and display the modal for the privacy policy
                        const modal = document.createElement('div');
                        modal.id = 'privacy-policy-modal';
                        modal.classList.add('modal');
                        modal.innerHTML = `
                            <div class="privacy-modal-content">
                                <span class="close-button">&times;</span>
                                <div id="privacy-policy-content"></div>
                            </div>
                        `;
                        document.body.appendChild(modal);

                        // Add title to the modal before the content
                        const privacyContent = `
                            <h1>${title}</h1>
                            ${wrapContentFromArray(policyContent)}
                        `;
                        document.getElementById('privacy-policy-content').innerHTML = privacyContent;

                        // Handle modal close actions
                        const closeButton = modal.querySelector('.close-button');
                        closeButton.addEventListener('click', () => modal.remove());

                        // Close the modal when clicking outside of it
                        window.addEventListener('click', (event) => {
                            if (event.target === modal) modal.remove();
                        });

                        // Show the modal
                        modal.style.display = "block";
                    } else {
                        console.error("Privacy policy not found in Firestore.");
                    }
                } catch (error) {
                    console.error("Error fetching privacy policy from Firestore:", error);
                }
            });
        }

        // Attach newsletter subscription form event listener
        const newsletterForm = document.getElementById("newsletter-form");
        if (newsletterForm) {
            newsletterForm.addEventListener("submit", async function (e) {
                e.preventDefault();
                const email = newsletterForm.querySelector("input").value.trim();
                if (!email) {
                    alert("Please enter a valid email address.");
                    return;
                }
                try {
                    await addDoc(collection(db, "subscribers"), { email, timestamp: new Date() });
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

// Initialize footer on page load
document.addEventListener("DOMContentLoaded", loadFooter);
