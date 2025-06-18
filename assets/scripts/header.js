// Load Header Component
async function loadHeader() {
    try {
      const res = await fetch('/components/header.html');
      if (!res.ok) throw new Error(`Failed to load header: ${res.status}`);
  
      const html = await res.text();
      const headerEl = document.getElementById('header');
      if (!headerEl) throw new Error('No #header container found on page');
  
      headerEl.innerHTML = html;
  
      // Defer DOM-dependent operations
      requestAnimationFrame(() => {
        initializeHeaderEvents();
        highlightActiveNavLink(); // ✅ moved here so links exist
      });
    } catch (err) {
      console.error('Header load error:', err);
      const fallbackEl = document.getElementById('header');
      if (fallbackEl) {
        fallbackEl.innerHTML = '<p>Error loading header. Please refresh.</p>';
      }
    }
  }
  
  // Initialize Header Interactions
  function initializeHeaderEvents() {
    const hamburger = document.getElementById('hamburger-icon');
    const overlay = document.getElementById('overlayMenu');
    const closeBtn = document.getElementById('closeOverlay');
  
    if (hamburger && overlay && closeBtn) {
      hamburger.addEventListener('click', () => {
        overlay.classList.add('show');
        hamburger.classList.add('open');
        document.body.style.overflow = 'hidden'; // Optional: lock scroll
      });
  
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        hamburger.classList.remove('open');
        document.body.style.overflow = ''; // Unlock scroll
      });
  
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('show');
          hamburger.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
  
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          overlay.classList.remove('show');
          hamburger.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  }
  
  


  
  // Load on DOM Ready
  document.addEventListener('DOMContentLoaded', loadHeader);
  
