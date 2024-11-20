// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_M3kGDf-esoqMDLnxfYQ4CV8-xboYQwA",
    authDomain: "around-the-ville.firebaseapp.com",
    projectId: "around-the-ville",
    storageBucket: "around-the-ville.firebasestorage.app",
    messagingSenderId: "431313384928",
    appId: "1:431313384928:web:d4693371a9e0083d1f6785"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export the initialized Firestore instance
export { db };
