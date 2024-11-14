document.getElementById('hamburger-icon').addEventListener('click', function () {
  document.getElementById('overlayMenu').style.display = 'flex';
});

document.getElementById('closeOverlay').addEventListener('click', function () {
  document.getElementById('overlayMenu').style.display = 'none';
});


document.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  const scrollPosition = window.scrollY;

  if (scrollPosition > 0) {
      header.classList.add('scrolled');
  } else {
      header.classList.remove('scrolled');
    }
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
document.getElementById('toggleBtn').addEventListener('click', function () {
  // Select all content items
  const contentItems = document.querySelectorAll('.content-container .content-item');
  const isShowingMore = this.innerText === 'Show Less';

  // Toggle display based on the button state
  contentItems.forEach((item, index) => {
      if (index >= 6) {
          item.style.display = isShowingMore ? 'none' : 'block';
      }
  });

  // Toggle button text
  this.innerText = isShowingMore ? 'Show More' : 'Show Less';
});
