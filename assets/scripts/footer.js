import { db } from './firebaseConfig.js';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Path to the footer HTML file
const footerPath = 'https://aroundtheville.com/components/footer.html'; // Static footer path

// Helper to wrap content (still used if needed in future modals)
function wrapContentFromArray(contentArray) {
  return contentArray
    .map(item => {
      let html = "";
      if (item.heading) html += `<h2>${item.heading}</h2>`;
      if (item.paragraph) html += `<p>${item.paragraph}</p>`;
      return html;
    })
    .join("");
}

async function loadFooter() {
  try {
    const response = await fetch(footerPath);
    if (!response.ok) throw new Error("Failed to load footer HTML file.");
    const footerHTML = await response.text();
    document.getElementById('footer-container').innerHTML = footerHTML;

    const yearElement = document.getElementById('current-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

    // ✅ Newsletter subscription with duplicate check
    const newsletterForm = document.getElementById("newsletter-form");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector("input");
        const email = emailInput.value.trim().toLowerCase();

        if (!email) {
          alert("Please enter a valid email address.");
          return;
        }

        try {
          const existingQuery = query(
            collection(db, "subscribers"),
            where("email", "==", email)
          );
          const querySnapshot = await getDocs(existingQuery);

          if (!querySnapshot.empty) {
            alert("You’ve already subscribed with this email.");
            return;
          }

          await addDoc(collection(db, "subscribers"), {
            email,
            timestamp: new Date()
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



document.addEventListener("DOMContentLoaded", loadFooter);
