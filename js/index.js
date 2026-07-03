/**
 * Emil Lawrence Portfolio - Main JavaScript File
 * Organized and modularized for better maintainability
 */

// Performance/Debug flags
const ENABLE_DEBUG = false;

// Helpers for scheduling
function runWhenIdle(callback) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1500 });
    } else {
        setTimeout(callback, 1);
    }
}

function initWhenVisible(element, initCallback, options = { rootMargin: '200px', threshold: 0.1 }) {
    if (!element) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                initCallback();
                io.disconnect();
            }
        });
    }, options);
    io.observe(element);
}

// ============================================================================
// GLOBAL VARIABLES AND UTILITIES
// ============================================================================

function isMobileView() {
    return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
}

// Global modal function
function openModal(imageSrc, title, slides = null, slideIndex = 0) {
    // Check if this is a certificate URL (Coursera link)
    if (imageSrc.includes('coursera.org/account/accomplishments')) {
        window.open(imageSrc, '_blank', 'noopener,noreferrer');
        return;
    }
    
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalImage || !modalTitle) {
        console.error('Modal elements not found!');
        return;
    }

    modalImage.classList.remove('is-fullscreen');
    modal.classList.remove('is-mobile-fullview');
    modalImage.src = imageSrc;
    modalImage.alt = title;
    modalTitle.textContent = title;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    if (isMobileView()) {
        modal.classList.add('is-mobile-fullview');
        modalImage.classList.add('is-fullscreen');
    }
    
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    
    if (slides && slides.length > 1) {
        window.currentModalSlides = slides;
        window.currentModalSlideIndex = slideIndex;
        if (modalPrev) modalPrev.classList.remove('hidden');
        if (modalNext) modalNext.classList.remove('hidden');
    } else {
        window.currentModalSlides = [];
        if (modalPrev) modalPrev.classList.add('hidden');
        if (modalNext) modalNext.classList.add('hidden');
    }

    if (window.imageModalInstance) {
        window.imageModalInstance.updateFullscreenIcon();
    }
}

function toggleModalFullscreen() {
    const modalImage = document.getElementById('modal-image');
    const modalStage = document.getElementById('modal-stage');
    if (!modalImage) return;

    const isFullscreen = modalImage.classList.toggle('is-fullscreen');

    if (isFullscreen && modalStage?.requestFullscreen) {
        modalStage.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    }

    if (window.imageModalInstance) {
        window.imageModalInstance.updateFullscreenIcon();
    }
}

// Global close modal function
window.closeModalFunc = function() {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    
    if (modalImage) {
        modalImage.classList.remove('is-fullscreen');
    }

    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    }
    
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    
    window.currentModalSlides = [];
    if (modalPrev) modalPrev.classList.add('hidden');
    if (modalNext) modalNext.classList.add('hidden');
}


// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

class ScrollProgress {
    constructor() {
        this.init();
    }
    
    init() {
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-indicator';
        document.body.appendChild(scrollIndicator);

        let ticking = false;
        const update = () => {
            const scrollTop = window.pageYOffset;
            const docHeight = Math.max(1, document.body.offsetHeight - window.innerHeight);
            const scrollPercent = (scrollTop / docHeight) * 100;
            scrollIndicator.style.transform = `scaleX(${scrollPercent / 100})`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });
    }
}

// ============================================================================
// HACKER-STYLE NAME ANIMATION
// ============================================================================

class NameAnimation {
    constructor() {
        this.init();
    }

    renderName(text) {
        const nameContainer = document.getElementById('animated-name');
        if (!nameContainer) return;

        const spaceIndex = text.indexOf(' ');
        if (spaceIndex === -1) {
            nameContainer.innerHTML = `<span class="name-first">${text}</span>`;
            return;
        }

        const first = text.slice(0, spaceIndex);
        const last = text.slice(spaceIndex + 1);
        nameContainer.innerHTML = `<span class="name-first">${first}</span> <span class="name-last">${last}</span>`;
    }
    
    init() {
        const nameContainer = document.getElementById('animated-name');
        if (!nameContainer) return;
        
        const nameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}—=+*^?#";
        const originalName = nameContainer.getAttribute('data-name');
        let iteration = 0;
        let interval = null;

        this.renderName(originalName);
        
