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

// Global modal function
function openModal(imageSrc, title, slides = null, slideIndex = 0) {
    // Check if this is a certificate URL (Coursera link)
    if (imageSrc.includes('coursera.org/account/accomplishments')) {
        // Open certificate URL in new tab
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
    
    modalImage.src = imageSrc;
    modalImage.alt = title;
    modalTitle.textContent = title;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Add zoom effect
    modalImage.style.transform = 'scale(0.8)';
    modalImage.style.opacity = '0';
    
    setTimeout(() => {
        modalImage.style.transform = 'scale(1)';
        modalImage.style.opacity = '1';
    }, 50);
    
    // Check if this is a Bizbox slideshow image
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
}

// Global close modal function
window.closeModalFunc = function() {
    const modal = document.getElementById('image-modal');
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    window.currentModalSlides = [];
    if (modalPrev) modalPrev.classList.add('hidden');
    if (modalNext) modalNext.classList.add('hidden');
}

// ============================================================================
// HEARTBEAT MONITOR SYSTEM
// ============================================================================

class HeartbeatMonitor {
    constructor() {
        this.isDarkMode = false;
        this.heartbeatLine = document.getElementById('heartbeat-line');
        this.heartbeatBpm = document.getElementById('heartbeat-bpm');
        this.heartbeatStatus = document.getElementById('heartbeat-status');
        this.audioContext = null;
        this.heartbeatInterval = null;
        this.currentBpm = 72;
        this.points = [];
        this.init();
    }
    
    init() {
        this.setupAudioContext();
        this.startHeartbeat();
        this.updateHeartbeatLine();
        
        // Listen for theme changes
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                setTimeout(() => this.updateTheme(), 100);
            });
        }
        
        this.updateTheme();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    updateTheme() {
        this.isDarkMode = document.documentElement.classList.contains('dark');
        this.updateHeartbeatLine();
        this.updateStatus();
    }
    
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        const interval = this.isDarkMode ? 2000 : 1200; // Slower for dark mode
        this.heartbeatInterval = setInterval(() => {
            // Removed sound - just update BPM
            this.updateBpm();
        }, interval);
        
        // Continuous moving animation for the heartbeat line
        this.animationOffset = 0;
        const animateHeartbeat = () => {
            this.animationOffset += 2; // Move 2 pixels per frame
            this.updateHeartbeatLine();
            requestAnimationFrame(animateHeartbeat);
        };
        animateHeartbeat();
    }
    
    playHeartbeatSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            if (this.isDarkMode) {
                // Flat line sound - low, monotone
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            } else {
                // Normal heartbeat sound - "tit tittt titt"
                const times = [0, 0.1, 0.15, 0.25, 0.3, 0.4];
                const frequencies = [200, 0, 200, 0, 200, 0];
                const gains = [0.2, 0, 0.3, 0, 0.2, 0];
                
                times.forEach((time, index) => {
                    if (frequencies[index] > 0) {
                        oscillator.frequency.setValueAtTime(frequencies[index], this.audioContext.currentTime + time);
                        gainNode.gain.setValueAtTime(gains[index], this.audioContext.currentTime + time);
                    }
                });
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }
    
    updateBpm() {
        if (this.isDarkMode) {
            this.currentBpm = Math.floor(Math.random() * 10) + 20; // Low BPM for flat line
        } else {
            this.currentBpm = Math.floor(Math.random() * 20) + 65; // Normal BPM range
        }
        this.heartbeatBpm.textContent = this.currentBpm;
    }
    
    updateStatus() {
        if (this.isDarkMode) {
            this.heartbeatStatus.textContent = 'FLAT';
            this.heartbeatStatus.className = 'text-xs font-mono font-bold text-gray-500 flat';
        } else {
            this.heartbeatStatus.textContent = 'ALIVE';
            this.heartbeatStatus.className = 'text-xs font-mono font-bold text-green-500 alive';
        }
    }
    
    updateHeartbeatLine() {
        if (!this.heartbeatLine) return;
        
        this.points = [];
        const width = 400;
        const height = 60;
        const centerY = height / 2;
        const time = Date.now() * 0.001;
        
        if (this.isDarkMode) {
            // Flat line for dark mode with slight random movement
            this.points.push(`M 0 ${centerY}`);
            for (let x = 0; x <= width; x += 2) {
                const y = centerY + (Math.random() - 0.5) * 3; // Slight random noise
                this.points.push(`L ${x} ${y}`);
            }
            this.heartbeatLine.classList.remove('heartbeat-line-alive');
            this.heartbeatLine.classList.add('heartbeat-line-flat');
        } else {
            // Realistic ECG waveform with random variations
            this.points.push(`M 0 ${centerY}`);
            
            let x = 0;
            while (x <= width) {
                // Create realistic ECG pattern with animation offset
                const globalX = x + (this.animationOffset || 0);
                const heartbeatCycle = Math.floor(globalX / 120); // Heartbeat every 120 pixels
                const cyclePosition = (globalX % 120) / 120; // Position within current heartbeat
                
                // Generate unique random variations for each wave
                const cycleSeed = heartbeatCycle * 7; // Different seed for each cycle
                const positionSeed = Math.floor(cyclePosition * 100); // Position-based seed
                const timeSeed = Math.floor(this.animationOffset / 10); // Time-based seed
                
                // Unique random values for each wave
                const randomP = (Math.sin(cycleSeed + positionSeed + timeSeed) + 1) * 0.5;
                const randomQ = (Math.sin(cycleSeed * 1.3 + positionSeed * 0.7 + timeSeed * 0.5) + 1) * 0.5;
                const randomR = (Math.sin(cycleSeed * 0.8 + positionSeed * 1.2 + timeSeed * 0.3) + 1) * 0.5;
                const randomS = (Math.sin(cycleSeed * 1.7 + positionSeed * 0.9 + timeSeed * 0.8) + 1) * 0.5;
                const randomT = (Math.sin(cycleSeed * 0.5 + positionSeed * 1.1 + timeSeed * 0.6) + 1) * 0.5;
                const randomBaseline = (Math.sin(cycleSeed * 2.1 + positionSeed * 0.3 + timeSeed * 1.2) + 1) * 0.5;
                
                let y = centerY;
                
                if (cyclePosition < 0.15) {
                    // TP Segment - unique baseline variation
                    const baselineShift = (randomBaseline - 0.5) * 6; // -3 to +3
                    y = centerY + baselineShift + (Math.random() - 0.5) * 2;
                } else if (cyclePosition < 0.2) {
                    // P Wave - unique amplitude and shape
                    const pAmplitude = 4 + (randomP * 12); // 4-16
                    const pWidth = 0.03 + (randomP * 0.02); // Variable width
                    const pWave = Math.sin((cyclePosition - 0.15) * Math.PI / pWidth) * pAmplitude;
                    y = centerY - pWave + (Math.random() - 0.5) * 3;
                } else if (cyclePosition < 0.25) {
                    // PR Segment - unique variation
                    const prShift = (randomBaseline - 0.5) * 4;
                    y = centerY + prShift + (Math.random() - 0.5) * 2;
                } else if (cyclePosition < 0.3) {
                    // Q Wave - unique amplitude and timing
                    const qAmplitude = 5 + (randomQ * 20); // 5-25
                    const qWidth = 0.03 + (randomQ * 0.02);
                    const qWave = Math.sin((cyclePosition - 0.25) * Math.PI / qWidth) * qAmplitude;
                    y = centerY + qWave + (Math.random() - 0.5) * 3;
                } else if (cyclePosition < 0.35) {
                    // R Wave - unique amplitude (main spike)
                    const rAmplitude = 20 + (randomR * 30); // 20-50
                    const rWidth = 0.03 + (randomR * 0.02);
                    const rWave = Math.sin((cyclePosition - 0.3) * Math.PI / rWidth) * rAmplitude;
                    y = centerY - rWave + (Math.random() - 0.5) * 4;
                } else if (cyclePosition < 0.4) {
                    // S Wave - unique amplitude and shape
                    const sAmplitude = 10 + (randomS * 25); // 10-35
                    const sWidth = 0.03 + (randomS * 0.02);
                    const sWave = Math.sin((cyclePosition - 0.35) * Math.PI / sWidth) * sAmplitude;
                    y = centerY + sWave + (Math.random() - 0.5) * 3;
                } else if (cyclePosition < 0.5) {
                    // ST Segment - unique variation
                    const stShift = (randomBaseline - 0.5) * 5;
                    y = centerY + stShift + (Math.random() - 0.5) * 2;
                } else if (cyclePosition < 0.6) {
                    // T Wave - unique amplitude and width
                    const tAmplitude = 8 + (randomT * 18); // 8-26
                    const tWidth = 0.08 + (randomT * 0.04); // Variable width
                    const tWave = Math.sin((cyclePosition - 0.5) * Math.PI / tWidth) * tAmplitude;
                    y = centerY - tWave + (Math.random() - 0.5) * 3;
                } else if (cyclePosition < 0.85) {
                    // TP Segment - unique baseline variation
                    const tpShift = (randomBaseline - 0.5) * 8;
                    y = centerY + tpShift + (Math.random() - 0.5) * 4;
                } else {
                    // Transition to next cycle - unique variation
                    const transitionShift = (randomBaseline - 0.5) * 6;
                    y = centerY + transitionShift + (Math.random() - 0.5) * 3;
                }
                
                // Add random noise to all segments
                y += (Math.random() - 0.5) * 2;
                
                // Ensure y stays within bounds
                y = Math.max(5, Math.min(height - 5, y));
                
                this.points.push(`L ${x} ${y}`);
                x += 2;
            }
            
            this.heartbeatLine.classList.remove('heartbeat-line-flat');
            this.heartbeatLine.classList.add('heartbeat-line-alive');
        }
        
        this.heartbeatLine.setAttribute('d', this.points.join(' '));
    }
}

