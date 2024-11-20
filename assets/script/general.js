document.addEventListener("DOMContentLoaded", function () {
    // Category filter logic
    const categoryItems = document.querySelectorAll(".category-item");
    const contentItems = document.querySelectorAll(".content-item");

    if (categoryItems.length > 0 && contentItems.length > 0) {
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
    }

    // Image slideshow for intro image
    const images = [
        "assets/images/food-truck.jpeg",
        "assets/images/brewery.jpeg",
        "assets/images/restaurant.jpeg",
        "assets/images/distillery.jpeg"
    ];

    const introImage = document.querySelector(".intro-image img");

    if (introImage) {
        let index = 0;

        function changeImage() {
            introImage.src = images[index];
            index = (index + 1) % images.length; // Loop back to the first image
        }

        // Change image every 3 seconds (3000 ms)
        setInterval(changeImage, 3000);
    }
});