        const animate = () => {
            clearInterval(interval);
            iteration = 0;
            interval = setInterval(() => {
                const display = originalName.split("").map((char, index) => {
                    if (char === ' ') return ' ';
                    if (index < iteration) return originalName[index];
                    return nameChars[Math.floor(Math.random() * nameChars.length)];
                }).join("");

                this.renderName(display);
                
                if (iteration >= originalName.length) {
                    clearInterval(interval);
                    this.renderName(originalName);
                    setTimeout(animate, 8000);
                }
                iteration += 1 / 3;
            }, 40);
        };
        
        setTimeout(animate, 1500);
    }
}

// ============================================================================
// TYPEWRITER EFFECT
// ============================================================================

class TypewriterEffect {
    constructor() {
        this.element = document.getElementById('typewriter');
        if (!this.element) return;
        this.phrases = [
            'custom software solutions',
            'POS & inventory systems',
            'Bizbox automation tools',
            'IT infrastructure projects',
            'digital business solutions'
        ];
        this.phraseIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const current = this.phrases[this.phraseIndex];
        const displayed = this.isDeleting
            ? current.substring(0, this.charIndex - 1)
            : current.substring(0, this.charIndex + 1);

        this.element.textContent = displayed;

        if (!this.isDeleting && this.charIndex === current.length) {
            setTimeout(() => { this.isDeleting = true; this.type(); }, 2000);
            return;
        }
        if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        }

        this.charIndex += this.isDeleting ? -1 : 1;
        const speed = this.isDeleting ? 40 : 80;
        setTimeout(() => this.type(), speed);
    }
}

// ============================================================================
// HERO BACKDROP SLIDESHOW
// ============================================================================

class HeroSlideshow {
    constructor() {
        this.container = document.getElementById('hero-slideshow');
        this.titleEl = document.getElementById('hero-now-playing-title');
        if (!this.container) return;

        this.slides = Array.from(this.container.querySelectorAll('.hero-bg-media'));
        if (!this.slides.length) return;

        this.currentIndex = 0;
        this.intervalMs = 5500;
        this.timer = null;

        this.updateNowPlaying();

        if (this.slides.length < 2) return;

        this.init();
    }

    init() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        this.preloadSlide(1);
        this.timer = setInterval(() => this.next(), this.intervalMs);
    }

    updateNowPlaying() {
        const slide = this.slides[this.currentIndex];
        if (!slide || !this.titleEl) return;

        const title = slide.dataset.title || 'Featured Project';
        this.titleEl.style.opacity = '0';

        requestAnimationFrame(() => {
            this.titleEl.textContent = title;
            this.titleEl.style.opacity = '1';
        });
    }

    next() {
        this.slides[this.currentIndex].classList.remove('is-active');
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.slides[this.currentIndex].classList.add('is-active');
        this.updateNowPlaying();
        this.preloadSlide((this.currentIndex + 1) % this.slides.length);
    }

    preloadSlide(index) {
        const slide = this.slides[index];
        if (!slide || slide.complete) return;
        const img = new Image();
        img.src = slide.getAttribute('src');
    }
}

// ============================================================================
// HEADER SCROLL & NAV ACTIVE STATE
// ============================================================================

class HeaderController {
    constructor() {
        this.header = document.getElementById('site-header');
        this.navLinks = document.querySelectorAll('#main-nav a[data-section]');
        this.sections = document.querySelectorAll('section[id]');
        this.init();
    }

    init() {
        if (!this.header) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.header.classList.toggle('scrolled', window.scrollY > 20);
                    this.updateActiveNav();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        this.header.classList.toggle('scrolled', window.scrollY > 20);
        this.updateActiveNav();
    }

    updateActiveNav() {
        let current = 'home';
        const scrollPos = window.scrollY + 120;

        this.sections.forEach(section => {
            if (section.offsetTop <= scrollPos) {
                current = section.id;
            }
        });

        this.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    }
}

// ============================================================================
// PROJECT FILTER
// ============================================================================

class ProjectFilter {
    constructor() {
        this.filters = document.querySelectorAll('.filter-tab');
        this.cards = document.querySelectorAll('.project-card[data-category]');
        this.row = document.querySelector('.netflix-row');
        if (!this.filters.length) return;
        this.init();
    }

