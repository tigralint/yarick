document.addEventListener('DOMContentLoaded', () => {
    
    // REGISTER GSAP PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // =================================================================
    // 1. SMOOTH SCROLL (LENIS) - PREMIUM SETUP
    // =================================================================
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.8, // Чуть плавнее колесо
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Синхронизация Lenis и GSAP
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // --- FIX: ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРНЫМ ССЫЛКАМ ---
    // Перехватываем все клики по ссылкам с #
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault(); // Отменяем стандартный "прыжок"
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElem = document.querySelector(targetId);
            
            if (targetElem) {
                // Если открыто мобильное меню - закрываем его
                if (isMenuOpen) closeMobileMenu();

                // Плавный скролл силами Lenis
                lenis.scrollTo(targetElem, {
                    offset: 0,
                    duration: 1.8, // Чуть дольше, чтобы было кинематографично
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        });
    });

    // =================================================================
    // 2. HIGH REFRESH RATE CURSOR (144Hz+ Ready)
    // =================================================================
    const cursorOuter = document.querySelector('.cursor-outer');
    const cursorInner = document.querySelector('.cursor-inner');
    
    // Используем quickSetter для максимальной производительности (без лагов)
    const setOuterX = gsap.quickSetter(cursorOuter, "x", "px");
    const setOuterY = gsap.quickSetter(cursorOuter, "y", "px");
    const setInnerX = gsap.quickSetter(cursorInner, "x", "px");
    const setInnerY = gsap.quickSetter(cursorInner, "y", "px");

    let mouse = { x: 0, y: 0 };
    let outerPos = { x: 0, y: 0 };
    
    // Просто обновляем координаты мыши
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Внутреннюю точку двигаем моментально (без GSAP, чтобы не было задержки ввода)
        setInnerX(mouse.x);
        setInnerY(mouse.y);
    });

    // Анимационный цикл через GSAP Ticker (синхронизация с герцовкой монитора)
    gsap.ticker.add((dt) => {
        const speed = 1.0 - Math.pow(0.75, dt); // Адаптация под FPS
        
        // Лерп (сглаживание), но более "тугое", чтобы не было желе
        outerPos.x += (mouse.x - outerPos.x) * 0.25; 
        outerPos.y += (mouse.y - outerPos.y) * 0.25;
        
        setOuterX(outerPos.x);
        setOuterY(outerPos.y);
    });

    // Hover эффекты
    const hoverElements = document.querySelectorAll('[data-cursor]');
    
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const type = el.getAttribute('data-cursor');
            document.body.classList.add('hover-active');
            if (type === '-magnetic') document.body.classList.add('hover-magnetic');
        });

        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-active');
            document.body.classList.remove('hover-magnetic');
            // Возврат кнопки на место
            gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
        });

        // Магнитный эффект (Кнопка тянется к мышке)
        if (el.getAttribute('data-cursor') === '-magnetic') {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;

                gsap.to(el, {
                    x: relX * 0.4,
                    y: relY * 0.4,
                    duration: 0.3, // Чуть быстрее реакция
                    ease: 'power2.out'
                });
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
        .to(progress, { width: '100%', duration: 1.0, ease: 'power2.inOut' }) // Чуть быстрее загрузка
        .to('.loader-text', { y: -50, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(curtain, { yPercent: -100, duration: 1, ease: 'power4.inOut' });

    // =================================================================
    // 4. MAIN ANIMATIONS
    // =================================================================
    
    function initAnimations() {
        
        // A. HERO PARALLAX
        const heroSection = document.querySelector('.hero');
        const heroBg = document.querySelector('.hero-bg img');
        
        heroSection.addEventListener('mousemove', (e) => {
            const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
            const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
            
            gsap.to(heroBg, {
                x: xPos,
                y: yPos,
                duration: 1,
                ease: 'power2.out'
            });
        });

        // B. TEXT REVEAL
        gsap.utils.toArray('.line-reveal').forEach((line, i) => {
            gsap.to(line, {
                y: 0,
                duration: 1.2,
                delay: i * 0.1,
                ease: 'power4.out'
            });
        });
        
        gsap.to('.hero-label', { opacity: 1, duration: 1, delay: 0.5 });
        gsap.to('.hero-desc', { opacity: 1, duration: 1, delay: 0.8 });
        gsap.to('.hero-action', { opacity: 1, duration: 1, delay: 1 });

        // C. IMAGE REVEAL (Шторка)
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
        gsap.fromTo('.footer-inner', 
            { y: -50, opacity: 0 },
            { 
                y: 0, opacity: 1,
                scrollTrigger: {
                    trigger: '.footer',
                    start: "top 90%",
                    end: "bottom bottom",
                    scrub: 1
                }
            }
        );
        
        gsap.fromTo('.footer-giant-text',
            { yPercent: 50 },
            { 
                yPercent: 0,
                scrollTrigger: {
                    trigger: '.footer',
                    start: "top bottom",
                    end: "bottom bottom",
                    scrub: 1
                }
            }
        );
    }

    // =================================================================
    // 5. HORIZONTAL SCROLL
    // =================================================================
    const track = document.querySelector('.horizontal-track');
    const section = document.querySelector('.scenarios-section');

    ScrollTrigger.matchMedia({
        "(min-width: 1025px)": function() {
            const getScrollAmount = () => -(track.scrollWidth - window.innerWidth);
            
            const tween = gsap.to(track, {
                x: getScrollAmount,
                ease: "none"
            });

            ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: () => `+=${Math.abs(getScrollAmount())}`,
                pin: true,
                animation: tween,
                scrub: 1,
                invalidateOnRefresh: true
            });
        }
    });

    // =================================================================
    // 6. MENU & FORM
    // =================================================================
    
    // Burger Menu Logic
    const burgerTrigger = document.querySelector('.burger-trigger');
    const mobileMenu = document.querySelector('.mobile-menu');
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        burgerTrigger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        if (isMenuOpen) lenis.stop();
        else lenis.start();
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

    // Form Handling
    const form = document.querySelector('.booking-form');
    const submitBtn = document.querySelector('.btn-submit span');

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

    // Header Scroll Glass Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    });

});