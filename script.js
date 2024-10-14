document.getElementById('hamburger').addEventListener('click', function() {
  const navbar = document.querySelector('.navbar');
  navbar.classList.toggle('active');
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