    init() {
        this.filters.forEach(tab => {
            tab.addEventListener('click', () => {
                this.filters.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;

                this.cards.forEach(card => {
                    const show = filter === 'all' || card.dataset.category === filter;
                    card.classList.toggle('hidden-filter', !show);
                    if (show) {
                        card.style.animation = 'fadeIn 0.4s ease-out both';
                    }
                });

                this.updateRowVisibility();
            });
        });
    }

    updateRowVisibility() {
        if (!this.row) return;
        const hasVisible = Array.from(this.cards).some(card => !card.classList.contains('hidden-filter'));
        this.row.classList.toggle('row-hidden', !hasVisible);
    }
}

// ============================================================================
// PARTICLE ANIMATION
// ============================================================================

class ParticleAnimation {
    constructor() {
        this.init();
    }
    
    init() {
        const particlesContainer = document.getElementById('particles-bg');
        if (!particlesContainer) return;

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return; // Skip particles for users who prefer reduced motion
        }

        const particleCount = window.innerWidth < 768 ? 12 : 24;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute rounded-full';
            particle.style.width = (Math.random() * 3 + 1) + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = `rgba(229, 9, 20, ${Math.random() * 0.25 + 0.08})`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 12) + 's';
            particle.style.animation = 'particleFloat infinite ease-in-out';
            particlesContainer.appendChild(particle);
        }
    }
}

// ============================================================================
// MOBILE MENU
// ============================================================================

class MobileMenu {
    constructor() {
        this.init();
    }
    
    init() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (!mobileMenuButton || !mobileMenu) return;

        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }
}

// ============================================================================
// FADE-IN ANIMATIONS
// ============================================================================

class AnimationController {
    constructor() {
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const content = entry.target.querySelector('.content-to-animate');
                    if (content) content.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.animate-container').forEach(container => observer.observe(container));

        const heroContent = document.querySelector('#home .content-to-animate');
        if (heroContent) heroContent.classList.add('visible');
    }
}

// ============================================================================
// LIKES COUNTER SYSTEM
// ============================================================================

class LikesSystem {
    constructor() {
        this.init();
    }
    
    async fetchLikeCount(projectId) {
        try {
            const url = `/api/likes?project=${encodeURIComponent(projectId)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const data = await res.json();
            return typeof data.count === 'number' ? data.count : 0;
        } catch (e) {
            return 0;
        }
    }

    async incrementLike(projectId) {
        try {
            const res = await fetch(`/api/likes?project=${encodeURIComponent(projectId)}`, { method: 'POST' });
            if (!res.ok) throw new Error(`Failed to increment: ${res.status}`);
            const data = await res.json();
            return typeof data.count === 'number' ? data.count : null;
        } catch (e) {
            return null;
        }
    }

    markLiked(btn) {
        btn.classList.add('bg-rose-500', 'text-white');
        btn.classList.remove('bg-rose-100', 'text-rose-600');
    }

    async init() {
        const likeButtons = document.querySelectorAll('.like-btn');
        if (!likeButtons.length) return;
        
        const updates = [];
        likeButtons.forEach(btn => {
            const projectId = btn.getAttribute('data-project');
            const countSpan = btn.querySelector('.like-count');

            // Load initial count
            updates.push((async () => {
                const count = await this.fetchLikeCount(projectId);
                if (countSpan) {
                    countSpan.textContent = String(count);
                }
            })());

            // Restore liked state from localStorage
            if (localStorage.getItem(`liked:${projectId}`) === '1') {
                this.markLiked(btn);
            }

            // Click handler
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const already = localStorage.getItem(`liked:${projectId}`) === '1';
                if (already) return;

                const newCount = await this.incrementLike(projectId);
                if (newCount !== null && countSpan) {
                    countSpan.textContent = String(newCount);
                    localStorage.setItem(`liked:${projectId}`, '1');
                    this.markLiked(btn);
                }
            });
        });

        await Promise.allSettled(updates);
    }
}

// ============================================================================
// VISITOR COUNTER SYSTEM
// ============================================================================

class VisitorCounter {
    constructor() {
        this.init();
    }
    
    async fetchVisitorCount() {
        try {
            const res = await fetch('/api/visitors');
            if (!res.ok) throw new Error('Failed to fetch visitor count');
            const data = await res.json();
            return {
                count: typeof data.count === 'number' ? data.count : 0,
                lastVisit: data.lastVisit || null
            };
        } catch (e) {
            return { count: 0, lastVisit: null };
        }
    }

    async incrementVisitorCount() {
        try {
            const res = await fetch('/api/visitors', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to increment visitor count');
            const data = await res.json();
            return {
                count: typeof data.count === 'number' ? data.count : null,
                lastVisit: data.lastVisit || null
            };
        } catch (e) {
            return null;
        }
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    async init() {
        const visitorCountElement = document.getElementById('visitor-count');
        if (!visitorCountElement) return;

        const hasVisited = sessionStorage.getItem('hasVisited');
        
        if (!hasVisited) {
            const result = await this.incrementVisitorCount();
            if (result && result.count !== null) {
                visitorCountElement.textContent = result.count.toLocaleString();
                sessionStorage.setItem('hasVisited', 'true');
            } else {
                // Fallback to show 1 if API fails
                visitorCountElement.textContent = '1';
                sessionStorage.setItem('hasVisited', 'true');
            }
        } else {
            const result = await this.fetchVisitorCount();
            visitorCountElement.textContent = result.count.toLocaleString();
        }
    }
}

// ============================================================================
// SOCIAL MEDIA SHARING
// ============================================================================

// Global share functions
function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out Emil Lawrence's amazing portfolio! 🚀 System Developer & IT Consultant Expert");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    hideShareMenu();
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    hideShareMenu();
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent("Emil Lawrence - System Developer & IT Consultant Expert");
    const summary = encodeURIComponent("Check out this amazing portfolio showcasing custom software development, IT consulting, and technical expertise!");
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    hideShareMenu();
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out Emil Lawrence's amazing portfolio! 🚀 System Developer & IT Consultant Expert");
    const whatsappUrl = `https://wa.me/?text=${text}%20${url}`;
    window.open(whatsappUrl, '_blank');
    hideShareMenu();
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showCopyNotification();
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyNotification();
    });
    hideShareMenu();
}

function toggleShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    if (shareMenu) {
        shareMenu.classList.toggle('hidden');
    }
}

function hideShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    if (shareMenu) {
        shareMenu.classList.add('hidden');
    }
}

function showCopyNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.innerHTML = '<i class="fas fa-check mr-2"></i>Link copied!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Hide share menu when clicking outside
document.addEventListener('click', (e) => {
    const floatingShareBtn = document.getElementById('floatingShareBtn');
    const shareMenu = document.getElementById('shareMenu');
    
    if (floatingShareBtn && shareMenu && !floatingShareBtn.contains(e.target)) {
        shareMenu.classList.add('hidden');
    }
});

// ============================================================================
// LOADING ANIMATIONS & PAGE TRANSITIONS
// ============================================================================

class LoadingAnimations {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.init();
    }
    
    init() {
        // Hide as soon as DOM is ready to improve perceived load
        requestAnimationFrame(() => this.hideLoadingScreen());

        // Still hide on full load in case something re-showed it
        window.addEventListener('load', () => {
            this.hideLoadingScreen();
        });

        // Fallback: hide loading screen after 1.2 seconds max
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1200);

        // Add smooth page transitions
        this.addPageTransitions();
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen && this.loadingScreen.style.display !== 'none') {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    addPageTransitions() {
        // Add smooth transitions to all links
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    this.smoothScrollTo(href);
                }
            });
        });
    }
    
    smoothScrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// ============================================================================
// CONTACT FORM SYSTEM
// ============================================================================

