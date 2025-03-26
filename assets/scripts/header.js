// Load Header Component
async function loadHeader() {
    try {
        // Fetch the header.html file
        const response = await fetch('/components/header.html');

        // Check if the fetch was successfuls
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the text content of the response
        const data = await response.text();

        // Inject the fetched HTML into the header container
        document.getElementById('header').innerHTML = data;

        // Initialize event listeners for header interactions
        initializeHeaderEvents();
    } catch (error) {
        // Log the error and provide a fallback message
        console.error('Error loading header:', error);
        document.getElementById('header').innerHTML = `
            <div class="header-error">
                <p>Failed to load the header. Please refresh the page or try again later.</p>
            </div>
        `;
    }
}

// Initialize Event Listeners for Header
function initializeHeaderEvents() {
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const overlayMenu = document.getElementById('overlayMenu');
    const closeOverlayButton = document.getElementById('closeOverlay');

    if (hamburgerIcon && overlayMenu && closeOverlayButton) {
        // Open overlay menu
        hamburgerIcon.addEventListener('click', function () {
            overlayMenu.style.display = 'flex'; // Show the overlay menu
            overlayMenu.style.opacity = '1'; // Add transition effect
        });

        // Close overlay menu
        closeOverlayButton.addEventListener('click', function () {
            overlayMenu.style.display = 'none'; // Hide the overlay menu
            overlayMenu.style.opacity = '0'; // Add transition effect
        });

        // Close overlay menu when clicking outside
        overlayMenu.addEventListener('click', (e) => {
            if (e.target === overlayMenu) {
                overlayMenu.style.display = 'none';
                overlayMenu.style.opacity = '0'; // Add transition effect
            }
        });

        // Close overlay menu with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlayMenu.style.display === 'flex') {
                overlayMenu.style.display = 'none';
                overlayMenu.style.opacity = '0'; // Add transition effect
            }
        });
    } else {
        console.warn('Header elements not found: hamburgerIcon, overlayMenu, or closeOverlayButton');
    }

    // Sticky header background color change on scroll
    const header = document.querySelector('.nav');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Execute the loadHeader function on page load
document.addEventListener('DOMContentLoaded', loadHeader);
