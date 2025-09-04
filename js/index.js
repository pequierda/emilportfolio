/**
 * Emil Lawrence Portfolio - Main JavaScript File
 * Organized and modularized for better maintainability
 */

// ============================================================================
// GLOBAL VARIABLES AND UTILITIES
// ============================================================================

// Global modal function
function openModal(imageSrc, title, slides = null, slideIndex = 0) {
   
    
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
        this.matrixInterval = setInterval(draw, 33);
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

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.offsetHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            scrollIndicator.style.transform = `scaleX(${scrollPercent / 100})`;
        });
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

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-1 h-1 bg-blue-500/20 rounded-full';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
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
            const res = await fetch(`/api/likes?project=${encodeURIComponent(projectId)}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            return typeof data.count === 'number' ? data.count : 0;
        } catch (e) {
            console.warn('Like count fallback to 0 for', projectId, e);
            return 0;
        }
    }

    async incrementLike(projectId) {
        try {
            const res = await fetch(`/api/likes?project=${encodeURIComponent(projectId)}`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to increment');
            const data = await res.json();
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
        const likeButtons = document.querySelectorAll('.like-btn');
        const updates = [];
        likeButtons.forEach(btn => {
            const projectId = btn.getAttribute('data-project');
            const countSpan = btn.querySelector('.like-count');

            // Load initial count
            updates.push((async () => {
                const count = await this.fetchLikeCount(projectId);
                if (countSpan) countSpan.textContent = String(count);
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
            return typeof data.count === 'number' ? data.count : 0;
        } catch (e) {
            console.warn('Visitor count fallback to 0:', e);
            return 0;
        }
    }

    async incrementVisitorCount() {
        try {
            const res = await fetch('/api/visitors', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to increment visitor count');
            const data = await res.json();
            return typeof data.count === 'number' ? data.count : null;
        } catch (e) {
            console.error('Increment visitor count failed:', e);
            return null;
        }
    }

    async init() {
        const visitorCountElement = document.getElementById('visitor-count');
        if (!visitorCountElement) return;

        const hasVisited = sessionStorage.getItem('hasVisited');
        
        if (!hasVisited) {
            const newCount = await this.incrementVisitorCount();
            if (newCount !== null) {
                visitorCountElement.textContent = newCount.toLocaleString();
                sessionStorage.setItem('hasVisited', 'true');
            }
        } else {
            const count = await this.fetchVisitorCount();
            visitorCountElement.textContent = count.toLocaleString();
        }
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
            
            // Auto-advance slides every 3 seconds
            setInterval(() => {
                nextSlide();
            }, 3000);
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
        this.forceShowImages();
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
    // Initialize all modules
    new ThemeManager();
    new ScrollProgress();
    new ParticleAnimation();
    new MobileMenu();
    new AnimationController();
    new LikesSystem();
    new VisitorCounter();
    new TicTacToe();
    new ProjectCards();
    new ImageModal();
    new BizboxSlideshow();
    new DebugUtils();
    
   
});