class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.submitText = document.getElementById('submitText');
        this.submitLoading = document.getElementById('submitLoading');
        this.formMessage = document.getElementById('formMessage');
        
        if (this.form) {
            this.init();
        }
    }
    
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        // Validate form
        if (!this.validateForm(data)) {
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        this.hideMessage();
        
        try {
            // Try server-side API first
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.form.reset();
            } else {
                // If server-side fails, try client-side email
                console.log('Server-side email failed, trying client-side...');
                await this.sendEmailClientSide(data);
            }
        } catch (error) {
            console.error('Contact form error:', error);
            // If all else fails, try client-side email
            try {
                await this.sendEmailClientSide(data);
            } catch (clientError) {
                console.error('Client-side email also failed:', clientError);
                this.showMessage('Network error. Please check your connection and try again.', 'error');
            }
        } finally {
            this.setLoadingState(false);
        }
    }
    
    validateForm(data) {
        if (!data.name.trim()) {
            this.showMessage('Please enter your name.', 'error');
            return false;
        }
        
        if (!data.email.trim()) {
            this.showMessage('Please enter your email.', 'error');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return false;
        }
        
        if (!data.subject.trim()) {
            this.showMessage('Please enter a subject.', 'error');
            return false;
        }
        
        if (!data.message.trim()) {
            this.showMessage('Please enter your message.', 'error');
            return false;
        }
        
        if (data.message.trim().length < 10) {
            this.showMessage('Please enter a more detailed message (at least 10 characters).', 'error');
            return false;
        }
        
        return true;
    }
    
    setLoadingState(loading) {
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitText.classList.add('hidden');
            this.submitLoading.classList.remove('hidden');
        } else {
            this.submitBtn.disabled = false;
            this.submitText.classList.remove('hidden');
            this.submitLoading.classList.add('hidden');
        }
    }
    
    showMessage(message, type) {
        this.formMessage.textContent = message;
        this.formMessage.className = `p-4 rounded-xl text-center font-medium ${
            type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`;
        this.formMessage.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }
    
    hideMessage() {
        this.formMessage.classList.add('hidden');
    }
    
    async sendEmailClientSide(data) {
        // Simple client-side email using mailto fallback
        const subject = encodeURIComponent(`Portfolio Contact: ${data.subject}`);
        const body = encodeURIComponent(`
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from your portfolio contact form
        `);
        
        const mailtoLink = `mailto:e.pequierda@yahoo.com?subject=${subject}&body=${body}`;
        
        // Try to open email client
        window.location.href = mailtoLink;
        
        // Show success message
        this.showMessage('Email client opened! Please send the email manually.', 'success');
        this.form.reset();
    }
}

// ============================================================================
// TIC-TAC-TOE GAME
// ============================================================================

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X'; // Human player
        this.aiPlayer = 'O'; // AI player
        this.gameActive = true;
        this.scores = { X: 0, O: 0 };
        this.isPlayerTurn = true;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.cells = document.querySelectorAll('[data-cell]');
        this.statusElement = document.getElementById('status');
        this.restartBtn = document.getElementById('restartBtn');
        this.scoreXElement = document.getElementById('scoreX');
        this.scoreOElement = document.getElementById('scoreO');
        
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        this.updateStatus();
        this.updateScores();
    }
    
    handleCellClick(index) {
        if (this.board[index] !== '' || !this.gameActive || !this.isPlayerTurn) return;
        
        this.makeMove(index, this.currentPlayer);
        this.isPlayerTurn = false;
        this.updateStatus(); // Show "AI is thinking..." immediately
        
        const winner = this.checkWin();
        if (winner) {
            this.handleGameEnd('win', winner);
        } else if (this.checkDraw()) {
            this.handleGameEnd('draw');
        } else {
            // AI's turn
            setTimeout(() => this.aiMove(), 500);
        }
    }
    
    makeMove(index, player) {
        this.board[index] = player;
        this.cells[index].textContent = player;
        this.cells[index].classList.add(player.toLowerCase());
    }
    
    checkWin() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                // Highlight winning cells
                this.cells[a].classList.add('winning');
                this.cells[b].classList.add('winning');
                this.cells[c].classList.add('winning');
                return this.board[a]; // Return the winning player (X or O)
            }
        }
        return null; // No winner
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    handleGameEnd(result, winner = null) {
        this.gameActive = false;
        
        if (result === 'win' && winner) {
            this.scores[winner]++;
            
            if (winner === this.currentPlayer) {
                this.statusElement.textContent = `You win! 🎉`;
                this.statusElement.style.background = 'linear-gradient(45deg, #c6f6d5, #9ae6b4)';
                this.statusElement.style.borderColor = '#68d391';
            } else {
                this.statusElement.textContent = `AI wins! 🤖`;
                this.statusElement.style.background = 'linear-gradient(45deg, #fed7d7, #feb2b2)';
                this.statusElement.style.borderColor = '#fc8181';
            }
        } else {
            this.statusElement.textContent = "It's a draw! 🤝";
            this.statusElement.style.background = 'linear-gradient(45deg, #f7fafc, #edf2f7)';
            this.statusElement.style.borderColor = '#e2e8f0';
        }
        
        this.updateScores();
    }
    
    aiMove() {
        if (!this.gameActive) return;
        
        const bestMove = this.getBestMove();
        this.makeMove(bestMove, this.aiPlayer);
        this.isPlayerTurn = true;
        
        const winner = this.checkWin();
        if (winner) {
            this.handleGameEnd('win', winner);
        } else if (this.checkDraw()) {
            this.handleGameEnd('draw');
        } else {
            this.updateStatus();
        }
    }
    
    getBestMove() {
        // Check for winning move
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.aiPlayer;
                if (this.checkWin()) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Check for blocking player's winning move
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.currentPlayer;
                if (this.checkWin()) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Take center if available
        if (this.board[4] === '') return 4;
        
        // Take corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (this.board[corner] === '') return corner;
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        for (let edge of edges) {
            if (this.board[edge] === '') return edge;
        }
        
        return 0; // Fallback
    }
    
    updateStatus() {
        if (this.gameActive) {
            if (this.isPlayerTurn) {
                this.statusElement.textContent = `Your turn (${this.currentPlayer})`;
            } else {
                this.statusElement.textContent = `AI is thinking...`;
            }
            this.statusElement.style.background = 'linear-gradient(45deg, #f7fafc, #edf2f7)';
            this.statusElement.style.borderColor = '#e2e8f0';
        }
    }
    
    updateScores() {
        this.scoreXElement.textContent = this.scores.X;
        this.scoreOElement.textContent = this.scores.O;
    }
    
    restartGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.aiPlayer = 'O';
        this.gameActive = true;
        this.isPlayerTurn = true;
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning');
        });
        
        this.updateStatus();
    }
}

