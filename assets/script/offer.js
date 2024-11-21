import { auth, db, storage } from './firebaseConfig.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const specialForm = document.getElementById('special-form');
const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');
const offerSection = document.getElementById('offer-section');
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const logoutButton = document.getElementById('logout-button');
const specialsList = document.getElementById('specials-list');  // A section to display specials
const uploadMessage = document.getElementById('upload-message');  // Success message for uploads
const specialItems = document.getElementById('special-items'); // Container for individual specials

// Switch to Signup Form
document.getElementById('go-to-signup').addEventListener('click', () => {
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
});

// Switch to Login Form
document.getElementById('go-to-login').addEventListener('click', () => {
    signupSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// Function to handle login
const handleLogin = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginMessage.innerText = "Login successful!";
        loginSection.style.display = 'none';
        offerSection.style.display = 'block';
        displayUserSpecials();  // Show the specials after login
    } catch (error) {
        loginMessage.innerText = "Error: " + error.message;
    }
};

// Handle Email Sign-In
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    handleLogin(email, password);
});

// Function to handle signup
const handleSignup = async (email, password) => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        signupMessage.innerText = "Signup successful!";
        signupSection.style.display = 'none';
        offerSection.style.display = 'block';
    } catch (error) {
        signupMessage.innerText = "Error: " + error.message;
    }
};

// Handle Signup Form Submission
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    handleSignup(email, password);
});

// Function to upload image to Firebase Storage
const uploadImage = async (imageFile) => {
    const storageRef = ref(storage, 'specials/' + imageFile.name);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef); // Get the image URL
};

// Function to add special to Firestore
const addSpecial = async (user, title, description, imageFile, businessName, validUntil) => {
    try {
        const imageUrl = await uploadImage(imageFile);
        await addDoc(collection(db, "specials"), {
            userId: user.uid,
            title,
            description,
            imageUrl,
            businessName,
            validUntil,
            createdAt: new Date()
        });
        uploadMessage.innerText = "Special added successfully!";
        setTimeout(() => {
            uploadMessage.innerText = ""; // Hide success message after 3 seconds
        }, 3000);
        displayUserSpecials();  // Update the UI after adding a new special
    } catch (error) {
        console.error("Error adding special:", error.message);
    }
};

// Handle Special Form Submission
specialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('image').files[0];
    const businessName = document.getElementById('businessName').value;
    const validUntil = document.getElementById('validUntil').value;

    const user = auth.currentUser;
    if (user && imageFile) {
        addSpecial(user, title, description, imageFile, businessName, validUntil);
    } else {
        alert("You need to be logged in and select an image to post a special.");
    }
});

// Function to fetch and display the user's specials from Firestore
const displayUserSpecials = async () => {
    const user = auth.currentUser;
    if (user) {
        const specialsQuery = query(collection(db, "specials"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(specialsQuery);
        
        // Clear the previous list of specials
        specialItems.innerHTML = "";

        querySnapshot.forEach(doc => {
            const special = doc.data();
            const specialElement = document.createElement('div');
            specialElement.classList.add('special-item');
            specialElement.innerHTML = `
                <h3>${special.title}</h3>
                <p><strong>Business Name:</strong> ${special.businessName}</p>
                <img src="${special.imageUrl}" alt="${special.title}" />
                <p>${special.description}</p>
                <p>Valid Until: ${special.validUntil}</p>
                <button class="delete-special" data-id="${doc.id}">Delete</button>
            `;
            specialItems.appendChild(specialElement);

            // Add delete functionality
            specialElement.querySelector('.delete-special').addEventListener('click', () => {
                deleteSpecial(doc.id);
            });

            // Check if the special is older than 3 months and delete it if needed
            const createdAt = special.createdAt.toDate();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            if (createdAt < threeMonthsAgo) {
                deleteSpecial(doc.id);  // Delete special if it is older than 3 months
            }
        });
    } else {
        console.log("No user logged in.");
    }
};

// Function to delete special after 3 months
const deleteSpecial = async (specialId) => {
    try {
        await deleteDoc(doc(db, "specials", specialId));
        console.log("Special deleted after 3 months.");
        displayUserSpecials();  // Update the UI after deletion
    } catch (error) {
        console.error("Error deleting special:", error.message);
    }
};

// Real-time listener to show new specials as they are added or updated
const listenToSpecials = () => {
    const user = auth.currentUser;
    if (user) {
        const specialsQuery = query(collection(db, "specials"), where("userId", "==", user.uid));
        onSnapshot(specialsQuery, (querySnapshot) => {
            specialItems.innerHTML = "";  // Clear current specials

            querySnapshot.forEach(doc => {
                const special = doc.data();
                const specialElement = document.createElement('div');
                specialElement.classList.add('special-item');
                specialElement.innerHTML = `
                    <h3>${special.title}</h3>
                    <p><strong>Business Name:</strong> ${special.businessName}</p>
                    <img src="${special.imageUrl}" alt="${special.title}" />
                    <p>${special.description}</p>
                    <p>Valid Until: ${special.validUntil}</p>
                    <button class="delete-special" data-id="${doc.id}">Delete</button>
                `;
                specialItems.appendChild(specialElement);

                // Add delete functionality
                specialElement.querySelector('.delete-special').addEventListener('click', () => {
                    deleteSpecial(doc.id);
                });
            });
        });
    }
};

// Handle Logout
logoutButton.addEventListener('click', () => {
    signOut(auth);
    offerSection.style.display = 'none';  // Hide the offers section
    loginSection.style.display = 'block';  // Show the login section
});

// Start listening for real-time changes if the user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        offerSection.style.display = 'block';
        loginSection.style.display = 'none';
        displayUserSpecials();  // Display the specials on login
        listenToSpecials();  // Listen for changes in the specials
    } else {
        offerSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
});
