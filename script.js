// ============================================
// Mobile Navigation Toggle
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      this.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    // Close menu when clicking on a link
    const links = navLinks.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", function () {
        mobileToggle.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
        mobileToggle.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
  }
});

// ============================================
// Scroll Reveal Animations
// ============================================

function observeElements() {
  const observerOptions = {
    threshold: 0.12,
    rootMargin: "0px 0px -80px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(
    ".work-card, .service-card, .timeline-item, .skill-category, " +
      ".philosophy-item, .process-step, .pricing-card, .faq-item, .project-card, " +
      ".contact-info-card, .essay-card, .capability-item, .project-image-large, " +
      ".project-image-item, .week-grid-item, .inline-image, .nav-link-btn",
  );

  animatedElements.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(index % 6) * 0.08}s`;
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", observeElements);

// ============================================
// Projects Filter (Projects Page)
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  if (filterButtons.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", function () {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        const filterValue = this.getAttribute("data-filter");

        projectCards.forEach((card) => {
          const category = card.getAttribute("data-category");

          if (filterValue === "all" || category === filterValue) {
            card.style.display = "block";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, 10);
          } else {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
            setTimeout(() => {
              card.style.display = "none";
            }, 300);
          }
        });
      });
    });
  }
});

// ============================================
// Contact Form Handling
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value,
      };

      showFormMessage(
        "success",
        "Thank you for your message! I'll get back to you soon.",
      );

      contactForm.reset();
      console.log("Form submitted:", formData);
    });
  }
});

function showFormMessage(type, message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `form-message form-message-${type}`;
  messageDiv.textContent = message;

  messageDiv.style.padding = "1.5rem";
  messageDiv.style.marginTop = "2rem";
  messageDiv.style.border = "2px solid";
  messageDiv.style.fontWeight = "700";
  messageDiv.style.textAlign = "center";
  messageDiv.style.animation = "fadeIn 0.5s ease";

  if (type === "success") {
    messageDiv.style.background = "rgba(47, 110, 59, 0.1)";
    messageDiv.style.color = "#2f6e3b";
    messageDiv.style.borderColor = "#2f6e3b";
  } else {
    messageDiv.style.background = "rgba(255, 90, 31, 0.1)";
    messageDiv.style.color = "#ff5a1f";
    messageDiv.style.borderColor = "#ff5a1f";
  }

  const form = document.getElementById("contactForm");
  form.parentNode.insertBefore(messageDiv, form.nextSibling);

  setTimeout(() => {
    messageDiv.style.opacity = "0";
    setTimeout(() => {
      messageDiv.remove();
    }, 500);
  }, 5000);
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (href !== "#" && href !== "") {
        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
          const offsetTop = target.offsetTop - 100;

          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }
    });
  });
});

// ============================================
// Active Navigation Highlight on Scroll
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("section[id], main[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener("scroll", function () {
      let current = "";

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;

        if (window.pageYOffset >= sectionTop - 200) {
          current = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
          link.classList.add("active");
        }
      });
    });
  }
});

// ============================================
// Nav compacts on scroll
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector(".main-nav");

  if (nav) {
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 80);
    });
  }
});

// ============================================
// Magnetic Buttons
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (prefersReducedMotion || !isFinePointer) return;

  const magneticEls = document.querySelectorAll(".btn, .filter-btn");

  magneticEls.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
});

// ============================================
// Image Lazy Loading (for performance)
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    });

    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => imageObserver.observe(img));
  }
});

// ============================================
// Page Load Animation
// ============================================

window.addEventListener("load", function () {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);
});

// ============================================
// Custom Cursor (blend-mode dot, desktop only)
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (isTouchDevice || !isFinePointer) return;

  document.body.classList.add("cursor-none");

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  document.body.appendChild(cursor);

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let visible = false;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      cursorX = mouseX;
      cursorY = mouseY;
      visible = true;
    }
  });

  function raf() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });

  const interactiveElements = document.querySelectorAll(
    "a, button, .work-card, .project-card, input, textarea, select",
  );
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("is-active");
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-active");
    });
  });
});

// ============================================
// Print Console Message
// ============================================

console.log(
  "%c✦ Portfolio Website ",
  "background: #ff5a1f; color: white; font-size: 20px; padding: 10px;",
);
console.log(
  "%cDesigned with passion and attention to detail",
  "font-size: 12px; color: #5c5747;",
);

// ============================================
// Inline Carousel
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const carousels = document.querySelectorAll(".inline-carousel");

  carousels.forEach((carousel) => {
    const slides = carousel.querySelectorAll(".carousel-slide");
    const dots = carousel.querySelectorAll(".dot");
    const prevBtn = carousel.querySelector(".prev-btn");
    const nextBtn = carousel.querySelector(".next-btn");
    let currentSlide = 0;

    function showSlide(index) {
      slides.forEach((slide) => slide.classList.remove("active"));
      dots.forEach((dot) => dot.classList.remove("active"));

      slides[index].classList.add("active");
      dots[index].classList.add("active");
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(currentSlide);
    }

    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn) prevBtn.addEventListener("click", prevSlide);

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });
  });
});

// ============================================
// Lightbox for Images
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.querySelector(".lightbox-close");

  if (!lightbox) return;

  const images = document.querySelectorAll(
    ".week-grid-item img, .project-image-item .image-placeholder img, .image-placeholder img, .inline-image img",
  );

  images.forEach((img) => {
    img.addEventListener("click", function () {
      lightboxImg.src = this.src;
      lightboxImg.alt = this.alt;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
});

// ============================================
// Carousel Lightbox
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  if (!lightbox) return;

  const carouselImages = document.querySelectorAll(".carousel-slide img");

  carouselImages.forEach((img) => {
    img.style.cursor = "pointer";

    img.addEventListener("click", function () {
      lightboxImg.src = this.src;
      lightboxImg.alt = this.alt;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });
});
