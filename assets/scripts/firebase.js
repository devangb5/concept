import { db } from './firebaseConfig.js';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";




  
  // Function to fetch the latest published blog
  async function fetchLatestBlog() {
    try {
      const blogsRef = collection(db, "blogs");
      const now = new Date();
  
      // Only get blogs that are published (createdAt <= now)
      const latestBlogQuery = query(
        blogsRef,
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc"),
        limit(1)
      );
  
      const querySnapshot = await getDocs(latestBlogQuery);
  
      if (querySnapshot.empty) {
        console.log("No published blogs found!");
        document.getElementById("latest-articles-grid").innerHTML = "<p>No blog posts available.</p>";
        return;
      }
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const firstImage = getFirstImageUrl(data.image);
  
        const latestBlogHTML = `
          <div class="article-card">
            <img src="${firstImage}" alt="${data.title}" class="article-image">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            <a href="https://blogs.aroundtheville.com/blogs/${data.blog_number}" class="read-more">Read More</a>
          </div>
        `;
        document.getElementById("latest-articles-grid").innerHTML = latestBlogHTML;
      });
    } catch (error) {
      console.error("Error fetching the latest blog:", error);
      document.getElementById("latest-articles-grid").innerHTML = "<p>Error loading blog post. Please try again later.</p>";
    }
  }
  


