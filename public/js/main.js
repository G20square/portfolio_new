document.addEventListener('DOMContentLoaded', async () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // (Note: Projects, Skills, and Certificates are now hardcoded in index.html for static hosting)
});
