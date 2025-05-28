// Header scroll effect and navigation handling
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
    // ...existing code...
});
const initNavigation = () => {
    const header = document.querySelector('header');
    const scrollThreshold = 50;
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > scrollThreshold);
    });

    // Handle smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            const headerOffset = header.offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });

    // Update active nav link on scroll
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 60) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').substring(1) === current);
        });
    });
};

// Mobile Menu Handler
const initMobileMenu = () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = mobileMenuBtn.querySelector('i');
    const links = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        navLinks.classList.toggle('active');
        const isOpen = navLinks.classList.contains('active');
        menuIcon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);

    // Close menu when clicking links
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            menuIcon.className = 'fas fa-bars';
            document.body.style.overflow = '';
        }
    });
};

// Theme Toggle Handler
const initThemeToggle = () => {
    const themeToggle = document.querySelector('.theme-toggle');
    const root = document.documentElement;
    
    const lightTheme = {
        '--primary-color': '#4f46e5',
        '--primary-light': '#818cf8',
        '--secondary-color': '#06b6d4',
        '--text-color': '#1f2937',
        '--text-light': '#6b7280',
        '--bg-color': '#ffffff',
        '--white': '#ffffff',
        '--black': '#111827',
        '--card-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    };

    const darkTheme = {
        '--primary-color': '#818cf8',
        '--primary-light': '#4f46e5',
        '--secondary-color': '#0891b2',
        '--text-color': '#f9fafb',
        '--text-light': '#9ca3af',
        '--bg-color': '#111827',
        '--white': '#1f2937',
        '--black': '#000000',
        '--card-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
    };

    const setTheme = (isDark) => {
        const theme = isDark ? darkTheme : lightTheme;
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        document.body.classList.toggle('dark-mode', isDark);
        const icon = themeToggle.querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme === 'dark');

    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
        setTheme(!document.body.classList.contains('dark-mode'));
    });
};

// Contact Form Handler with Modern UX
const initContactForm = () => {
    const form = document.getElementById('contact-form');
    const submitButton = form.querySelector('.btn-send');
    const inputs = form.querySelectorAll('input, textarea');
    
    // Input validation and animation
    inputs.forEach(input => {
        // Add validation classes
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                input.classList.add('filled');
            } else {
                input.classList.remove('filled');
            }
        });

        // Add focus animation
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                input.parentElement.classList.remove('focused');
            }
        });
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        const formData = new FormData(form);
        let isValid = true;
        let formValues = {};

        for (let [key, value] of formData.entries()) {
            formValues[key] = value.trim();
            if (!value.trim()) {
                isValid = false;
                showError(form.querySelector(`[name="${key}"]`), 'This field is required');
            }
        }

        if (!isValid) return;

        // Show loading state
        submitButton.classList.add('loading');
        disableForm(form, true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            showNotification('success', 'Message sent successfully! I\'ll get back to you soon.');
            form.reset();
            inputs.forEach(input => input.parentElement.classList.remove('focused', 'filled'));

        } catch (error) {
            // Show error message
            showNotification('error', 'Failed to send message. Please try again.');
            
        } finally {
            // Reset button state
            submitButton.classList.remove('loading');
            disableForm(form, false);
        }
    });
};

// Helper functions
const showError = (input, message) => {
    const formGroup = input.parentElement;
    const errorElement = formGroup.querySelector('.error-message') || 
                        createErrorElement(formGroup);
    
    formGroup.classList.add('error');
    errorElement.textContent = message;
    
    input.addEventListener('input', () => {
        formGroup.classList.remove('error');
        errorElement.textContent = '';
    }, { once: true });
};

const createErrorElement = (formGroup) => {
    const error = document.createElement('span');
    error.className = 'error-message';
    formGroup.appendChild(error);
    return error;
};

const showNotification = (type, message) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
};

const disableForm = (form, disabled) => {
    const elements = form.querySelectorAll('input, textarea, button');
    elements.forEach(element => element.disabled = disabled);
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initThemeToggle();
    initContactForm();

    // Update copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Cleanup notifications on theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle?.addEventListener('click', () => {
        document.querySelectorAll('.notification').forEach(n => n.remove());
    });
});