// ============================================================================
// THEME AND MATRIX ANIMATION MODULE
// ============================================================================

class ThemeManager {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        this.themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
        this.matrixCanvas = document.getElementById('matrix-bg');
        this.matrixInterval = null;
        
        this.init();
    }
    
    init() {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        this.setTheme(isDarkMode);
        
        // Set initial portrait based on theme
        const emilPortrait = document.querySelector('#about img[src*="emil"]');
        if (emilPortrait && isDarkMode) {
            emilPortrait.src = 'images/emil1.png';
        }
        
        this.themeToggleBtn.addEventListener('click', () => 
            this.setTheme(!document.documentElement.classList.contains('dark'))
        );
        
        window.addEventListener('resize', () => {
            if (document.documentElement.classList.contains('dark')) {
                this.startMatrixAnimation();
            }
        });
    }
    
    startMatrixAnimation() {
        // Respect reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.stopMatrixAnimation();
            return;
        }
        if (this.matrixInterval) clearInterval(this.matrixInterval);
        
        const matrixCtx = this.matrixCanvas.getContext('2d');
        this.matrixCanvas.style.display = 'block';
        this.matrixCanvas.width = window.innerWidth;
        this.matrixCanvas.height = window.innerHeight;
        const chars = "010101010100001101110010101010101010101010101";
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = this.matrixCanvas.width / fontSize;
        let drops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            matrixCtx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);
            matrixCtx.fillStyle = '#0F0'; // Classic green color
            matrixCtx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                matrixCtx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > this.matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        // Slightly lower frame rate to reduce CPU/GPU usage
        this.matrixInterval = setInterval(draw, 50);
    }

    stopMatrixAnimation() {
        if (this.matrixInterval) clearInterval(this.matrixInterval);
        this.matrixInterval = null;
        this.matrixCanvas.style.display = 'none';
    }

    setTheme(isDark) {
        const emilPortrait = document.querySelector('#about img[src*="emil"]');
        
        if (isDark) {
            document.documentElement.classList.add('dark');
            this.themeToggleLightIcon.classList.remove('hidden');
            this.themeToggleDarkIcon.classList.add('hidden');
            localStorage.setItem('theme', 'dark');
            this.startMatrixAnimation();
            
            if (emilPortrait) {
                emilPortrait.src = 'images/emil1.png';
            }
        } else {
            document.documentElement.classList.remove('dark');
            this.themeToggleDarkIcon.classList.remove('hidden');
            this.themeToggleLightIcon.classList.add('hidden');
            localStorage.setItem('theme', 'light');
            this.stopMatrixAnimation();
            
            if (emilPortrait) {
                emilPortrait.src = 'images/emil.png';
            }
        }
    }
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
    
    init() {
        const nameContainer = document.getElementById('animated-name');
        if (!nameContainer) return;
        
        const nameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}—=+*^?#";
        const originalName = nameContainer.getAttribute('data-name');
        const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
        let colorIndex = 0, iteration = 0, direction = -1, interval = null;
        nameContainer.innerText = originalName;
        
        const changeColor = () => { 
            nameContainer.style.color = colors[colorIndex]; 
            nameContainer.style.textShadow = `0 0 8px ${colors[colorIndex]}60, 0 0 20px ${colors[colorIndex]}30`; 
            colorIndex = (colorIndex + 1) % colors.length; 
        };

        const animate = () => {
            clearInterval(interval);
            iteration = (direction === 1) ? 0 : originalName.length;
            interval = setInterval(() => {
                nameContainer.innerText = originalName.split("").map((_, index) => { 
                    if (originalName[index] === ' ') return ' '; 
                    if ( (direction === 1 && index < iteration) || (direction === -1 && index < iteration) ) { 
                        return originalName[index]; 
                    } 
                    return nameChars[Math.floor(Math.random() * nameChars.length)]; 
                }).join("");
                if ((direction === 1 && iteration >= originalName.length) || (direction === -1 && iteration <= 0)) {
                    direction *= -1;
                    clearInterval(interval);
                    if (direction === -1) { 
                        setInterval(changeColor, 1000); 
                        setTimeout(animate, 5000); 
                    } else { 
                        setTimeout(animate, 1000); 
                    }
                }
                iteration += (1 / 8) * direction;
            }, 50);
        };
        setTimeout(animate, 2000);
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

        const particleCount = window.innerWidth < 768 ? 18 : 36;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-1 h-1 bg-blue-500/20 rounded-full';
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
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
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
        const animateContainers = document.querySelectorAll('.animate-container');
        
        // Immediately show all content
        animateContainers.forEach(container => {
            const content = container.querySelector('.content-to-animate');
            if (content) {
                content.classList.add('visible');
                if (container.id === 'home') { 
                    new NameAnimation();
                }
            }
        });

        // Optional: Keep intersection observer for future animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const content = container.querySelector('.content-to-animate');
                    if (content && !content.classList.contains('visible')) {
                        content.classList.add('visible');
                    }
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.1 });

        animateContainers.forEach(container => observer.observe(container));
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
            console.log('Fetching like count for project:', projectId);
            const url = `/api/likes?project=${encodeURIComponent(projectId)}`;
            console.log('Fetching from URL:', url);
            const res = await fetch(url);
            console.log('Like count response status:', res.status);
            console.log('Like count response headers:', res.headers);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
            const data = await res.json();
            console.log('Like count data:', data);
            return typeof data.count === 'number' ? data.count : 0;
        } catch (e) {
            console.error('Like count fetch error for', projectId, e);
            return 0;
        }
    }

    async incrementLike(projectId) {
        try {
            console.log('Incrementing like for project:', projectId);
            const res = await fetch(`/api/likes?project=${encodeURIComponent(projectId)}`, { method: 'POST' });
            console.log('Increment like response status:', res.status);
            if (!res.ok) throw new Error(`Failed to increment: ${res.status}`);
            const data = await res.json();
            console.log('Increment like data:', data);
            return typeof data.count === 'number' ? data.count : null;
        } catch (e) {
            console.error('Increment like failed', projectId, e);
            return null;
        }
    }

    markLiked(btn) {
        btn.classList.add('bg-rose-500', 'text-white');
        btn.classList.remove('bg-rose-100', 'text-rose-600');
    }

    async init() {
        console.log('LikesSystem initializing...');
        const likeButtons = document.querySelectorAll('.like-btn');
        console.log('Found like buttons:', likeButtons.length);
        if (!likeButtons.length) {
            console.warn('No like buttons found!');
            console.log('Available elements with "like" in class:', document.querySelectorAll('[class*="like"]'));
            return;
        }
        
        // Test if we can find the like count spans
        const likeCounts = document.querySelectorAll('.like-count');
        console.log('Found like count spans:', likeCounts.length);
        likeCounts.forEach((span, index) => {
            console.log(`Like count ${index}:`, span);
            // Set a test value to see if elements work
            span.textContent = 'TEST';
        });
        
        const updates = [];
        likeButtons.forEach(btn => {
            const projectId = btn.getAttribute('data-project');
            const countSpan = btn.querySelector('.like-count');
            console.log('Processing like button for project:', projectId);

            // Load initial count
            updates.push((async () => {
                const count = await this.fetchLikeCount(projectId);
                if (countSpan) {
                    countSpan.textContent = String(count);
                    console.log('Set initial count for', projectId, 'to', count);
                }
            })());

            // Restore liked state from localStorage
            if (localStorage.getItem(`liked:${projectId}`) === '1') {
                this.markLiked(btn);
                console.log('Restored liked state for', projectId);
            }

            // Click handler
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Like button clicked for project:', projectId);
                const already = localStorage.getItem(`liked:${projectId}`) === '1';
                if (already) {
                    console.log('Already liked, ignoring click');
                    return;
                }

                const newCount = await this.incrementLike(projectId);
                if (newCount !== null && countSpan) {
                    countSpan.textContent = String(newCount);
                    localStorage.setItem(`liked:${projectId}`, '1');
                    this.markLiked(btn);
                    console.log('Like successful, new count:', newCount);
                } else {
                    console.log('Like failed, newCount:', newCount);
                }
            });
        });

        await Promise.allSettled(updates);
        console.log('LikesSystem initialization complete');
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
            console.log('Fetching visitor count...');
            const res = await fetch('/api/visitors');
            console.log('Visitor count response status:', res.status);
            if (!res.ok) throw new Error('Failed to fetch visitor count');
            const data = await res.json();
            console.log('Visitor count data:', data);
            return {
                count: typeof data.count === 'number' ? data.count : 0,
                lastVisit: data.lastVisit || null
            };
        } catch (e) {
            console.error('Visitor count fetch error:', e);
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
            console.error('Increment visitor count failed:', e);
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
        console.log('VisitorCounter initializing...');
        const visitorCountElement = document.getElementById('visitor-count');
        if (!visitorCountElement) {
            console.error('Visitor count element not found!');
            console.log('Available elements with "visitor" in id:', document.querySelectorAll('[id*="visitor"]'));
            return;
        }
        console.log('Visitor count element found:', visitorCountElement);

        // Force set a test value first to see if the element works
        visitorCountElement.textContent = 'TEST';
        console.log('Set test value, element now shows:', visitorCountElement.textContent);

        const hasVisited = sessionStorage.getItem('hasVisited');
        console.log('Has visited before:', hasVisited);
        
        if (!hasVisited) {
            console.log('First visit - incrementing counter...');
            const result = await this.incrementVisitorCount();
            console.log('Increment result:', result);
            if (result && result.count !== null) {
                visitorCountElement.textContent = result.count.toLocaleString();
                sessionStorage.setItem('hasVisited', 'true');
                console.log('Visitor count updated to:', result.count);
            } else {
                // Fallback to show 1 if API fails
                visitorCountElement.textContent = '1';
                sessionStorage.setItem('hasVisited', 'true');
                console.log('Fallback: Set visitor count to 1');
            }
        } else {
            console.log('Returning visitor - fetching count...');
            const result = await this.fetchVisitorCount();
            console.log('Fetch result:', result);
            visitorCountElement.textContent = result.count.toLocaleString();
            console.log('Visitor count displayed as:', result.count);
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
        this.init();
    }
    
    init() {
        const projectCards = document.querySelectorAll('.group');
        projectCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
                this.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
            });
        });
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
        this.closeModal = document.getElementById('close-modal');
        this.modalPrev = document.getElementById('modal-prev');
        this.modalNext = document.getElementById('modal-next');
        this.projectImages = document.querySelectorAll('.project-image');
        
        this.currentModalSlides = [];
        this.currentModalSlideIndex = 0;
        
        this.init();
    }
    
    init() {
        this.setupImageClickHandlers();
        this.setupModalNavigation();
        this.setupModalCloseEvents();
    }
    
    setupImageClickHandlers() {
        this.projectImages.forEach((img, index) => {
            // Remove any existing click listeners
            img.removeEventListener('click', img.clickHandler);
            
            // Create new click handler
            img.clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Image clicked:', img.src);
                
                const imageSrc = img.src;
                const title = img.getAttribute('data-title') || 'Project Image';
                
                // Check if this is a Bizbox slideshow image
                if (img.classList.contains('bizbox-slide')) {
                    const slideshow = img.closest('.bizbox-slideshow');
                    const slides = slideshow.querySelectorAll('.bizbox-slide');
                    const slideIndex = Array.from(slides).indexOf(img);
                    openModal(imageSrc, title, slides, slideIndex);
                } else {
                    openModal(imageSrc, title);
                }
            };
            
            img.addEventListener('click', img.clickHandler);
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
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    window.closeModalFunc();
                }
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                window.closeModalFunc();
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
        new ThemeManager();
        new ScrollProgress();
        new MobileMenu();
        new AnimationController();
        new LoadingAnimations();
        new ImageModal();
        new HeartbeatMonitor();

        // Defer heavier/secondary modules until idle or visibility
        runWhenIdle(() => {
            new ParticleAnimation();
        });

        // Initialize visitor counter immediately (needs to be available on page load)
        console.log('Initializing VisitorCounter...');
        
        // Quick test to see if visitor count element exists
        const testElement = document.getElementById('visitor-count');
        if (testElement) {
            console.log('✅ Visitor count element found, setting test value...');
            testElement.textContent = 'TESTING';
        } else {
            console.log('❌ Visitor count element NOT found!');
        }
        
        new VisitorCounter();
        
        // Initialize likes when projects section is near viewport
        const projectsSection = document.getElementById('projects');
        console.log('Projects section found:', projectsSection);
        initWhenVisible(projectsSection, () => {
            console.log('Projects section is visible, initializing LikesSystem...');
            new LikesSystem();
            new ProjectCards();
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
