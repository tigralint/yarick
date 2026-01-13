document.addEventListener('DOMContentLoaded', () => {
    
    // REGISTER GSAP PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // =================================================================
    // 1. SMOOTH SCROLL (LENIS) - OPTIMIZED SETUP
    // =================================================================
    const lenis = new Lenis({
        duration: 1.2, // Оптимизировано: чуть быстрее для отзывчивости (было 1.5)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
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

    // [ВАЖНО] ИСПРАВЛЕНИЕ ДЁРГАНОСТИ
    // Было: gsap.ticker.lagSmoothing(0); -> Это вызывало рывки при нагрузке.
    // Стало: Стандартная настройка. GSAP скорректирует анимацию, если FPS просядет.
    gsap.ticker.lagSmoothing(1000, 16);

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
    // 2. CUSTOM CURSOR (MAGNETIC & HOVER)
    // =================================================================
    const cursorOuter = document.querySelector('.cursor-outer');
    const cursorInner = document.querySelector('.cursor-inner');
    
    // Используем quickSetter для высокой производительности
    const setOuterX = gsap.quickSetter(cursorOuter, "x", "px");
    const setOuterY = gsap.quickSetter(cursorOuter, "y", "px");
    const setInnerX = gsap.quickSetter(cursorInner, "x", "px");
    const setInnerY = gsap.quickSetter(cursorInner, "y", "px");

    let mouse = { x: 0, y: 0 };
    let outerPos = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Внутренняя точка движется мгновенно
        setInnerX(mouse.x);
        setInnerY(mouse.y);
    });

    // Внешний круг движется с плавным отставанием (Lerp)
    gsap.ticker.add((dt) => {
        const speed = 1.0 - Math.pow(0.75, dt); // Адаптивная скорость
        
        outerPos.x += (mouse.x - outerPos.x) * 0.25; 
        outerPos.y += (mouse.y - outerPos.y) * 0.25;
        
        setOuterX(outerPos.x);
        setOuterY(outerPos.y);
    });

    // Функция добавления магнитного эффекта
    const addMagneticEffect = (el) => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - rect.left - rect.width / 2;
            const relY = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: relX * 0.4, y: relY * 0.4, duration: 0.3 });
        });
        
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
        });
    };

    // Находим все элементы с курсором + добавляем магнетизм ссылкам меню
    const interactiveElements = document.querySelectorAll('[data-cursor], .nav-link, .nav-arrow');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            // Определяем тип эффекта
            const isMagnetic = el.getAttribute('data-cursor') === '-magnetic' || 
                               el.classList.contains('nav-link') || 
                               el.classList.contains('nav-arrow');
            
            document.body.classList.add('hover-active');
            if (isMagnetic) {
                document.body.classList.add('hover-magnetic');
                addMagneticEffect(el);
            }
        });

        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-active');
            document.body.classList.remove('hover-magnetic');
        });
    });

    // =================================================================
    // 3. LOADER SEQUENCE (SMART SESSION)
    // =================================================================
    const loader = document.querySelector('.loader');
    const progress = document.querySelector('.loader-progress');
    const curtain = document.querySelector('.loader-curtain');
    
    // Проверяем, был ли пользователь уже здесь в этой сессии
    const sessionVisited = sessionStorage.getItem('visited');

    if (sessionVisited) {
        // Если уже был — скрываем лоадер мгновенно
        loader.style.display = 'none';
        initAnimations();
        ScrollTrigger.refresh();
    } else {
        // Если первый раз — показываем анимацию
        document.body.style.overflow = 'hidden';
        lenis.stop();

        const tlLoader = gsap.timeline({
            onComplete: () => {
                loader.style.display = 'none';
                document.body.style.overflow = '';
                lenis.start();
                initAnimations(); 
                ScrollTrigger.refresh();
                sessionStorage.setItem('visited', 'true'); // Запоминаем визит
            }
        });

        tlLoader
            .to(progress, { width: '100%', duration: 1.0, ease: 'power2.inOut' })
            .to('.loader-text', { y: -50, opacity: 0, duration: 0.5, ease: 'power2.in' })
            .to(curtain, { yPercent: -100, duration: 1, ease: 'power4.inOut' });
    }

    // =================================================================
    // 4. MAIN ANIMATIONS
    // =================================================================
    function initAnimations() {
        
        // A. HERO PARALLAX (Мышка)
        const heroSection = document.querySelector('.hero');
        const heroBg = document.querySelector('.hero-bg img');
        // Добавлена проверка на видео, так как у вас может быть video вместо img
        const heroMedia = document.querySelector('.hero-bg img') || document.querySelector('.hero-bg video');
        
        if (heroSection && heroMedia) {
            heroSection.addEventListener('mousemove', (e) => {
                const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
                const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
                gsap.to(heroMedia, { x: xPos, y: yPos, duration: 1, ease: 'power2.out' });
            });
        }

        // B. TEXT REVEAL
        gsap.utils.toArray('.line-reveal').forEach((line, i) => {
            gsap.to(line, { 
                y: 0, 
                duration: 1.2, 
                delay: i * 0.1, 
                ease: 'power4.out',
                scrollTrigger: { trigger: '.hero', start: "top 60%" }
            });
        });
        
        const heroElements = ['.hero-label', '.hero-desc', '.hero-action'];
        gsap.to(heroElements, { 
            opacity: 1, 
            duration: 1, 
            stagger: 0.2, 
            delay: 0.5,
            scrollTrigger: { trigger: '.hero', start: "top 60%" }
        });

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
    // 6. MENU & FORM HANDLING
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

    // Form Handling (AJAX + Animation)
    const form = document.querySelector('.booking-form');
    const submitBtn = document.querySelector('.btn-submit span');
    const submitBtnContainer = document.querySelector('.btn-submit');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // Сохраняем исходный текст
            const originalText = submitBtn.innerText;
            
            // UI: Состояние отправки
            submitBtn.innerText = 'Отправка...';
            submitBtnContainer.style.opacity = '0.7';

            // Собираем данные
            const formData = new FormData(form);
            const action = form.getAttribute('action');

            try {
                // Если action задан и не является заглушкой
                if (action && !action.includes('YOUR_ID_HERE')) {
                    const response = await fetch(action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) throw new Error('Network error');
                } else {
                    // Имитация
                    await new Promise(r => setTimeout(r, 1500));
                }

                // UI: Успех
                submitBtn.innerText = 'Заявка принята';
                submitBtnContainer.style.opacity = '1';
                submitBtnContainer.style.borderColor = '#D4AF37';
                submitBtnContainer.style.background = 'rgba(212, 175, 55, 0.1)';
                form.reset();

                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtnContainer.style.borderColor = '';
                    submitBtnContainer.style.background = '';
                }, 3000);

            } catch (error) {
                // UI: Ошибка
                submitBtn.innerText = 'Ошибка. Попробуйте снова';
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtnContainer.style.opacity = '1';
                }, 3000);
            }
        });
    }

    // Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    });

});