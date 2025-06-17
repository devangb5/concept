import { db } from './firebaseConfig.js';
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

const footerPath = 'https://aroundtheville.com/components/footer.html';

async function loadFooter() {
  try {
    const response = await fetch(footerPath);
    if (!response.ok) throw new Error("Failed to load footer HTML file.");
    const footerHTML = await response.text();
    document.getElementById('footer-container').innerHTML = footerHTML;

    const yearElement = document.getElementById('current-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

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
          const docRef = doc(db, "subscribers", email);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            alert("You’ve already subscribed with this email.");
            return;
          }

          await setDoc(docRef, {
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