// ============================================================================
// PROJECT CARD INTERACTIONS
// ============================================================================

class ProjectCards {
    constructor() {
        // Hover effects handled via CSS .project-card:hover
    }
}

// ============================================================================
// IMAGE MODAL SYSTEM
// ============================================================================

class ImageModal {
    constructor() {
        this.modal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.modalTitle = document.getElementById('modal-title');
        this.modalStage = document.getElementById('modal-stage');
        this.closeModal = document.getElementById('close-modal');
        this.fullscreenBtn = document.getElementById('modal-fullscreen');
        this.modalPrev = document.getElementById('modal-prev');
        this.modalNext = document.getElementById('modal-next');
        
        this.currentModalSlides = [];
        this.currentModalSlideIndex = 0;
        
        window.imageModalInstance = this;
        this.init();
    }

    updateFullscreenIcon() {
        if (!this.fullscreenBtn) return;
        const icon = this.fullscreenBtn.querySelector('i');
        const isFullscreen = this.modalImage?.classList.contains('is-fullscreen');
        if (icon) {
            icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
        }
    }
    
    init() {
        this.setupImageClickHandlers();
        this.setupModalNavigation();
        this.setupModalCloseEvents();
    }

    openProjectPreview(img) {
        const imageSrc = img.getAttribute('data-modal-src') || img.src;
        const title = img.getAttribute('data-title') || img.alt || 'Project Image';

        if (img.classList.contains('bizbox-slide')) {
            const slideshow = img.closest('.bizbox-slideshow');
            const slides = slideshow.querySelectorAll('.bizbox-slide');
            const slideIndex = Array.from(slides).indexOf(img);
            openModal(imageSrc, title, slides, slideIndex);
        } else {
            openModal(imageSrc, title);
        }
    }
    