// Function to fetch blogs by category
async function fetchBlogsByCategory(category) {
    try {
      const blogsRef = collection(db, "blogs");
      const now = new Date();
      const categoryQuery = query(
        blogsRef,
        where("category", "==", category),
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc")
      );
  
      const querySnapshot = await getDocs(categoryQuery);
  
      if (querySnapshot.empty) {
        document.getElementById("category-articles-grid").innerHTML = "<p>No blog posts available for this category.</p>";
        return;
      }
  
      let blogsHTML = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const firstImage = getFirstImageUrl(data.image);
  
        blogsHTML += `
          <div class="article-card">
            <img src="${firstImage}" alt="${data.title}" class="article-image">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            <a href="https://blogs.aroundtheville.com/blogs/${data.blog_number}" class="read-more">Read More</a>
          </div>
        `;
      });
  
      document.getElementById("category-articles-grid").innerHTML = blogsHTML;
    } catch (error) {
      console.error("Error fetching blogs by category:", error);
      document.getElementById("category-articles-grid").innerHTML = "<p>Error loading blog posts. Please try again later.</p>";
    }
  }

  function getFirstImageUrl(imageData) {
    if (!imageData) {
      return "https://aroundtheville.com/default-image.jpg"; // fallback
    }
    if (typeof imageData === "string") {
      return imageData;
    }
    if (Array.isArray(imageData) && imageData.length > 0) {
      return imageData[0];
    }
    return "https://aroundtheville.com/default-image.jpg";
  }
  
  async function fetchFoodTruckDiscoverCards() {
    try {
      const categoriesRef = collection(db, "blogs");
      const now = new Date();
      const foodTruckQuery = query(
        categoriesRef,
        where("category", "==", "food-trucks"),
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(foodTruckQuery);
  
      if (snapshot.empty) {
        console.log("No food truck categories found!");
        return;
      }
  
      let cardHTML = "";
      snapshot.forEach(doc => {
        const cat = doc.data();
        const firstImage = getFirstImageUrl(cat.image);
  
        cardHTML += `
          <a href="https://blogs.aroundtheville.com/blogs/${cat.blog_number}" class="discover-card">
            <img src="${firstImage}" alt="${cat.title}" />
            <div class="discover-card-overlay">
              <h3 class="discover-card-title">${cat.title}</h3>
            </div>
          </a>
        `;
      });
  
      document.querySelector("#discover-slider").innerHTML = cardHTML;
  
    } catch (error) {
      console.error("Error fetching Discover cards:", error);
    }
  }

async function fetchRestaurantDiscoverCards() {
    try {
      const categoriesRef = collection(db, "blogs");
      const now = new Date();
      const foodTruckQuery = query(
        categoriesRef,
        where("category", "==", "restaurants"),
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(foodTruckQuery);
  
      if (snapshot.empty) {
        console.log("No restaurant categories found!");
        return;
      }
  
      let cardHTML = "";
      snapshot.forEach(doc => {
        const cat = doc.data();
        const firstImage = getFirstImageUrl(cat.image);
  
        cardHTML += `
          <a href="https://blogs.aroundtheville.com/blogs/${cat.blog_number}" class="discover-card">
            <img src="${firstImage}" alt="${cat.title}" />
            <div class="discover-card-overlay">
              <h3 class="discover-card-title">${cat.title}</h3>
            </div>
          </a>
        `;
      });
  
      document.querySelector("#discover-slider-restaurant").innerHTML = cardHTML;
  
    } catch (error) {
      console.error("Error fetching Discover cards:", error);
    }
  }

async function loadPeopleFilmstrip() {
    const container = document.getElementById("filmstrip-track");
    container.innerHTML = ""; // Clear existing content
  
    try {
      const snapshot = await getDocs(collection(db, "people"));
      const now = new Date();
      const people = [];
  
      snapshot.forEach(doc => {
        const data = doc.data();
        const person = { id: doc.id, ...data };
  
        // Convert Firestore Timestamp to JS Date if needed
        const createdAtDate = person.createdAt?.toDate
          ? person.createdAt.toDate()
          : new Date(person.createdAt);
  
        // Only include if createdAt is in the past or now
        if (createdAtDate <= now) {
          people.push(person);
        }
      });
  
      const looped = [...people, ...people]; // Duplicate for seamless loop
  
      looped.forEach(person => {
        const firstImage = getFirstImageUrl(person.image);
        const tile = document.createElement("div");
        tile.className = "filmstrip-item";
        tile.innerHTML = `
          <a href="https://people.aroundtheville.com/people/${person.id}">
            <img src="${firstImage}" alt="${person.name}" loading="lazy" />
          </a>
        `;
        container.appendChild(tile);
      });
    } catch (error) {
      console.error("Error loading people filmstrip:", error);
      container.innerHTML = "<p>Unable to load people at this time.</p>";
    }
  }
  
  document.addEventListener("DOMContentLoaded", loadPeopleFilmstrip);
  

 
// Function to fetch Instagram posts
// Function to fetch Instagram-style posts from blogs and people collections
async function fetchInstagramPosts() {
    try {
      let allPosts = [];
      const now = new Date();
  
      // Fetch scheduled blog posts
      const blogsRef = collection(db, "blogs");
      const blogsQuery = query(
        blogsRef,
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc")
      );
      const blogsSnapshot = await getDocs(blogsQuery);
  
      if (!blogsSnapshot.empty) {
        blogsSnapshot.forEach(doc => {
          const data = doc.data();
          allPosts.push({ ...data, collection: 'blogs' });
        });
      }
  
      // Fetch scheduled people posts
      const peopleRef = collection(db, "people");
      const peopleQuery = query(
        peopleRef,
        where("createdAt", "<=", now),
        orderBy("createdAt", "desc")
      );
      const peopleSnapshot = await getDocs(peopleQuery);
  
      if (!peopleSnapshot.empty) {
        peopleSnapshot.forEach(doc => {
          const data = doc.data();
          allPosts.push({ ...data, collection: 'people' });
        });
      }
  
      // Sort and take top 6 posts
      allPosts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const topSixPosts = allPosts.slice(0, 6);
  
      if (topSixPosts.length === 0) {
        console.log("No scheduled posts found in either collection.");
        return;
      }
  
      let feedHTML = "";
      topSixPosts.forEach(post => {
        const firstImage = getFirstImageUrl(post.image);
        feedHTML += `
          <div class="feed-item">
            <img src="${firstImage}" alt="${post.collection} Post">
          </div>
        `;
      });
  
      document.querySelector(".feed-grid").innerHTML = feedHTML;
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }




// Add event listeners to category items
const categoryItems = document.querySelectorAll(".category-item-container");

categoryItems.forEach(item => {
    item.addEventListener("click", function () {
        const isSelected = item.classList.contains("selected");
        categoryItems.forEach(i => i.classList.remove("selected"));

        if (!isSelected) {
            item.classList.add("selected");
            const selectedCategory = item.getAttribute("data-category");
            fetchBlogsByCategory(selectedCategory);
        } else {
            document.getElementById("category-articles-grid").innerHTML = "<p>Select a category to explore blogs.</p>";
        }
    });
});

// Initial calls to fetch data on page load
fetchLatestBlog();
fetchInstagramPosts();
fetchFoodTruckDiscoverCards();
fetchRestaurantDiscoverCards();
