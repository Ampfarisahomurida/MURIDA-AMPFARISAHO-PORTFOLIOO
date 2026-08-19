// Smooth scrolling for navigation links
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

// Active nav link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});


// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe skill cards and portfolio items
document.querySelectorAll('.skill-card, .portfolio-item, .education-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Enhanced Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (hamburger && navLinks) {
        // Toggle mobile menu
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('active');
            hamburger.innerHTML = isOpen ? '✕' : '☰';
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            // Prevent body scroll when menu is open
            if (isOpen) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.innerHTML = '☰';
                hamburger.setAttribute('aria-expanded', 'false');
                body.style.overflow = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                hamburger.innerHTML = '☰';
                body.style.overflow = '';
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.innerHTML = '☰';
                body.style.overflow = '';
            }
        });
    }

    // Enhanced smooth scrolling for all devices
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Touch-friendly interactions
    if ('ontouchstart' in window) {
        // Add touch feedback for buttons
        document.querySelectorAll('button, .cta-button, .submit-btn').forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });

            btn.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }

    // Viewport height fix for mobile browsers
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Performance optimization: Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Enhanced form validation and WhatsApp delivery
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = this.querySelector('input[name="name"]');
            const email = this.querySelector('input[name="email"]');
            const message = this.querySelector('textarea[name="message"]');

            let isValid = true;

            // Simple validation
            if (!name.value.trim()) {
                name.style.borderColor = 'red';
                isValid = false;
            } else {
                name.style.borderColor = '';
            }

            if (!email.value.trim() || !email.value.includes('@')) {
                email.style.borderColor = 'red';
                isValid = false;
            } else {
                email.style.borderColor = '';
            }

            if (!message.value.trim()) {
                message.style.borderColor = 'red';
                isValid = false;
            } else {
                message.style.borderColor = '';
            }

            if (!isValid) {
                alert('Please complete all fields correctly before sending.');
                return;
            }

            const whatsappNumber = '27608944194';
            const whatsappMessage = `New message from ${name.value.trim()} (${email.value.trim()}): ${message.value.trim()}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

            window.open(whatsappUrl, '_blank');

            alert('Your message is being prepared in WhatsApp. Please send it there to complete delivery.');
            this.reset();
        });
    }

    // Add loading animation for better UX
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});

// Add active state for nav links
const addActiveStateStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .nav-links a.active {
            color: var(--secondary-color);
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .hamburger {
                display: block !important;
            }
        }
    `;
    document.head.appendChild(style);
};

addActiveStateStyles();

// Typing animation for hero section
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing animation when page loads
window.addEventListener('load', () => {
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const originalText = tagline.textContent;
        typeWriter(tagline, originalText, 50);
    }
});

