document.getElementById('hamburger-icon').addEventListener('click', function () {
  document.getElementById('overlayMenu').style.display = 'flex';
});

document.getElementById('closeOverlay').addEventListener('click', function () {
  document.getElementById('overlayMenu').style.display = 'none';
});




document.addEventListener("DOMContentLoaded", function () {
  const categoryItems = document.querySelectorAll(".category-item");
  const contentItems = document.querySelectorAll(".content-item");

  categoryItems.forEach(item => {
      item.addEventListener("click", () => {
          // Remove active state from all categories and add to clicked one
          categoryItems.forEach(c => c.classList.remove("active"));
          item.classList.add("active");

          // Get the selected category from the data attribute
          const selectedCategory = item.getAttribute("data-category");

          // Show or hide content items based on selected category
          contentItems.forEach(content => {
              if (selectedCategory === "all" || content.getAttribute("data-category") === selectedCategory) {
                  content.style.display = "block";
              } else {
                  content.style.display = "none";
              }
          });
      });
  });
});
