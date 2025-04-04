// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll event listener for header
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Add animation on scroll for feature cards
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// Mobile menu functionality
const createMobileMenu = () => {
    const nav = document.querySelector('.nav-container');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Add button to nav
    nav.appendChild(menuButton);
    
    // Toggle mobile menu
    menuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        menuButton.innerHTML = navLinks.classList.contains('show') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navLinks.classList.contains('show')) {
            navLinks.classList.remove('show');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
};

// Newsletter form handling
const handleNewsletterSubmit = () => {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = form.querySelector('input[placeholder="First name"]').value;
            const lastName = form.querySelector('input[placeholder="Last name"]').value;
            const email = form.querySelector('input[type="email"]').value;
            
            // Here you would typically send this data to your backend
            console.log('Newsletter signup:', { firstName, lastName, email });
            
            // Show success message
            alert('Thank you for subscribing to our newsletter!');
            form.reset();
        });
    }
};

// Partner logo hover effect
const setupPartnerLogos = () => {
    const logos = document.querySelectorAll('.partners-grid img');
    logos.forEach(logo => {
        logo.addEventListener('mouseenter', () => {
            logos.forEach(l => {
                if (l !== logo) {
                    l.style.opacity = '0.3';
                }
            });
        });
        
        logo.addEventListener('mouseleave', () => {
            logos.forEach(l => {
                l.style.opacity = '0.7';
            });
        });
    });
};

// Initialize all functionality
const init = () => {
    createMobileMenu();
    handleNewsletterSubmit();
    setupPartnerLogos();
};

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Slideshow functionality
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds total (3s zoom + 2s fade)

    function nextSlide() {
        // Add fade-out class to current slide
        slides[currentSlide].classList.add('fade-out');
        dots[currentSlide].classList.remove('active');
        
        // Wait for fade-out animation to complete
        setTimeout(() => {
            // Remove active and fade-out classes from current slide
            slides[currentSlide].classList.remove('active', 'fade-out');
            slides[currentSlide].style.transform = 'scale(1)';
            
            // Move to next slide
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Add active class to new slide and dot
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }, 1500); // Match the CSS transition duration
    }

    // Initialize first slide
    slides[0].classList.add('active');
    dots[0].classList.add('active');

    // Auto slideshow
    let slideTimer = setInterval(nextSlide, slideInterval);

    // Click handlers for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideTimer);
            
            // Add fade-out class to current slide
            slides[currentSlide].classList.add('fade-out');
            dots[currentSlide].classList.remove('active');
            
            // Wait for fade-out animation to complete
            setTimeout(() => {
                // Remove active and fade-out classes from current slide
                slides[currentSlide].classList.remove('active', 'fade-out');
                slides[currentSlide].style.transform = 'scale(1)';
                
                // Update current slide
                currentSlide = index;
                
                // Add active class to new slide and dot
                slides[currentSlide].classList.add('active');
                dots[currentSlide].classList.add('active');
                
                // Restart timer
                slideTimer = setInterval(nextSlide, slideInterval);
            }, 1500); // Match the CSS transition duration
        });
    });
}); 