document.addEventListener("DOMContentLoaded", function () {



    // Image slideshow for intro image
    const images = [
        "https://aroundtheville.com/assets/images/food-truck.jpeg",
        "https://aroundtheville.com/assets/images/brewery.jpeg",
        "https://aroundtheville.com/assets/images/restaurant.jpeg",
        "https://aroundtheville.com/assets/images/distillery.jpeg"
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