// Scroll to top button
const createScrollToTopButton = () => {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-top-btn';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--secondary-color);
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 1.5rem;
        z-index: 999;
    `;
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        } else {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

createScrollToTopButton();

// Console message
console.log('%c👋 Welcome to MURIDA AMPFARISAHO\'s Portfolio', 'font-size: 20px; color: #3498db; font-weight: bold;');
console.log('%cIT Systems Development | Data Analyst | Technical Professional', 'font-size: 14px; color: #2c3e50;');
console.log('%cEmail: muridafoster@gmail.com | Phone: 060 894 4194', 'font-size: 12px; color: #7f8c8d;');

// Simple chat widget for visitor questions about Murida
(function initChatWidget() {
    const chatButton = document.createElement('button');
    chatButton.className = 'chat-toggle';
    chatButton.title = 'Ask about Murida';
    chatButton.innerHTML = '💬';
    document.body.appendChild(chatButton);

    const chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    chatBox.innerHTML = `
        <div class="chat-header">Ask about Murida <div style="display:flex;gap:8px;align-items:center;"><button class="chat-clear-memory" title="Clear conversation">Clear</button><span class="chat-close">✕</span></div></div>
        <div class="chat-messages" aria-live="polite"></div>
        <form class="chat-form">
            <input type="text" name="message" placeholder="Ask me anything about Murida..." autocomplete="off" required />
            <button type="submit">Send</button>
        </form>
    `;
    document.body.appendChild(chatBox);

    const toggle = () => chatBox.classList.toggle('open');

    chatButton.addEventListener('click', toggle);
    chatBox.querySelector('.chat-close').addEventListener('click', toggle);

    const messagesEl = chatBox.querySelector('.chat-messages');
    const form = chatBox.querySelector('.chat-form');

    // Session id persisted in localStorage so memory survives page reloads
    function getSessionId() {
        let sid = localStorage.getItem('chat_sid');
        if (!sid) {
            if (window.crypto && crypto.randomUUID) sid = crypto.randomUUID();
            else sid = `sid_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
            localStorage.setItem('chat_sid', sid);
        }
        return sid;
    }

    const sessionId = getSessionId();

    // Clear memory button
    const clearBtn = chatBox.querySelector('.chat-clear-memory');
    if (clearBtn) {
        clearBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear', sessionId })
                });
                const json = await res.json();
                if (json && json.success) {
                    messagesEl.innerHTML = '';
                    appendMessage('Memory cleared. I will forget previous conversation.', 'bot');
                    // reset stored session id for a fresh session
                    localStorage.removeItem('chat_sid');
                    // generate new session id for future messages
                    getSessionId();
                } else {
                    appendMessage('Unable to clear memory.', 'bot');
                }
            } catch (err) {
                appendMessage('Error clearing memory.', 'bot');
            }
        });
    }

    function appendMessage(text, from = 'bot') {
        const msgWrap = document.createElement('div');
        msgWrap.className = `chat-msg-wrap ${from}`;

        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${from}`;
        avatar.textContent = from === 'user' ? '👤' : '🤖';

        const bubble = document.createElement('div');
        bubble.className = `chat-msg ${from}`;
        bubble.textContent = text;

        const meta = document.createElement('div');
        meta.className = 'chat-meta';
        const time = new Date();
        meta.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(meta);
        if (from === 'user') {
            msgWrap.appendChild(bubble);
            msgWrap.appendChild(avatar);
        } else {
            msgWrap.appendChild(avatar);
            msgWrap.appendChild(bubble);
        }

        messagesEl.appendChild(msgWrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping(on = true) {
        // Ensure only one typing indicator
        let indicator = messagesEl.querySelector('.typing-indicator');
        if (on) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'chat-msg-wrap bot typing-indicator';
                indicator.innerHTML = `<div class="chat-avatar bot">🤖</div><div class="chat-msg bot"><span class="dots">●●●</span><div class="chat-meta">...</div></div>`;
                messagesEl.appendChild(indicator);
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        } else {
            if (indicator) indicator.remove();
        }
    }

    // Greet
    appendMessage('Hi — I can answer questions about Murida. Ask me anything!', 'bot');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[name="message"]');
        const text = input.value.trim();
        if (!text) return;
        appendMessage(text, 'user');
        input.value = '';

        showTyping(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionId })
            });
            if (!res.ok) {
                // try to extract message body
                let bodyText = '';
                try { bodyText = await res.text(); } catch (e) { bodyText = res.statusText; }
                showTyping(false);
                appendMessage(`Chat service error: ${res.status} ${bodyText}`, 'bot');
                console.error('Chat service error', res.status, bodyText);
                return;
            }
            const json = await res.json();
            showTyping(false);
            if (json && json.success && json.reply) {
                appendMessage(json.reply, 'bot');
                // if server returned a new sessionId, persist it
                if (json.sessionId) localStorage.setItem('chat_sid', json.sessionId);
            } else if (json && !json.success && json.error) {
                appendMessage(`Chat service error: ${json.error}`, 'bot');
                console.error('Chat service returned error:', json.error);
            } else {
                appendMessage('Sorry, I could not get an answer right now.', 'bot');
            }
        } catch (err) {
            showTyping(false);
            appendMessage(`Error contacting the chat service: ${err && err.message}`, 'bot');
            console.error('Fetch error contacting /api/chat', err);
        }
    });
})();