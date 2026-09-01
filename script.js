// Unified 3D Parallax & Portfolio Renderer Engine — Shivam Jaiswal Portfolio
(function() {
  // DOM Elements
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressDetail = document.getElementById('progress-detail');

  const heroStage = document.getElementById('hero-parallax-stage');
  const layerBg = document.getElementById('hero-layer-bg');
  const layerFace = document.getElementById('hero-layer-face');
  const faceImg = document.getElementById('hero-face-img');
  const particlesCanvas = document.getElementById('hero-particles-canvas');

  // State Variables
  let isLoaded = false;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let scrollY = 0, targetScrollY = 0;

  // =========================================================================
  // PRELOADER & ASSET LOADER
  // =========================================================================
  function initPreloader() {
    let loadedAssets = 0;
    const totalAssets = 2; // bg + face

    function updateLoaderProgress(pct) {
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${pct}%`;
    }

    function checkComplete() {
      loadedAssets++;
      const pct = Math.min(100, Math.floor((loadedAssets / totalAssets) * 100));
      updateLoaderProgress(pct);

      if (loadedAssets >= totalAssets && !isLoaded) {
        dismissPreloader();
      }
    }

    const bgObj = new Image();
    bgObj.src = 'hero-bg.jpg';
    bgObj.onload = checkComplete;
    bgObj.onerror = checkComplete;

    const faceObj = new Image();
    faceObj.src = 'hero-face.png';
    faceObj.onload = checkComplete;
    faceObj.onerror = checkComplete;

    // Safety timeout to dismiss preloader after 1.2s max
    setTimeout(() => {
      dismissPreloader();
    }, 1200);
  }

  function dismissPreloader() {
    if (isLoaded) return;
    isLoaded = true;
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    if (progressDetail) progressDetail.textContent = 'Ready!';
    
    setTimeout(() => {
      if (preloader) preloader.classList.add('loaded');
    }, 300);
  }

  // =========================================================================
  // 3D PARALLAX & FIXED CHARACTER ENGINE
  // Layer 1 (Bg): Slow background shift
  // Layer 2 (Face): Position FIXED in CENTER, zero X/Y translate, 3D scroll depth breathing effect
  // Layer 3 (Particles): Scroll-velocity reactive depth particles
  // =========================================================================
  function init3DParallax() {
    // Mousemove listener (Desktop)
    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // Touchmove listener (Mobile)
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouseX = (touch.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      }
    }, { passive: true });

    // Device orientation (Mobile Gyroscope)
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        targetMouseX = Math.max(-1, Math.min(1, e.gamma / 25));
        targetMouseY = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
      }
    }, { passive: true });

    // Scroll listener
    window.addEventListener('scroll', () => {
      targetScrollY = window.scrollY || window.pageYOffset || 0;
    }, { passive: true });

    // Main 3D Parallax Animation Loop
    function renderParallax() {
      const lerp = 0.08;
      mouseX += (targetMouseX - mouseX) * lerp;
      mouseY += (targetMouseY - mouseY) * lerp;
      scrollY += (targetScrollY - scrollY) * lerp;

      // 1. Background layer: Moves SLOWEST (Fixed full page)
      const bgX = mouseX * -12;
      const bgY = mouseY * -8;

      if (layerBg) {
        layerBg.style.transform = `translate3d(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px, 0)`;
      }

      // 2. Face layer: STRICTLY FIXED IN CENTER (top: 50%, left: 50%, translate(-50%, -50%))
      // On scroll, applies a subtle 3D depth/glow breathing pulse effect without moving position
      const scrollPhase = scrollY * 0.005;
      const breathScale = 1 + Math.sin(scrollPhase) * 0.02 + Math.abs(mouseX) * 0.008;
      const glowSpread = 25 + Math.abs(Math.sin(scrollPhase)) * 15;
      const glowOpacity = 0.35 + Math.abs(Math.sin(scrollPhase)) * 0.15;

      if (faceImg) {
        faceImg.style.transform = `translate(-50%, -50%) scale(${breathScale.toFixed(4)}) translateZ(0)`;
        faceImg.style.filter = `contrast(1.08) brightness(1.03) drop-shadow(0 0 ${glowSpread.toFixed(1)}px rgba(255, 69, 0, ${glowOpacity.toFixed(2)}))`;
      }

      // 3. Particles canvas subtle background shift
      const particleX = mouseX * 25;
      const particleY = mouseY * 15;

      if (particlesCanvas) {
        particlesCanvas.style.transform = `translate3d(${particleX.toFixed(2)}px, ${particleY.toFixed(2)}px, 0)`;
      }

      requestAnimationFrame(renderParallax);
    }

    requestAnimationFrame(renderParallax);
  }

  // =========================================================================
  // SCROLL-VELOCITY RESPONSIVE PARTICLES SYSTEM (Flying Through Space Effect)
  // Upward when scrolling DOWN, Downward when scrolling UP, speed matched to scroll
  // =========================================================================
  function initFloatingParticles() {
    if (!particlesCanvas) return;

    const ctx = particlesCanvas.getContext('2d');
    let particles = [];
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 30 : 60;

    let prevScrollPos = window.scrollY || 0;
    let currentScrollVel = 0;

    let isMobileScrolling = false;
    let mobileScrollTimeout = null;

    window.addEventListener('scroll', () => {
      const curY = window.scrollY || window.pageYOffset || 0;
      const delta = curY - prevScrollPos;
      prevScrollPos = curY;
      // Accumulate velocity to make particles react dynamically to scroll speed
      currentScrollVel += delta * 0.45;

      const isMobileDevice = window.innerWidth < 768 || ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      if (isMobileDevice) {
        isMobileScrolling = true;
        clearTimeout(mobileScrollTimeout);
        mobileScrollTimeout = setTimeout(() => {
          isMobileScrolling = false;
        }, 120);
      }
    }, { passive: true });

    function resizeParticlesCanvas() {
      const dpr = window.devicePixelRatio || 1;
      particlesCanvas.width = particlesCanvas.offsetWidth * dpr;
      particlesCanvas.height = particlesCanvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    resizeParticlesCanvas();
    window.addEventListener('resize', resizeParticlesCanvas, { passive: true });

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false, direction = 'up') {
        const width = particlesCanvas.offsetWidth || window.innerWidth;
        const height = particlesCanvas.offsetHeight || window.innerHeight;

        this.x = Math.random() * width;
        if (initial) {
          this.y = Math.random() * height;
        } else if (direction === 'down') {
          // Reset at top if moving downward
          this.y = -15;
        } else {
          // Reset at bottom if moving upward
          this.y = height + 15;
        }

        this.radius = Math.random() * 2.8 + 1.0;
        this.baseSpeedY = Math.random() * 0.7 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.65 + 0.25;
        this.alphaSpeed = Math.random() * 0.015 + 0.005;
        this.alphaDirection = Math.random() > 0.5 ? 1 : -1;

        const colors = [
          'rgba(255, 69, 0, ',    // Vibrant orange
          'rgba(255, 140, 0, ',   // Dark orange/amber
          'rgba(255, 180, 50, ',  // Gold glow
          'rgba(255, 255, 255, '  // Sparkling white
        ];
        this.colorPrefix = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        const height = particlesCanvas.offsetHeight || window.innerHeight;
        const width = particlesCanvas.offsetWidth || window.innerWidth;

        // Move upward when scrolling down (currentScrollVel > 0)
        // Move downward when scrolling up (currentScrollVel < 0)
        const moveDistY = this.baseSpeedY + currentScrollVel;
        this.y -= moveDistY;
        this.x += this.speedX;

        this.alpha += this.alphaSpeed * this.alphaDirection;
        if (this.alpha >= 0.85) this.alphaDirection = -1;
        if (this.alpha <= 0.15) this.alphaDirection = 1;

        // Reset boundaries
        if (this.y < -20) {
          this.reset(false, 'up');
        } else if (this.y > height + 20) {
          this.reset(false, 'down');
        }

        if (this.x < -20 || this.x > width + 20) {
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.colorPrefix}${this.alpha.toFixed(2)})`;
        ctx.shadowBlur = this.radius * 3.5;
        ctx.shadowColor = 'rgba(255, 69, 0, 0.7)';
        ctx.fill();
      }
    }

    particles = Array.from({ length: particleCount }, () => new Particle());

    function animateParticles() {
      const isMobileDevice = window.innerWidth < 768 || ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      if (isMobileDevice && isMobileScrolling) {
        requestAnimationFrame(animateParticles);
        return;
      }

      const width = particlesCanvas.offsetWidth || window.innerWidth;
      const height = particlesCanvas.offsetHeight || window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Smoothly decay scroll velocity back to zero when scrolling stops
      currentScrollVel *= 0.90;

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animateParticles);
    }

    requestAnimationFrame(animateParticles);
  }

  // =========================================================================
  // CONTACT FORM WHATSAPP INTEGRATION
  // =========================================================================
  function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const serviceSelect = document.getElementById('contact-service');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value.trim() : '';
      const service = serviceSelect ? serviceSelect.value : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !service || !message) {
        alert('Please fill out all fields and select a service.');
        return;
      }

      const formattedText = `Hi Shivam, my name is ${name}. I need help with: ${service}. Message: ${message}`;
      const whatsappUrl = `https://wa.me/916267031972?text=${encodeURIComponent(formattedText)}`;

      window.open(whatsappUrl, '_blank');
    });
  }

  // =========================================================================
  // CENTRALIZED PROJECTS DATA (DYNAMIC FETCH FROM data/projects.json)
  // =========================================================================
  const defaultProjectsData = [
    {
      "id": 1,
      "title": "Complete App Masterclass & Motion Design",
      "category": "TUTORIAL & MOTION",
      "categorySlug": "motion editing ai-video",
      "description": "Comprehensive app tutorial featuring high-impact screen recording, custom After Effects motion graphics, original voiceover, and engaging CTA pacing.",
      "youtubeId": "HRAMQcXxt9I",
      "thumbnail": "https://img.youtube.com/vi/HRAMQcXxt9I/maxresdefault.jpg",
      "tags": ["After Effects", "Motion Graphics", "Voiceover", "AI Video"]
    },
    {
      "id": 2,
      "title": "High-Converting AI Commercial Showreel",
      "category": "AI COMMERCIAL",
      "categorySlug": "ai-video editing",
      "description": "100% AI-generated commercial video crafted for client gigs. Scriptwriting, ElevenLabs cinematic voiceover, custom prompt engineering, and Premiere Pro mastering.",
      "youtubeId": "ckwfOdij-uQ",
      "thumbnail": "https://img.youtube.com/vi/ckwfOdij-uQ/maxresdefault.jpg",
      "tags": ["AI Video", "Premiere Pro", "ElevenLabs", "Commercial"]
    },
    {
      "id": 3,
      "title": "WhatsApp AI Cinematic Short Film",
      "category": "AI SHORT FILM",
      "categorySlug": "ai-video scripting editing",
      "description": "Story-driven AI short film utilizing full AI workflow generation, custom cinematic narrative, character consistency, and sound design in Premiere Pro.",
      "youtubeId": "VJKznoS4TIo",
      "thumbnail": "https://img.youtube.com/vi/VJKznoS4TIo/maxresdefault.jpg",
      "tags": ["AI Film", "Storytelling", "Premiere Pro", "Cinematic"]
    },
    {
      "id": 4,
      "title": "KJSST Mobile Finance — AI Short Film",
      "category": "AI SHORT FILM",
      "categorySlug": "ai-video scripting editing",
      "description": "Full AI-generated narrative commercial. Concept, scriptwriting, AI character synthesis, Premiere Pro editing, and After Effects sound design.",
      "youtubeId": "RmndE-qelJ8",
      "thumbnail": "public/images/kjsst-mobile-finance.jpg",
      "tags": ["AI Short Film", "Premiere Pro", "After Effects", "Direction"]
    },
    {
      "id": 5,
      "title": "Breaking Bad Inspired Fashion Montage",
      "category": "MOTION GRAPHICS",
      "categorySlug": "motion editing",
      "description": "13-second high-energy kinetic intro & fashion montage for New Kumar Collection. Custom typography, 3D motion graphics, and chemical VFX in After Effects.",
      "youtubeId": "XOiF_tvb0xo",
      "thumbnail": "public/images/breaking-bad-montage.jpg",
      "tags": ["After Effects", "Motion Graphics", "Typography", "VFX"]
    },
    {
      "id": 6,
      "title": "Offline vs Online Shopping — KMR Commercial",
      "category": "AI COMMERCIAL",
      "categorySlug": "ai-video editing",
      "description": "High-impact commercial video for KMR Wholesale Electronics. AI image synthesis, product compositing, dynamic typography, and pacing.",
      "youtubeId": "bACz4j1bdJg",
      "thumbnail": "public/images/kmr-wholesale.jpg",
      "tags": ["AI Commercial", "Premiere Pro", "Compositing", "E-commerce"]
    }
  ];

  window.projectsData = defaultProjectsData;

  function createProjectCardHTML(item, isCarousel = false) {
    const rawThumb = item.thumbnail || '';
    let thumbSrc = rawThumb;
    if (rawThumb.startsWith('/images/')) {
      thumbSrc = 'public' + rawThumb;
    } else if (rawThumb.startsWith('images/')) {
      thumbSrc = 'public/' + rawThumb;
    }
    const catSlug = item.categorySlug || 'ai-video editing';
    const tagSpans = (item.tags || []).map(t => `<span>${t}</span>`).join('');

    return `
      <div class="project-card ${isCarousel ? 'carousel-card' : 'modal-project-card'}" data-id="${item.id}" data-category="${catSlug}" data-youtube-id="${item.youtubeId}">
        <div class="project-thumb">
          <img src="${thumbSrc}" onerror="this.src='https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg'" alt="${item.title}">
          <div class="play-overlay">
            <span class="play-btn">▶</span>
          </div>
        </div>
        <div class="project-body">
          <span class="project-tag">${item.category}</span>
          <h3 class="project-title">${item.title}</h3>
          <p class="project-desc">${item.description}</p>
          <div class="project-tech-tags">
            ${tagSpans}
          </div>
        </div>
      </div>
    `;
  }

  function loadAndRenderProjectsData() {
    fetch('data/projects.json')
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          window.projectsData = data;
          renderAllProjects(data);
        } else {
          renderAllProjects(defaultProjectsData);
        }
      })
      .catch(() => {
        fetch('projects.json')
          .then(res => res.json())
          .then(data => renderAllProjects(data))
          .catch(() => renderAllProjects(defaultProjectsData));
      });
  }

  function renderAllProjects(dataList) {
    const carouselEl = document.getElementById('projects-carousel');
    const modalGridEl = document.getElementById('modal-projects-grid');

    if (carouselEl) {
      carouselEl.removeAttribute('data-cloned');
      carouselEl.innerHTML = dataList.map(item => createProjectCardHTML(item, true)).join('');
      initProjectsCarousel();
    }

    if (modalGridEl) {
      modalGridEl.innerHTML = dataList.map(item => createProjectCardHTML(item, false)).join('');
      initProjectsModal();
    }
  }

  // =========================================================================
  // IN-WEBSITE CINEMA VIDEO PLAYER LIGHTBOX ENGINE (NO REDIRECTS)
  // ====================================================================  // =========================================================================
  // IN-WEBSITE CINEMA VIDEO PLAYER LIGHTBOX ENGINE (NO REDIRECTS)
  // =========================================================================
  function initCinemaModal() {
    const cinemaModal = document.getElementById('cinema-video-modal');
    const cinemaIframe = document.getElementById('cinema-iframe');
    const closeBtn = document.getElementById('close-cinema-modal-btn');

    if (!cinemaModal || !cinemaIframe) return;

    // Bulletproof runtime check: move cinemaModal to body root to avoid parent overflow/transform clipping
    if (cinemaModal.parentElement !== document.body) {
      document.body.appendChild(cinemaModal);
    }

    window.openCinemaPlayer = function(youtubeId) {
      if (!youtubeId) return;
      if (cinemaModal.parentElement !== document.body) {
        document.body.appendChild(cinemaModal);
      }
      const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      cinemaIframe.src = embedUrl;
      cinemaModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Unlock pricing upon watching video
      if (typeof window.markVideoAsWatched === 'function') {
        window.markVideoAsWatched();
      }
    };

    window.closeCinemaPlayer = function() {
      cinemaModal.classList.remove('active');
      cinemaIframe.src = '';
      const activeModals = document.querySelectorAll('.modal-overlay.active:not(#cinema-video-modal)');
      if (activeModals.length === 0) {
        document.body.style.overflow = '';
      }
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeCinemaPlayer();
      });
    }

    cinemaModal.addEventListener('click', (e) => {
      if (e.target === cinemaModal) {
        window.closeCinemaPlayer();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cinemaModal.classList.contains('active')) {
        window.closeCinemaPlayer();
      }
    });
  }

  // =========================================================================
  // HORIZONTAL SLIDER PROJECTS CAROUSEL (SEAMLESS INFINITE LOOP)
  // =========================================================================
  function initProjectsCarousel() {
    const carousel = document.getElementById('projects-carousel');
    if (!carousel) return;

    let originalCards = Array.from(carousel.getElementsByClassName('carousel-card'));
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (originalCards.length === 0) return;

    const N = originalCards.length;

    // Create cloned sets before and after original cards for seamless infinite loop
    if (!carousel.dataset.cloned) {
      originalCards.forEach(card => {
        const cloneBefore = card.cloneNode(true);
        cloneBefore.classList.add('is-clone');
        carousel.insertBefore(cloneBefore, originalCards[0]);
      });

      originalCards.forEach(card => {
        const cloneAfter = card.cloneNode(true);
        cloneAfter.classList.add('is-clone');
        carousel.appendChild(cloneAfter);
      });

      carousel.dataset.cloned = "true";
    }

    const allCards = Array.from(carousel.getElementsByClassName('carousel-card'));
    let virtualIndex = 0; // 0 to N-1 maps to the middle set (N to 2N-1)
    let isTransitioning = false;
    let autoSlideTimer = null;

    // Create pagination dots for original N items
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      originalCards.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          if (isTransitioning) return;
          virtualIndex = idx;
          updateCarousel(true);
          resetAutoSlide();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateCarousel(withTransition = true) {
      const firstCard = allCards[0];
      const cardWidth = firstCard ? (firstCard.offsetWidth || 340) : 340;
      const gap = 24;
      const step = cardWidth + gap;

      const trackIndex = N + virtualIndex;

      if (withTransition) {
        carousel.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
        isTransitioning = true;
      } else {
        carousel.style.transition = 'none';
        isTransitioning = false;
      }

      // Center active card horizontally
      carousel.style.transform = `translateX(calc(50% - ${cardWidth / 2}px - ${trackIndex * step}px))`;

      const realIndex = ((virtualIndex % N) + N) % N;

      allCards.forEach((card, idx) => {
        card.classList.remove('pos-active', 'pos-inactive');
        if (idx === trackIndex) {
          card.classList.add('pos-active');
        } else {
          card.classList.add('pos-inactive');
        }
      });

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.getElementsByClassName('dot');
        Array.from(dots).forEach((dot, idx) => {
          if (idx === realIndex) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }
    }

    // Seamless instant wrap when reaching clone boundaries
    carousel.addEventListener('transitionend', () => {
      isTransitioning = false;
      if (virtualIndex >= N) {
        virtualIndex = virtualIndex % N;
        updateCarousel(false);
      } else if (virtualIndex < 0) {
        virtualIndex = ((virtualIndex % N) + N) % N;
        updateCarousel(false);
      }
    });

    function nextSlide() {
      if (isTransitioning) return;
      virtualIndex++;
      updateCarousel(true);
    }

    function prevSlide() {
      if (isTransitioning) return;
      virtualIndex--;
      updateCarousel(true);
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(nextSlide, 3500);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
    }

    function resetAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
      });
    }

    // Touch Swipe Gesture Engine (Smooth Mobile Touch Carousel)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    carousel.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Trigger swipe if horizontal movement > vertical movement and threshold > 35px
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
          if (deltaX < 0) {
            nextSlide();
            resetAutoSlide();
          } else {
            prevSlide();
            resetAutoSlide();
          }
        }
      }
    }, { passive: true });

    allCards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        const targetVirt = idx - N;
        if (targetVirt !== virtualIndex && !isTransitioning) {
          virtualIndex = targetVirt;
          updateCarousel(true);
          resetAutoSlide();
        }
        const targetCard = e.target.closest('[data-youtube-id]');
        const youtubeId = targetCard ? targetCard.getAttribute('data-youtube-id') : card.getAttribute('data-youtube-id');
        if (youtubeId && window.openCinemaPlayer) {
          window.openCinemaPlayer(youtubeId);
        }
      });
    });

    if (carousel.parentElement) {
      carousel.parentElement.addEventListener('mouseenter', stopAutoSlide);
      carousel.parentElement.addEventListener('mouseleave', startAutoSlide);
    }

    window.addEventListener('resize', () => updateCarousel(false), { passive: true });

    updateCarousel(false);
    startAutoSlide();
  }

  // =========================================================================
  // VIEW ALL PROJECTS MODAL GALLERY ENGINE
  // =========================================================================
  function initProjectsModal() {
    const modal = document.getElementById('all-projects-modal');
    const openBtn = document.getElementById('open-projects-modal-btn');
    const closeBtn = document.getElementById('close-projects-modal-btn');
    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close when clicking outside container
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // ESC key close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Category Filters
    const filterTabs = modal.querySelectorAll('.filter-tab');
    const modalCards = modal.querySelectorAll('.modal-project-card');

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter') || '';
        modalCards.forEach(card => {
          const category = card.getAttribute('data-category') || '';
          if (filter === 'all' || category.includes(filter)) {
            card.classList.remove('hide');
          } else {
            card.classList.add('hide');
          }
        });
      });
    });

    // Open Cinema Video Player on Modal Card click
    modalCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const targetCard = e.target.closest('[data-youtube-id]');
        const youtubeId = targetCard ? targetCard.getAttribute('data-youtube-id') : card.getAttribute('data-youtube-id');
        if (youtubeId && window.openCinemaPlayer) {
          window.openCinemaPlayer(youtubeId);
        }
      });
    });
  }

  // =========================================================================
  // FAQ ACCORDION MODAL ENGINE
  // =========================================================================
  function initFaqModal() {
    const modal = document.getElementById('faq-modal');
    const openBtn = document.getElementById('open-faq-btn');
    const closeBtn = document.getElementById('close-faq-btn');
    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    // Accordion expand/collapse
    const faqItems = modal.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          faqItems.forEach(other => other.classList.remove('open'));
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      }
    });
  }

  // =========================================================================
  // HERO VIEW MY WORK BUTTON REDIRECT
  // =========================================================================
  function initHeroViewWorkBtn() {
    const viewWorkBtn = document.getElementById('hero-view-work-btn');
    const projectsModal = document.getElementById('all-projects-modal');
    if (viewWorkBtn && projectsModal) {
      viewWorkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        projectsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  // =========================================================================
  // EXPERIENCE TIMELINE POPUP ENGINE
  // =========================================================================
  function initExperienceModal() {
    const modal = document.getElementById('experience-modal');
    const openBtn = document.getElementById('open-experience-modal-btn');
    const closeBtn = document.getElementById('close-experience-modal-btn');
    const scrollArea = document.getElementById('timeline-scroll-area');
    const trackFill = document.getElementById('timeline-track-fill');
    const items = modal ? modal.querySelectorAll('.timeline-item') : [];

    if (!modal) return;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(updateTimelineProgress, 200);
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    function updateTimelineProgress() {
      if (!scrollArea || !trackFill) return;
      const scrollTop = scrollArea.scrollTop;
      const maxScroll = Math.max(1, scrollArea.scrollHeight - scrollArea.clientHeight);
      let progress = Math.min(100, Math.max(15, (scrollTop / maxScroll) * 100));

      trackFill.style.height = `${progress}%`;

      items.forEach((item, idx) => {
        const itemTop = item.offsetTop - scrollArea.offsetTop;
        if (scrollTop + scrollArea.clientHeight * 0.75 >= itemTop || idx === 0) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    if (scrollArea) {
      scrollArea.addEventListener('scroll', updateTimelineProgress, { passive: true });
    }
  }

  // =========================================================================
  // GAMIFIED WATCH-TO-UNLOCK PRICING SYSTEM & MODAL ENGINE
  // =========================================================================
  function initPricingSystem() {
    const pricingWidget = document.getElementById('hero-pricing-widget');
    const pricingModal = document.getElementById('pricing-modal');
    const closePricingModalBtn = document.getElementById('close-pricing-modal-btn');
    const lockedToast = document.getElementById('pricing-locked-toast');
    const closeToastBtn = document.getElementById('close-pricing-toast-btn');

    const widgetIcon = document.getElementById('pricing-widget-icon');
    const widgetBadge = document.getElementById('pricing-widget-status-badge');
    const widgetTitle = document.getElementById('pricing-widget-title');
    const widgetSubtext = document.getElementById('pricing-widget-subtext');
    const widgetCounter = document.getElementById('pricing-widget-counter');

    function isUnlocked() {
      return localStorage.getItem('hasWatchedVideo') === 'true';
    }

    function updatePricingWidgetUI() {
      const unlocked = isUnlocked();
      if (!pricingWidget) return;

      if (unlocked) {
        pricingWidget.classList.remove('locked');
        pricingWidget.classList.add('unlocked');
        if (widgetIcon) widgetIcon.textContent = '🔓';
        if (widgetBadge) {
          widgetBadge.textContent = 'Unlocked';
          widgetBadge.className = 'pricing-widget-status-badge unlocked';
        }
        if (widgetTitle) widgetTitle.textContent = '🔓 Pricing & Packages (Unlocked)';
        if (widgetSubtext) widgetSubtext.textContent = 'Click to view service rates';
        if (widgetCounter) widgetCounter.textContent = '1/1 Unlocked';
      } else {
        pricingWidget.classList.remove('unlocked');
        pricingWidget.classList.add('locked');
        if (widgetIcon) widgetIcon.textContent = '🔒';
        if (widgetBadge) {
          widgetBadge.textContent = 'Locked';
          widgetBadge.className = 'pricing-widget-status-badge locked';
        }
        if (widgetTitle) widgetTitle.textContent = '🔒 Check Pricing & Rates (Locked)';
        if (widgetSubtext) widgetSubtext.textContent = 'Watch 1 video to unlock rates';
        if (widgetCounter) widgetCounter.textContent = '0/1 Videos Watched';
      }
    }

    window.markVideoAsWatched = function() {
      localStorage.setItem('hasWatchedVideo', 'true');
      updatePricingWidgetUI();
    };

    function showLockedToast() {
      if (!lockedToast) return;
      lockedToast.classList.add('active');

      // Auto-scroll smoothly down to #projects (Selected Work section)
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Auto-hide toast after 4.5 seconds
      setTimeout(() => {
        lockedToast.classList.remove('active');
      }, 4500);
    }

    function openPricingModal() {
      if (!pricingModal) return;
      pricingModal.classList.add('active');
      pricingModal.style.display = 'flex';
      pricingModal.style.opacity = '1';
      pricingModal.style.visibility = 'visible';
      pricingModal.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
    }

    function closePricingModal() {
      if (!pricingModal) return;
      pricingModal.classList.remove('active');
      pricingModal.style.display = '';
      pricingModal.style.opacity = '';
      pricingModal.style.visibility = '';
      pricingModal.style.pointerEvents = '';
      document.body.style.overflow = '';
    }

    // Expose openPricingModal globally
    window.openPricingModal = openPricingModal;

    // Hero Pricing widget click handler
    if (pricingWidget) {
      pricingWidget.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (isUnlocked()) {
          openPricingModal();
        } else {
          showLockedToast();
        }
      };

      pricingWidget.onkeydown = function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isUnlocked()) {
            openPricingModal();
          } else {
            showLockedToast();
          }
        }
      };
    }

    if (closePricingModalBtn) {
      closePricingModalBtn.addEventListener('click', closePricingModal);
    }

    if (pricingModal) {
      pricingModal.addEventListener('click', (e) => {
        if (e.target === pricingModal) closePricingModal();
      });
    }

    if (closeToastBtn && lockedToast) {
      closeToastBtn.addEventListener('click', () => {
        lockedToast.classList.remove('active');
      });
    }

    // ESC Key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (pricingModal && pricingModal.classList.contains('active')) {
          closePricingModal();
        }
        if (lockedToast && lockedToast.classList.contains('active')) {
          lockedToast.classList.remove('active');
        }
      }
    });

    // Handle CTA buttons inside Pricing Modal
    const ctaBtns = pricingModal ? pricingModal.querySelectorAll('.pricing-cta-btn') : [];
    ctaBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const requestedService = btn.getAttribute('data-service');
        closePricingModal();

        // Scroll to contact section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Pre-select service in form dropdown
        if (requestedService) {
          const serviceSelect = document.getElementById('contact-service');
          if (serviceSelect) {
            serviceSelect.value = requestedService;
          }
        }
      });
    });

    // Initial state check
    updatePricingWidgetUI();
  }

  // =========================================================================
  // LENIS SMOOTH SCROLL ENGINE (DESKTOP ONLY — DISABLED ON MOBILE TOUCH)
  // =========================================================================
  let lenisInstance = null;

  function initLenisScroll() {
    const isDesktop = window.innerWidth >= 768 && !('ontouchstart' in window || navigator.maxTouchPoints > 0);

    if (isDesktop && typeof Lenis !== 'undefined') {
      if (!lenisInstance) {
        lenisInstance = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          smoothTouch: false
        });

        function raf(time) {
          if (lenisInstance) {
            lenisInstance.raf(time);
            requestAnimationFrame(raf);
          }
        }
        requestAnimationFrame(raf);
      }
    } else {
      if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
      }
    }
  }

  window.addEventListener('resize', initLenisScroll, { passive: true });

  // Start initialization
  initPreloader();
  initLenisScroll();
  init3DParallax();
  initFloatingParticles();

  function setupFeatures() {
    initCinemaModal();
    initContactForm();
    loadAndRenderProjectsData();
    initFaqModal();
    initHeroViewWorkBtn();
    initExperienceModal();
    initPricingSystem();
  }
  document.addEventListener('DOMContentLoaded', setupFeatures);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setupFeatures();
  }
})();
