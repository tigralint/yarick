document.addEventListener('DOMContentLoaded', () => {
    
    // REGISTER GSAP PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // =================================================================
    // 1. SMOOTH SCROLL (LENIS) - FINAL SETUP
    // =================================================================
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Синхронизация с GSAP
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // --- ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElem = document.querySelector(targetId);
            
            if (targetElem) {
                if (isMenuOpen) closeMobileMenu(); // Закрываем меню, если открыто
                lenis.scrollTo(targetElem, { offset: 0, duration: 2 });
            }
        });
    });

    // =================================================================
    // 2. CUSTOM CURSOR (HIGH PERFORMANCE)
    // =================================================================
    const cursorOuter = document.querySelector('.cursor-outer');
    const cursorInner = document.querySelector('.cursor-inner');
    
    // Используем quickSetter для скорости
    const setOuterX = gsap.quickSetter(cursorOuter, "x", "px");
    const setOuterY = gsap.quickSetter(cursorOuter, "y", "px");
    const setInnerX = gsap.quickSetter(cursorInner, "x", "px");
    const setInnerY = gsap.quickSetter(cursorInner, "y", "px");

    let mouse = { x: 0, y: 0 };
    let outerPos = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        setInnerX(mouse.x);
        setInnerY(mouse.y);
    });

    gsap.ticker.add((dt) => {
        const speed = 1.0 - Math.pow(0.75, dt);
        outerPos.x += (mouse.x - outerPos.x) * 0.25; 
        outerPos.y += (mouse.y - outerPos.y) * 0.25;
        setOuterX(outerPos.x);
        setOuterY(outerPos.y);
    });

    // Hover эффекты
    document.querySelectorAll('[data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            const type = el.getAttribute('data-cursor');
            document.body.classList.add('hover-active');
            if (type === '-magnetic') document.body.classList.add('hover-magnetic');
        });

        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-active');
            document.body.classList.remove('hover-magnetic');
            gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
        });

        // Магнетизм для кнопок
        if (el.getAttribute('data-cursor') === '-magnetic') {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: relX * 0.4, y: relY * 0.4, duration: 0.3 });
            });
        }
    });

    // =================================================================
    // 3. LOADER SEQUENCE
    // =================================================================
    const loader = document.querySelector('.loader');
    const progress = document.querySelector('.loader-progress');
    const curtain = document.querySelector('.loader-curtain');
    
    document.body.style.overflow = 'hidden';
    lenis.stop();

    const tlLoader = gsap.timeline({
        onComplete: () => {
            loader.style.display = 'none';
            document.body.style.overflow = '';
            lenis.start();
            initAnimations(); 
            ScrollTrigger.refresh();
        }
    });

    tlLoader
        .to(progress, { width: '100%', duration: 1.0, ease: 'power2.inOut' })
        .to('.loader-text', { y: -50, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(curtain, { yPercent: -100, duration: 1, ease: 'power4.inOut' });

    // =================================================================
    // 4. MAIN ANIMATIONS
    // =================================================================
    function initAnimations() {
        
        // A. HERO PARALLAX (Мышка)
        const heroSection = document.querySelector('.hero');
        const heroBg = document.querySelector('.hero-bg img');
        if (heroSection && heroBg) {
            heroSection.addEventListener('mousemove', (e) => {
                const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
                const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
                gsap.to(heroBg, { x: xPos, y: yPos, duration: 1, ease: 'power2.out' });
            });
        }

        // B. TEXT REVEAL
        gsap.utils.toArray('.line-reveal').forEach((line, i) => {
            gsap.to(line, { y: 0, duration: 1.2, delay: i * 0.1, ease: 'power4.out' });
        });
        gsap.to('.hero-label', { opacity: 1, duration: 1, delay: 0.5 });
        gsap.to('.hero-desc', { opacity: 1, duration: 1, delay: 0.8 });
        gsap.to('.hero-action', { opacity: 1, duration: 1, delay: 1 });

        // C. IMAGE REVEAL (При скролле)
        gsap.utils.toArray('.reveal-image img').forEach(img => {
            gsap.fromTo(img, 
                { clipPath: 'inset(100% 0 0 0)', scale: 1.1 },
                { 
                    clipPath: 'inset(0% 0 0 0)', scale: 1,
                    duration: 1.5,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: img.parentElement,
                        start: "top 80%",
                    }
                }
            );
        });

        // D. FOOTER PARALLAX
        gsap.fromTo('.footer-inner', { y: -50, opacity: 0 }, { 
            y: 0, opacity: 1,
            scrollTrigger: { trigger: '.footer', start: "top 90%", end: "bottom bottom", scrub: 1 }
        });
        gsap.fromTo('.footer-giant-text', { yPercent: 50 }, { 
            yPercent: 0,
            scrollTrigger: { trigger: '.footer', start: "top bottom", end: "bottom bottom", scrub: 1 }
        });
    }

    // =================================================================
    // 5. CAROUSEL NAVIGATION (ARROWS)
    // =================================================================
    const track = document.querySelector('.horizontal-track');
    const btnPrev = document.querySelector('.nav-arrow.prev');
    const btnNext = document.querySelector('.nav-arrow.next');
    
    if (track && btnPrev && btnNext) {
        const getScrollAmount = () => {
            // Скроллим на ширину первой карточки + отступ (или 440px как фоллбек)
            const card = track.querySelector('.scenario-card');
            return card ? card.offsetWidth + 40 : 440;
        };

        btnNext.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
    }

    // =================================================================
    // 6. MENU & FORM
    // =================================================================
    const burgerTrigger = document.querySelector('.burger-trigger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.m-link');
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        burgerTrigger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (isMenuOpen) lenis.stop(); else lenis.start();
    }
    
    function closeMobileMenu() {
        if(isMenuOpen) {
            isMenuOpen = false;
            burgerTrigger.classList.remove('active');
            mobileMenu.classList.remove('active');
            lenis.start();
        }
    }

    burgerTrigger.addEventListener('click', toggleMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // Form Handling
    const form = document.querySelector('.booking-form');
    const submitBtn = document.querySelector('.btn-submit span');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Отправка...';
            
            setTimeout(() => {
                submitBtn.innerText = 'Заявка принята';
                submitBtn.parentElement.style.borderColor = '#D4AF37';
                submitBtn.parentElement.style.background = 'rgba(212, 175, 55, 0.1)';
                form.reset();

                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.parentElement.style.borderColor = '';
                    submitBtn.parentElement.style.background = '';
                }, 3000);
            }, 1500);
        });
    }

    // Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    });

});