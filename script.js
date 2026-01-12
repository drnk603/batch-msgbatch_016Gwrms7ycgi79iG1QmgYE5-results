(function () {
  'use strict';

  const App = {
    _initialized: false,
    _modules: {},

    init() {
      if (this._initialized) return;
      this._initialized = true;

      this._modules.navigation = new NavigationModule();
      this._modules.scrollEffects = new ScrollEffectsModule();
      this._modules.formValidation = new FormValidationModule();
      this._modules.animations = new AnimationsModule();
      this._modules.imageHandling = new ImageHandlingModule();
      this._modules.interactions = new InteractionsModule();
      this._modules.modalHandler = new ModalHandlerModule();

      Object.values(this._modules).forEach(module => module.init());
    }
  };

  class NavigationModule {
    constructor() {
      this.nav = null;
      this.toggle = null;
      this.navList = null;
      this.body = document.body;
      this.isOpen = false;
      this.header = null;
    }

    init() {
      this.nav = document.querySelector('.navbar-collapse');
      this.toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
      this.navList = document.querySelector('.navbar-nav');
      this.header = document.querySelector('.l-header');

      if (!this.nav || !this.toggle) return;

      this.setupBurgerMenu();
      this.setupSmoothScroll();
      this.setupScrollSpy();
      this.setupScrollToTop();
    }

    setupBurgerMenu() {
      this.toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMenu();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeMenu();
        }
      });

      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.nav.contains(e.target) && !this.toggle.contains(e.target)) {
          this.closeMenu();
        }
      });

      const navLinks = this.navList?.querySelectorAll('.nav-link, .c-nav__item');
      navLinks?.forEach(link => {
        link.addEventListener('click', () => {
          if (this.isOpen) {
            setTimeout(() => this.closeMenu(), 150);
          }
        });
      });

      window.addEventListener('resize', this.debounce(() => {
        if (window.innerWidth >= 768 && this.isOpen) {
          this.closeMenu();
        }
      }, 150));
    }

    toggleMenu() {
      this.isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
      this.isOpen = true;
      this.nav.classList.add('show');
      this.toggle.setAttribute('aria-expanded', 'true');
      this.body.classList.add('u-no-scroll');

      this.nav.style.height = `calc(100vh - ${this.header?.offsetHeight || 80}px)`;
    }

    closeMenu() {
      this.isOpen = false;
      this.nav.classList.remove('show');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.body.classList.remove('u-no-scroll');
    }

    setupSmoothScroll() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href^="#"]');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();
          const headerHeight = this.header?.offsetHeight || 80;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          history.pushState(null, '', href);
        }
      });
    }

    setupScrollSpy() {
      const sections = document.querySelectorAll('section[id], div[id]');
      const navLinks = document.querySelectorAll('.nav-link, .c-nav__item');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(link => {
              link.classList.remove('active');
              link.removeAttribute('aria-current');

              const href = link.getAttribute('href');
              if (href === `#${entry.target.id}`) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
              }
            });
          }
        });
      }, {
        threshold: 0.3,
        rootMargin: '-80px 0px -80% 0px'
      });

      sections.forEach(section => observer.observe(section));
    }

    setupScrollToTop() {
      let scrollButton = document.getElementById('scroll-to-top');

      if (!scrollButton) {
        scrollButton = document.createElement('button');
        scrollButton.id = 'scroll-to-top';
        scrollButton.innerHTML = '↑';
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        scrollButton.style.cssText = `
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--color-primary);
          color: var(--color-white);
          border: none;
          font-size: 24px;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease-in-out;
          z-index: 999;
          box-shadow: var(--shadow-lg);
        `;
        document.body.appendChild(scrollButton);
      }

      window.addEventListener('scroll', this.throttle(() => {
        if (window.pageYOffset > 300) {
          scrollButton.style.opacity = '1';
          scrollButton.style.visibility = 'visible';
        } else {
          scrollButton.style.opacity = '0';
          scrollButton.style.visibility = 'hidden';
        }
      }, 100));

      scrollButton.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });

      scrollButton.addEventListener('mouseenter', () => {
        scrollButton.style.transform = 'scale(1.1) translateY(-5px)';
        scrollButton.style.boxShadow = 'var(--shadow-glow-hover)';
      });

      scrollButton.addEventListener('mouseleave', () => {
        scrollButton.style.transform = 'scale(1) translateY(0)';
        scrollButton.style.boxShadow = 'var(--shadow-lg)';
      });
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    throttle(func, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  }

  class FormValidationModule {
    constructor() {
      this.validators = {
        firstName: {
          pattern: /^[a-zA-ZÀ-ÿ\s-']{2,50}$/,
          message: 'First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.'
        },
        lastName: {
          pattern: /^[a-zA-ZÀ-ÿ\s-']{2,50}$/,
          message: 'Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.'
        },
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address (e.g., example@domain.com).'
        },
        phone: {
          pattern: /^[\d\s+\-()]{10,20}$/,
          message: 'Phone number must be 10-20 characters and contain only digits, spaces, +, -, (, ).'
        },
        message: {
          minLength: 10,
          message: 'Message must be at least 10 characters long.'
        }
      };
    }

    init() {
      const forms = document.querySelectorAll('form.c-form, form#contactForm');
      forms.forEach(form => this.setupForm(form));
    }

    setupForm(form) {
      const fields = form.querySelectorAll('input, textarea, select');

      fields.forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            this.validateField(field);
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let isValid = true;
        const formData = {};

        fields.forEach(field => {
          if (!this.validateField(field)) {
            isValid = false;
          }
          if (field.name) {
            formData[field.name] = field.value;
          }
        });

        const privacyConsent = form.querySelector('#privacyConsent');
        if (privacyConsent && !privacyConsent.checked) {
          this.showError(privacyConsent, 'You must accept the privacy policy to continue.');
          isValid = false;
        }

        if (!isValid) {
          this.showNotification('Please correct the errors in the form.', 'error');
          return;
        }

        this.submitForm(form, formData);
      });
    }

    validateField(field) {
      const fieldName = field.name || field.id;
      const value = field.value.trim();

      this.clearError(field);

      if (field.hasAttribute('required') && !value) {
        this.showError(field, `${this.getFieldLabel(field)} is required.`);
        return false;
      }

      if (!value) return true;

      const validator = this.validators[fieldName];

      if (validator) {
        if (validator.pattern && !validator.pattern.test(value)) {
          this.showError(field, validator.message);
          return false;
        }

        if (validator.minLength && value.length < validator.minLength) {
          this.showError(field, validator.message);
          return false;
        }
      }

      field.classList.add('is-valid');
      return true;
    }

    showError(field, message) {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');

      let errorDiv = field.parentElement.querySelector('.invalid-feedback, .c-form__error');

      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback c-form__error';
        errorDiv.style.display = 'block';
        field.parentElement.appendChild(errorDiv);
      }

      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }

    clearError(field) {
      field.classList.remove('is-invalid', 'is-valid');
      const errorDiv = field.parentElement.querySelector('.invalid-feedback, .c-form__error');
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
    }

    getFieldLabel(field) {
      const label = field.parentElement.querySelector('label');
      if (label) return label.textContent.replace('*', '').trim();

      const placeholder = field.getAttribute('placeholder');
      if (placeholder) return placeholder;

      return field.name || field.id || 'This field';
    }

    submitForm(form, formData) {
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;

      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

      setTimeout(() => {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;

        this.showNotification('Thank you! Your message has been sent successfully.', 'success');

        setTimeout(() => {
          window.location.href = 'thank_you.html';
        }, 1500);

        form.reset();
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
          el.classList.remove('is-valid', 'is-invalid');
        });
      }, 2000);
    }

    showNotification(message, type = 'info') {
      let container = document.getElementById('notification-container');

      if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 9999;
          max-width: 400px;
        `;
        document.body.appendChild(container);
      }

      const notification = document.createElement('div');
      notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
      notification.style.cssText = `
        margin-bottom: 10px;
        box-shadow: var(--shadow-lg);
        animation: slideInRight 0.5s ease-out;
      `;
      notification.innerHTML = `
        <div>${message}</div>
        <button type="button" class="btn-close" aria-label="Close"></button>
      `;

      container.appendChild(notification);

      const closeBtn = notification.querySelector('.btn-close');
      closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
      });

      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    }
  }

  class ScrollEffectsModule {
    init() {
      this.setupIntersectionObserver();
      this.setupCountUpAnimation();
    }

    setupIntersectionObserver() {
      const animatedElements = document.querySelectorAll('.card, .c-card, .accordion-item, img, .c-button, section');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(30px)';

            requestAnimationFrame(() => {
              entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            });

            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animatedElements.forEach(el => {
        if (!el.hasAttribute('data-no-animate')) {
          observer.observe(el);
        }
      });
    }

    setupCountUpAnimation() {
      const counters = document.querySelectorAll('[data-count-up]');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
      const target = parseInt(element.getAttribute('data-count-up')) || 0;
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };

      updateCounter();
    }
  }

  class AnimationsModule {
    init() {
      this.addAnimationStyles();
      this.setupAccordionAnimations();
    }

    addAnimationStyles() {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .navbar-collapse {
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card, .c-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .c-button, .btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease-out;
        }

        .u-no-scroll {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    setupAccordionAnimations() {
      const accordionButtons = document.querySelectorAll('.accordion-button');

      accordionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const target = button.getAttribute('data-bs-target') || button.getAttribute('aria-controls');
          if (!target) return;

          const collapse = document.querySelector(target.startsWith('#') ? target : `#${target}`);
          if (!collapse) return;

          const isExpanded = button.getAttribute('aria-expanded') === 'true';

          if (!isExpanded) {
            collapse.style.maxHeight = collapse.scrollHeight + 'px';
            collapse.classList.add('show');
            button.setAttribute('aria-expanded', 'true');
            button.classList.remove('collapsed');
          } else {
            collapse.style.maxHeight = '0';
            collapse.classList.remove('show');
            button.setAttribute('aria-expanded', 'false');
            button.classList.add('collapsed');
          }
        });
      });
    }
  }

  class InteractionsModule {
    init() {
      this.setupRippleEffect();
      this.setupHoverEffects();
    }

    setupRippleEffect() {
      const buttons = document.querySelectorAll('.c-button, .btn, .nav-link, .c-nav__item');

      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          const ripple = document.createElement('span');
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            top: ${y}px;
            left: ${x}px;
            pointer-events: none;
            animation: rippleEffect 0.6s ease-out;
          `;

          button.style.position = 'relative';
          button.style.overflow = 'hidden';
          button.appendChild(ripple);

          setTimeout(() => ripple.remove(), 600);
        });
      });

      const style = document.createElement('style');
      style.textContent = `
        @keyframes rippleEffect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    setupHoverEffects() {
      const cards = document.querySelectorAll('.card, .c-card');

      cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-8px) scale(1.02)';
          card.style.boxShadow = 'var(--shadow-lg)';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0) scale(1)';
          card.style.boxShadow = 'var(--shadow-sm)';
        });
      });

      const links = document.querySelectorAll('a:not(.c-button):not(.btn)');

      links.forEach(link => {
        link.addEventListener('mouseenter', () => {
          link.style.transition = 'color 0.2s ease-in-out, transform 0.2s ease-in-out';
          link.style.transform = 'translateX(3px)';
        });

        link.addEventListener('mouseleave', () => {
          link.style.transform = 'translateX(0)';
        });
      });
    }
  }

  class ImageHandlingModule {
    init() {
      const images = document.querySelectorAll('img');

      images.forEach(img => {
        if (!img.hasAttribute('loading') && !img.hasAttribute('data-critical')) {
          img.setAttribute('loading', 'lazy');
        }

        img.addEventListener('error', () => {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236c757d"%3EImage not available%3C/text%3E%3C/svg%3E';
        }, { once: true });
      });
    }
  }

  class ModalHandlerModule {
    init() {
      this.setupPrivacyModal();
    }

    setupPrivacyModal() {
      const privacyLinks = document.querySelectorAll('a[href*="privacy"]');

      privacyLinks.forEach(link => {
        if (link.getAttribute('href').includes('privacy.html') || link.textContent.toLowerCase().includes('privacy policy')) {
          link.addEventListener('click', (e) => {
            if (link.hasAttribute('data-modal')) {
              e.preventDefault();
              this.showModal('Privacy Policy', 'Please review our privacy policy on the dedicated page.');
            }
          });
        }
      });
    }

    showModal(title, content) {
      let modal = document.getElementById('app-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'app-modal';
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          padding: 2rem;
          border-radius: var(--border-radius-lg);
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          transform: scale(0.9);
          transition: transform 0.3s ease-out;
        `;

        modalContent.innerHTML = `
          <h2 style="margin-top: 0;">${title}</h2>
          <p>${content}</p>
          <button class="c-button c-button--primary" style="margin-top: 1rem;">Close</button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        setTimeout(() => {
          modal.style.opacity = '1';
          modalContent.style.transform = 'scale(1)';
        }, 10);

        const closeBtn = modalContent.querySelector('button');
        closeBtn.addEventListener('click', () => this.closeModal());

        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModal();
        });
      }
    }

    closeModal() {
      const modal = document.getElementById('app-modal');
      if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();