    setupImageClickHandlers() {
        document.querySelectorAll('.project-image-wrap').forEach((wrap) => {
            const img = wrap.querySelector('.project-image');
            if (!img || wrap.querySelector('.project-view-trigger')) return;

            const title = img.getAttribute('data-title') || img.alt || 'Project';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'project-view-trigger';
            btn.setAttribute('aria-label', `View ${title} full screen`);

            const overlay = wrap.querySelector('.project-overlay');
            if (overlay) {
                btn.appendChild(overlay);
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openProjectPreview(img);
            });

            wrap.appendChild(btn);
        });
    }
    
    setupModalNavigation() {
        if (this.modalPrev) {
            this.modalPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevModalSlide();
            });
        }

        if (this.modalNext) {
            this.modalNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextModalSlide();
            });
        }
    }
    
    setupModalCloseEvents() {
        if (this.closeModal) {
            this.closeModal.addEventListener('click', window.closeModalFunc);
        }

        const closeFloating = document.getElementById('close-modal-floating');
        if (closeFloating) {
            closeFloating.addEventListener('click', window.closeModalFunc);
        }

        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', toggleModalFullscreen);
        }

        if (this.modalImage) {
            this.modalImage.addEventListener('click', () => {
                if (!isMobileView()) {
                    toggleModalFullscreen();
                }
            });
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    window.closeModalFunc();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (this.modal?.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                window.closeModalFunc();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleModalFullscreen();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && this.modalImage) {
                this.modalImage.classList.remove('is-fullscreen');
                this.updateFullscreenIcon();
            }
        });
    }
    
    showModalSlide(index) {
        if (this.currentModalSlides.length > 0 && index >= 0 && index < this.currentModalSlides.length) {
            const slide = this.currentModalSlides[index];
            this.modalImage.src = slide.src;
            this.modalImage.alt = slide.alt;
            this.currentModalSlideIndex = index;
        }
    }

    nextModalSlide() {
        if (this.currentModalSlides.length > 0) {
            const nextIndex = (this.currentModalSlideIndex + 1) % this.currentModalSlides.length;
            this.showModalSlide(nextIndex);
        }
    }

    prevModalSlide() {
        if (this.currentModalSlides.length > 0) {
            const prevIndex = (this.currentModalSlideIndex - 1 + this.currentModalSlides.length) % this.currentModalSlides.length;
            this.showModalSlide(prevIndex);
        }
    }
}

// ============================================================================
// BIZBOX SLIDESHOW SYSTEM
// ============================================================================

class BizboxSlideshow {
    constructor() {
        this.init();
    }
    
    init() {
        const bizboxSlideshows = document.querySelectorAll('.bizbox-slideshow');
        
        bizboxSlideshows.forEach(slideshow => {
            const slides = slideshow.querySelectorAll('.bizbox-slide');
            const prevBtn = slideshow.parentElement.querySelector('.bizbox-prev');
            const nextBtn = slideshow.parentElement.querySelector('.bizbox-next');
            let currentSlide = 0;
            
            const showSlide = (index) => {
                slides.forEach((slide, i) => {
                    if (i === index) {
                        slide.classList.add('active');
                    } else {
                        slide.classList.remove('active');
                    }
                });
            };
            
            const nextSlide = () => {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            };
            
            const prevSlide = () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
            };
            
            // Event listeners for navigation buttons
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    prevSlide();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    nextSlide();
                });
            }
            
            // Auto-advance slides every 4 seconds at lower rate
            setInterval(() => {
                nextSlide();
            }, 4000);
        });
    }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

class DebugUtils {
    constructor() {
        this.init();
    }
    
    init() {
        this.debugImageLoading();
        // this.forceShowImages(); // Disabled in production for performance
    }
    
    debugImageLoading() {
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            img.addEventListener('load', () => {
                // Image loaded successfully
            });
            img.addEventListener('error', () => {
                console.error(`❌ Image ${index + 1} failed to load:`, img.src);
            });
        });
    }
    
    forceShowImages() {
        setTimeout(() => {
            const allImages = document.querySelectorAll('img');
            allImages.forEach(img => {
                img.style.opacity = '1';
                img.style.visibility = 'visible';
                img.style.display = 'block';
            });
        }, 1000);
    }
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Critical, lightweight modules first
        new ScrollProgress();
        new HeaderController();
        new MobileMenu();
        new AnimationController();
        new LoadingAnimations();
        new ImageModal();
        new TypewriterEffect();
        new HeroSlideshow();

        runWhenIdle(() => {
            new ParticleAnimation();
        });

        new VisitorCounter();
        new NameAnimation();
        
        const projectsSection = document.getElementById('projects');
        initWhenVisible(projectsSection, () => {
            new LikesSystem();
            new ProjectCards();
            new ProjectFilter();
            new BizboxSlideshow();
        });

        // Initialize game logic when game section approaches viewport
        const gameSection = document.getElementById('game');
        initWhenVisible(gameSection, () => {
            new TicTacToe();
        });

        // Contact form is light but not critical; idle load
        runWhenIdle(() => {
            new ContactForm();
        });

        // Debug utilities only when explicitly enabled
        if (ENABLE_DEBUG) {
            runWhenIdle(() => new DebugUtils());
        }
    } catch (error) {
        console.error('Error initializing modules:', error);
        // Ensure loading screen is hidden even if there's an error
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
});
