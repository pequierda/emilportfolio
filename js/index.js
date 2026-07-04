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
        this.heroTitle = document.querySelector('#home .hero-title');
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
                    this.updateBrandVisibility();
                    this.updateActiveNav();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', () => this.updateBrandVisibility(), { passive: true });
        window.addEventListener('portfolio:revealed', () => this.updateBrandVisibility());

        this.header.classList.toggle('scrolled', window.scrollY > 20);
        this.updateBrandVisibility();
        this.updateActiveNav();
    }

    updateBrandVisibility() {
        if (!this.header || !this.heroTitle) return;

        const titleRect = this.heroTitle.getBoundingClientRect();
        const headerBottom = this.header.offsetHeight;
        const titleOnScreen = titleRect.bottom > headerBottom && titleRect.top < window.innerHeight;

        this.header.classList.toggle('hide-brand-overlap', titleOnScreen);
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
        this.staggerMs = 100;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        if (this.reducedMotion) {
            document.querySelectorAll('.content-to-animate').forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const items = entry.target.classList.contains('content-to-animate')
                    ? [entry.target]
                    : [...entry.target.querySelectorAll('.content-to-animate')];

                items.forEach((el, index) => {
                    el.style.setProperty('--reveal-delay', `${index * 0.1}s`);
                    requestAnimationFrame(() => el.classList.add('visible'));
                });

                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -6% 0px'
        });

        document.querySelectorAll('.animate-container').forEach(container => observer.observe(container));
    }

    revealAboveFold() {
        if (this.reducedMotion) {
            document.querySelectorAll('.content-to-animate').forEach(el => el.classList.add('visible'));
            return;
        }

        document.querySelectorAll('.animate-container').forEach(container => {
            const rect = container.getBoundingClientRect();
            if (rect.top >= window.innerHeight * 0.92) return;

            const items = container.querySelectorAll('.content-to-animate');
            items.forEach((el, index) => {
                if (el.classList.contains('visible')) return;
                el.style.setProperty('--reveal-delay', `${index * 0.1}s`);
                el.classList.add('visible');
            });
        });
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
// PAGE LOADER — wait for assets before revealing content
// ============================================================================

class PageLoader {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.startTime = Date.now();
        this.minDisplayMs = 800;
        this.maxWaitMs = 45000;
        this.animationController = null;
    }

    waitForImage(img, timeoutMs = 20000) {
        return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
            }

            if (img.loading === 'lazy') {
                img.loading = 'eager';
            }

            const finish = () => {
                clearTimeout(timer);
                resolve();
            };

            const timer = setTimeout(finish, timeoutMs);
            img.addEventListener('load', finish, { once: true });
            img.addEventListener('error', finish, { once: true });

            if (!img.complete && img.src) {
                const src = img.getAttribute('src');
                if (src) img.src = src;
            }
        });
    }

    waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            return document.fonts.ready.catch(() => {});
        }
        return Promise.resolve();
    }

    waitForWindowLoad() {
        if (document.readyState === 'complete') {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            window.addEventListener('load', resolve, { once: true });
        });
    }

    waitForStylesheets() {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const pending = links.filter((link) => !link.sheet);

        if (!pending.length) {
            return Promise.resolve();
        }

        return Promise.all(pending.map((link) => new Promise((resolve) => {
            link.addEventListener('load', resolve, { once: true });
            link.addEventListener('error', resolve, { once: true });
        })));
    }

    waitForImages() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const images = isMobile
            ? Array.from(document.querySelectorAll('#hero-slideshow .hero-bg-media.is-active, .cast-avatar img'))
            : Array.from(document.querySelectorAll('img[src]'));

        if (!images.length) {
            return Promise.resolve();
        }

        const timeout = isMobile ? 12000 : 20000;
        return Promise.all(images.map((img) => this.waitForImage(img, timeout)));
    }

    async waitForReady() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const ready = Promise.all([
            this.waitForWindowLoad(),
            this.waitForStylesheets(),
            this.waitForFonts(),
            this.waitForImages()
        ]);

        const timeoutMs = isMobile ? 20000 : this.maxWaitMs;
        const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
        await Promise.race([ready, timeout]);
    }

    async ensureMinDisplay() {
        const elapsed = Date.now() - this.startTime;
        const remaining = this.minDisplayMs - elapsed;
        if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
        }
    }

    revealPage() {
        document.documentElement.classList.remove('site-loading');
        document.body.classList.remove('site-loading');
        document.documentElement.style.overflow = '';

        if (this.animationController) {
            this.animationController.revealAboveFold();
        }

        requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent('portfolio:revealed'));
        });

        if (!this.loadingScreen) return;

        this.loadingScreen.style.opacity = '0';
        this.loadingScreen.style.transition = 'opacity 0.6s ease-out';

        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 600);
    }

    setAnimationController(controller) {
        this.animationController = controller;
    }

    async start() {
        try {
            await this.waitForReady();
            await this.ensureMinDisplay();
        } catch (error) {
            console.error('PageLoader:', error);
        } finally {
            this.revealPage();
        }
    }
}

// ============================================================================
// LOADING ANIMATIONS & PAGE TRANSITIONS
// ============================================================================

class LoadingAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        this.addPageTransitions();
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
        if (!element) return;

        const header = document.getElementById('site-header');
        const offset = header ? header.offsetHeight : 0;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top, behavior: 'smooth' });

        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) mobileMenu.classList.add('hidden');
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
        this.firstMover = 'player';
        this.currentPlayer = 'X';
        this.aiPlayer = 'O';
        this.gameActive = true;
        this.scores = { X: 0, O: 0 };
        this.isPlayerTurn = true;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.cells = document.querySelectorAll('[data-cell]');
        this.statusElement = document.getElementById('status');
        this.restartBtn = document.getElementById('restartBtn');
        this.scoreYouElement = document.getElementById('scoreYou');
        this.scoreAIElement = document.getElementById('scoreAI');
        this.scoreYouLabel = document.getElementById('scoreYouLabel');
        this.scoreAILabel = document.getElementById('scoreAILabel');
        this.firstMoveOptions = document.getElementById('firstMoveOptions');
        
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.setupFirstMoveOptions();
        this.applyRoles();
        this.updateScores();
        this.startTurn();
    }

    setupFirstMoveOptions() {
        if (!this.firstMoveOptions) return;

        this.firstMoveOptions.querySelectorAll('.game-first-move-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.first;
                if (choice === this.firstMover) return;

                this.firstMover = choice;
                this.firstMoveOptions.querySelectorAll('.game-first-move-btn').forEach(option => {
                    option.classList.toggle('active', option.dataset.first === choice);
                });
                this.restartGame();
            });
        });
    }

    applyRoles() {
        if (this.firstMover === 'player') {
            this.currentPlayer = 'X';
            this.aiPlayer = 'O';
        } else {
            this.currentPlayer = 'O';
            this.aiPlayer = 'X';
        }

        this.isPlayerTurn = this.firstMover === 'player';
        this.updateScoreLabels();
    }

    updateScoreLabels() {
        if (this.scoreYouLabel) this.scoreYouLabel.textContent = `You (${this.currentPlayer})`;
        if (this.scoreAILabel) this.scoreAILabel.textContent = `AI (${this.aiPlayer})`;
    }

    startTurn() {
        this.updateStatus();

        if (this.gameActive && !this.isPlayerTurn) {
            setTimeout(() => this.aiMove(), 500);
        }
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
        const winner = this.getWinner(this.board);
        if (!winner || winner === 'draw') return null;

        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const [a, b, c] of winConditions) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.cells[a].classList.add('winning');
                this.cells[b].classList.add('winning');
                this.cells[c].classList.add('winning');
                break;
            }
        }

        return winner;
    }

    getWinner(board) {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const [a, b, c] of winConditions) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        if (board.every(cell => cell !== '')) return 'draw';
        return null;
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    setStatusState(state) {
        const states = ['status--player', 'status--ai', 'status--win', 'status--lose', 'status--draw'];
        this.statusElement.classList.remove(...states);
        if (state) this.statusElement.classList.add(`status--${state}`);
        this.statusElement.style.background = '';
        this.statusElement.style.borderColor = '';
    }

    handleGameEnd(result, winner = null) {
        this.gameActive = false;
        
        if (result === 'win' && winner) {
            this.scores[winner]++;
            
            if (winner === this.currentPlayer) {
                this.statusElement.textContent = `You win! 🎉`;
                this.setStatusState('win');
            } else {
                this.statusElement.textContent = `AI wins! 🤖`;
                this.setStatusState('lose');
            }
        } else {
            this.statusElement.textContent = "It's a draw! 🤝";
            this.setStatusState('draw');
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
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (this.board[i] !== '') continue;

            this.board[i] = this.aiPlayer;
            const score = this.minimax(this.board, false, 1);
            this.board[i] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }

        return bestMove >= 0 ? bestMove : this.board.findIndex(cell => cell === '');
    }

    minimax(board, isMaximizing, depth) {
        const winner = this.getWinner(board);

        if (winner === this.aiPlayer) return 10 - depth;
        if (winner === this.currentPlayer) return depth - 10;
        if (winner === 'draw') return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] !== '') continue;
                board[i] = this.aiPlayer;
                bestScore = Math.max(bestScore, this.minimax(board, false, depth + 1));
                board[i] = '';
            }
            return bestScore;
        }

        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = this.currentPlayer;
            bestScore = Math.min(bestScore, this.minimax(board, true, depth + 1));
            board[i] = '';
        }
        return bestScore;
    }
    
    updateStatus() {
        if (this.gameActive) {
            if (this.isPlayerTurn) {
                this.statusElement.textContent = `Your turn (${this.currentPlayer})`;
                this.setStatusState('player');
            } else {
                this.statusElement.textContent = `AI is thinking...`;
                this.setStatusState('ai');
            }
        }
    }
    
    updateScores() {
        if (this.scoreYouElement) this.scoreYouElement.textContent = this.scores[this.currentPlayer];
        if (this.scoreAIElement) this.scoreAIElement.textContent = this.scores[this.aiPlayer];
    }
    
    restartGame() {
        this.board = Array(9).fill('');
        this.gameActive = true;
        
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning');
        });

        this.applyRoles();
        this.startTurn();
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
    const pageLoader = new PageLoader();
    const animationController = new AnimationController();
    pageLoader.setAnimationController(animationController);

    pageLoader.start();

    try {
        new ScrollProgress();
        new HeaderController();
        new MobileMenu();
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
        document.documentElement.classList.remove('site-loading');
        document.body.classList.remove('site-loading');
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
});
