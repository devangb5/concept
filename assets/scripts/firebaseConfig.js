import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

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



// Get Firebase Authentication and Firestore services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };