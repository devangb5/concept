// Utility function to check if the app is in standalone mode
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
}

// Generate menu items dynamically
function generateMenuItems(menuItems) {
    return menuItems.map(item => {
        const menuItem = document.createElement('a');
        menuItem.href = item.link;
        menuItem.className = 'mobile-menu-item';
        menuItem.innerHTML = `
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        `;
        return menuItem;
    });
}

// Dynamically update the mobile menu
function updateMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');

    // Hide the menu when not in standalone mode
    if (!isStandalone()) {
        mobileMenu.style.display = 'none';
        return;
    }

    // Show the menu in standalone mode
    mobileMenu.style.display = 'flex';
    mobileMenu.innerHTML = ''; // Clear existing menu items

    // Define menu items for standalone mode
    const standaloneMenuItems = [
        { icon: 'fas fa-home', label: 'Home', link: '#home' },
        { icon: 'fas fa-search', label: 'Search', link: '#search' },
        { icon: 'fas fa-bell', label: 'Notifications', link: '#notifications' },
        { icon: 'fas fa-user', label: 'Profile', link: '#profile' }
    ];

    // Append menu items
    generateMenuItems(standaloneMenuItems).forEach(item => mobileMenu.appendChild(item));
}

// Initialize mobile menu on load
function initMobileMenu() {
    updateMobileMenu();

    // Update menu on display mode change or resize
    window.addEventListener('resize', updateMobileMenu);

    // Listen for changes to the display mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', updateMobileMenu);
}

// Initialize on load
window.addEventListener('load', initMobileMenu);
