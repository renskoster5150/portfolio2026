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
// Scroll Animations
// ============================================

function observeElements() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Elements to animate on scroll
  const animatedElements = document.querySelectorAll(
    ".work-card, .service-card, .timeline-item, .skill-category, " +
      ".philosophy-item, .process-step, .pricing-card, .faq-item, .project-card",
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    el.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(el);
  });
}

// Initialize scroll animations when DOM is ready
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
        // Remove active class from all buttons
        filterButtons.forEach((btn) => btn.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        const filterValue = this.getAttribute("data-filter");

        // Filter projects
        projectCards.forEach((card) => {
          const category = card.getAttribute("data-category");

          if (filterValue === "all" || category === filterValue) {
            card.style.display = "block";
            // Trigger animation
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

      // Get form data
      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value,
      };

      // Show success message (in a real implementation, this would send to a server)
      showFormMessage(
        "success",
        "Thank you for your message! I'll get back to you soon.",
      );

      // Reset form
      contactForm.reset();

      // Log form data (for demonstration)
      console.log("Form submitted:", formData);
    });
  }
});

function showFormMessage(type, message) {
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `form-message form-message-${type}`;
  messageDiv.textContent = message;

  // Style the message
  messageDiv.style.padding = "1.5rem";
  messageDiv.style.marginTop = "2rem";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.fontWeight = "600";
  messageDiv.style.textAlign = "center";
  messageDiv.style.animation = "fadeIn 0.5s ease";

  if (type === "success") {
    messageDiv.style.background = "rgba(46, 213, 115, 0.1)";
    messageDiv.style.color = "#2ed573";
    messageDiv.style.border = "2px solid #2ed573";
  } else {
    messageDiv.style.background = "rgba(255, 107, 53, 0.1)";
    messageDiv.style.color = "#FF6B35";
    messageDiv.style.border = "2px solid #FF6B35";
  }

  // Insert message after form
  const form = document.getElementById("contactForm");
  form.parentNode.insertBefore(messageDiv, form.nextSibling);

  // Remove message after 5 seconds
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
          const offsetTop = target.offsetTop - 100; // Account for fixed nav

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
        const sectionHeight = section.clientHeight;

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
// Navbar Background on Scroll
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector(".main-nav");

  if (nav) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 100) {
        nav.style.background = "rgba(255, 255, 255, 0.98)";
        nav.style.boxShadow = "0 2px 30px rgba(0,0,0,0.1)";
      } else {
        nav.style.background = "var(--color-white)";
        nav.style.boxShadow = "0 2px 20px rgba(0,0,0,0.05)";
      }
    });
  }
});

// ============================================
// Parallax Effect for Hero Visual Elements
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const visualElements = document.querySelectorAll(".visual-element");

  if (visualElements.length > 0) {
    window.addEventListener("scroll", function () {
      const scrolled = window.pageYOffset;

      visualElements.forEach((element, index) => {
        const speed = 0.05 * (index + 1);
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
  }
});

// ============================================
// Form Input Animations
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll(
    ".form-group input, .form-group select, .form-group textarea",
  );

  inputs.forEach((input) => {
    // Add focus class on focus
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    // Remove focus class on blur if empty
    input.addEventListener("blur", function () {
      if (this.value === "") {
        this.parentElement.classList.remove("focused");
      }
    });

    // Add filled class if has value on load
    if (input.value !== "") {
      input.parentElement.classList.add("focused");
    }
  });
});

// ============================================
// Counter Animation (for statistics)
// ============================================

function animateCounter(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16); // 60 FPS

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

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
// Cursor Effect (Optional - Decorative)
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (!isTouchDevice) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid var(--color-primary);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.15s ease, opacity 0.15s ease;
            opacity: 0;
        `;
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX - 10 + "px";
      cursor.style.top = e.clientY - 10 + "px";
      cursor.style.opacity = "1";
    });

    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
    });

    // Scale cursor on hover over interactive elements
    const interactiveElements = document.querySelectorAll(
      "a, button, .work-card, .project-card",
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.style.transform = "scale(2)";
      });
      el.addEventListener("mouseleave", () => {
        cursor.style.transform = "scale(1)";
      });
    });
  }
});

// ============================================
// Print Console Message
// ============================================

console.log(
  "%c🎨 Portfolio Website ",
  "background: #FF6B35; color: white; font-size: 20px; padding: 10px;",
);
console.log(
  "%cDesigned with passion and attention to detail",
  "font-size: 12px; color: #6B6B6B;",
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
      // Remove active class from all slides and dots
      slides.forEach((slide) => slide.classList.remove("active"));
      dots.forEach((dot) => dot.classList.remove("active"));

      // Add active class to current slide and dot
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

    // Event listeners
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn) prevBtn.addEventListener("click", prevSlide);

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        currentSlide = index;
        showSlide(currentSlide);
      });
    });

    // Optional: Auto-advance every 5 seconds
    // setInterval(nextSlide, 5000);
  });
});
