document.addEventListener('DOMContentLoaded', () => {
    
    // REGISTER GSAP PLUGINS
    gsap.registerPlugin(ScrollTrigger);

    // =================================================================
    // 1. SMOOTH SCROLL (LENIS)
    // =================================================================
    const lenis = new Lenis({
        duration: 1.2,
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

    // Интеграция Lenis с GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // =================================================================
    // 2. CUSTOM CURSOR
    // =================================================================
    const cursorOuter = document.querySelector('.cursor-outer');
    const cursorInner = document.querySelector('.cursor-inner');
    let mouseX = 0;
    let mouseY = 0;

    // Базовое движение
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Внутренняя точка - мгновенно
        gsap.to(cursorInner, {
            x: mouseX,
            y: mouseY,
            duration: 0.05
        });

        // Внешний круг - с задержкой (эффект шлейфа)
        gsap.to(cursorOuter, {
            x: mouseX,
            y: mouseY,
            duration: 0.15,
            ease: 'power2.out'
        });
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
            
            // Сброс позиции при уходе с магнитного элемента
            gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
        });

        // Магнитный эффект (кнопка тянется за мышкой)
        if (el.getAttribute('data-cursor') === '-magnetic') {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;

                gsap.to(el, {
                    x: relX * 0.3, // Сила притяжения
                    y: relY * 0.3,
                    duration: 0.4,
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
    
    // Блокируем скролл во время загрузки
    document.body.style.overflow = 'hidden';
    lenis.stop();

    const tlLoader = gsap.timeline({
        onComplete: () => {
            loader.style.display = 'none';
            document.body.style.overflow = '';
            lenis.start();
            initHeroAnimations(); // Запуск анимаций на странице после загрузки
        }
    });

    tlLoader
        .to(progress, {
            width: '100%',
            duration: 1.5,
            ease: 'power2.inOut'
        })
        .to('.loader-text', {
            y: -50,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
        })
        .to(curtain, {
            yPercent: -100,
            duration: 1,
            ease: 'power4.inOut'
        });

    // =================================================================
    // 4. ANIMATIONS SETUP
    // =================================================================
    
    function initHeroAnimations() {
        // Hero Text Reveal
        gsap.utils.toArray('.line-reveal').forEach((line, i) => {
            gsap.to(line, {
                y: 0,
                duration: 1.2,
                delay: i * 0.15,
                ease: 'power4.out'
            });
        });

        gsap.to('.hero-label', { opacity: 1, duration: 1, delay: 0.5 });
        gsap.to('.hero-desc', { opacity: 1, duration: 1, delay: 0.8 });
        gsap.to('.hero-action', { opacity: 1, duration: 1, delay: 1 });
    }

    // Parallax Images
    gsap.utils.toArray('.reveal-image img').forEach(img => {
        gsap.to(img, {
            scale: 1, // Возврат к нормальному масштабу
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5
            }
        });
    });

    // Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    });

    // =================================================================
    // 5. HORIZONTAL SCROLL (GSAP PIN)
    // =================================================================
    const track = document.querySelector('.horizontal-track');
    const section = document.querySelector('.scenarios-section');

    // Используем matchMedia, чтобы горизонтальный скролл работал только на десктопе
    ScrollTrigger.matchMedia({
        "(min-width: 1025px)": function() {
            
            // Вычисляем, на сколько нужно сдвинуть трек влево
            const getScrollAmount = () => {
                let trackWidth = track.scrollWidth;
                return -(trackWidth - window.innerWidth);
            };

            const tween = gsap.to(track, {
                x: getScrollAmount,
                ease: "none"
            });

            ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: () => `+=${getScrollAmount() * -1}`, // Длина скролла равна длине контента
                pin: true,
                animation: tween,
                scrub: 1,
                invalidateOnRefresh: true // Пересчет при ресайзе
            });
        }
    });

    // =================================================================
    // 6. MOBILE MENU
    // =================================================================
    const burgerTrigger = document.querySelector('.burger-trigger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.m-link');

    let isMenuOpen = false;

    burgerTrigger.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        
        burgerTrigger.classList.toggle('active');
        mobileMenu.classList.toggle('active');

        if (isMenuOpen) {
            lenis.stop();
        } else {
            lenis.start();
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            burgerTrigger.classList.remove('active');
            mobileMenu.classList.remove('active');
            lenis.start();
        });
    });

    // =================================================================
    // 7. FORM HANDLING (Visual)
    // =================================================================
    const form = document.querySelector('.booking-form');
    const submitBtn = document.querySelector('.btn-submit span');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const originalText = submitBtn.innerText;
        
        submitBtn.innerText = 'Отправка...';
        
        // Имитация задержки сервера
        setTimeout(() => {
            submitBtn.innerText = 'Заявка принята';
            submitBtn.parentElement.style.borderColor = '#28a745';
            submitBtn.style.color = '#28a745';
            form.reset();

            setTimeout(() => {
                submitBtn.innerText = originalText;
                submitBtn.parentElement.style.borderColor = '';
                submitBtn.style.color = '';
            }, 3000);
        }, 1500);
    });

});