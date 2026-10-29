
    /* ═══════════════════════════════════════════════
       PARTICLES SYSTEM
       ═══════════════════════════════════════════════ */
    const ParticleSystem = (() => {
      const canvas = document.getElementById('particles-canvas');
      const ctx = canvas.getContext('2d');
      let particles = [];
      let animationId;
      let width, height;

      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }

      class Particle {
        constructor() {
          this.reset();
        }

        reset() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = Math.random() * 1.8 + 0.3;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.speedY = (Math.random() - 0.5) * 0.3;
          this.opacity = Math.random() * 0.4 + 0.1;
          this.opacitySpeed = Math.random() * 0.003 + 0.001;
          this.opacityDir = 1;
          const colors = [
            [0, 229, 255],
            [139, 92, 246],
            [59, 130, 246],
            [45, 212, 191],
            [200, 210, 240]
          ];
          this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          this.opacity += this.opacitySpeed * this.opacityDir;

          if (this.opacity >= 0.5) this.opacityDir = -1;
          if (this.opacity <= 0.05) this.opacityDir = 1;

          if (this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
            this.reset();
          }
        }

        draw() {
          const [r, g, b] = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
          ctx.fill();

          if (this.size > 1.2) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.1})`;
            ctx.fill();
          }
        }
      }

      function init() {
        resize();
        const count = Math.min(Math.floor((width * height) / 12000), 120);
        particles = Array.from({ length: count }, () => new Particle());
      }

      function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          p.update();
          p.draw();
        });
        animationId = requestAnimationFrame(animate);
      }

      function start() {
        init();
        animate();
        window.addEventListener('resize', () => {
          resize();
          const count = Math.min(Math.floor((width * height) / 12000), 120);
          while (particles.length < count) particles.push(new Particle());
          while (particles.length > count) particles.pop();
        });
      }

      return { start };
    })();


    /* ═══════════════════════════════════════════════
       CURSOR SPOTLIGHT & PARALLAX
       ═══════════════════════════════════════════════ */
    const CursorEffects = (() => {
      const glow = document.getElementById('cursor-glow');
      const card = document.getElementById('login-card');
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let currentX = mouseX;
      let currentY = mouseY;

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function handleMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }

      function animate() {
        currentX = lerp(currentX, mouseX, 0.08);
        currentY = lerp(currentY, mouseY, 0.08);

        glow.style.left = currentX + 'px';
        glow.style.top = currentY + 'px';

        // Card parallax
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const deltaX = (mouseX - cardCenterX) / window.innerWidth;
        const deltaY = (mouseY - cardCenterY) / window.innerHeight;

        card.style.transform = `perspective(1200px) rotateY(${deltaX * 2}deg) rotateX(${-deltaY * 2}deg)`;

        requestAnimationFrame(animate);
      }

      function init() {
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', (e) => {
          const t = e.touches[0];
          mouseX = t.clientX;
          mouseY = t.clientY;
        });
        animate();
      }

      return { init };
    })();


    /* ═══════════════════════════════════════════════
       FORM VALIDATION & INTERACTIONS
       ═══════════════════════════════════════════════ */
    const LoginForm = (() => {
      const form = document.getElementById('login-form');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const emailGroup = document.getElementById('email-group');
      const passwordGroup = document.getElementById('password-group');
      const emailError = document.getElementById('email-error');
      const passwordError = document.getElementById('password-error');
      const loginBtn = document.getElementById('login-btn');
      const toggleBtn = document.getElementById('toggle-password');
      const eyeOpen = document.getElementById('eye-open');
      const eyeClosed = document.getElementById('eye-closed');
      const strengthBars = document.querySelectorAll('.strength-bar');
      const strengthContainer = document.getElementById('password-strength');
      const strengthText = document.getElementById('strength-text');
      const successOverlay = document.getElementById('success-overlay');

      let passwordVisible = false;
      let isSubmitting = false;

      // Email validation
      function validateEmail(value) {
        if (!value.trim()) return 'Please enter your email address';
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) return 'Please enter a valid email address';
        return '';
      }

      // Password validation
      function validatePassword(value) {
        if (!value) return 'Please enter your password';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      }

      // Password strength
      function getStrength(value) {
        if (!value) return 0;
        let score = 0;
        if (value.length >= 6) score++;
        if (value.length >= 10) score++;
        if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        return Math.min(score, 4);
      }

      function updateStrength(value) {
        const strength = getStrength(value);

        if (value.length > 0) {
          strengthContainer.classList.add('visible');
        } else {
          strengthContainer.classList.remove('visible');
          strengthText.textContent = '';
          return;
        }

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const classes = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
        const colors = ['', 'var(--error)', '#f59e0b', 'var(--cyan)', 'var(--success)'];

        strengthBars.forEach((bar, i) => {
          bar.className = 'strength-bar';
          if (i < strength) {
            bar.classList.add('active', classes[strength]);
          }
        });

        strengthText.textContent = labels[strength] || '';
        strengthText.style.color = colors[strength] || '';
      }

      // Show/hide error
      function showError(group, errorEl, message) {
        group.classList.remove('valid');
        group.classList.add('error');
        errorEl.querySelector('span').textContent = message;
        errorEl.classList.add('visible');
      }

      function clearError(group, errorEl) {
        group.classList.remove('error');
        errorEl.classList.remove('visible');
      }

      function showValid(group) {
        group.classList.remove('error');
        group.classList.add('valid');
      }

      // Toggle password visibility
      function togglePassword() {
        passwordVisible = !passwordVisible;
        passwordInput.type = passwordVisible ? 'text' : 'password';
        eyeOpen.style.display = passwordVisible ? 'none' : 'block';
        eyeClosed.style.display = passwordVisible ? 'block' : 'none';
      }

      // Ripple effect
      function createRipple(e, btn) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      }

      // Has-value class for floating label
      function updateHasValue(input) {
        if (input.value.trim()) {
          input.classList.add('has-value');
        } else {
          input.classList.remove('has-value');
        }
      }

      // Real-time validation
      function handleEmailInput() {
        updateHasValue(emailInput);
        const error = validateEmail(emailInput.value);
        if (emailGroup.classList.contains('error')) {
          if (!error) {
            clearError(emailGroup, emailError);
            showValid(emailGroup);
          } else {
            showError(emailGroup, emailError, error);
          }
        } else if (emailInput.value.trim() && !error) {
          showValid(emailGroup);
        } else {
          emailGroup.classList.remove('valid');
        }
      }

      function handlePasswordInput() {
        updateHasValue(passwordInput);
        updateStrength(passwordInput.value);
        const error = validatePassword(passwordInput.value);
        if (passwordGroup.classList.contains('error')) {
          if (!error) {
            clearError(passwordGroup, passwordError);
            showValid(passwordGroup);
          } else {
            showError(passwordGroup, passwordError, error);
          }
        } else if (passwordInput.value && !error) {
          showValid(passwordGroup);
        } else {
          passwordGroup.classList.remove('valid');
        }
      }

      // Email blur validation
      function handleEmailBlur() {
        if (!emailInput.value.trim()) return;
        const error = validateEmail(emailInput.value);
        if (error) {
          showError(emailGroup, emailError, error);
        } else {
          clearError(emailGroup, emailError);
          showValid(emailGroup);
        }
      }

      // Submit
      async function handleSubmit(e) {
        e.preventDefault();
        if (isSubmitting) return;

        const emailErr = validateEmail(emailInput.value);
        const passErr = validatePassword(passwordInput.value);

        let hasError = false;

        if (emailErr) {
          showError(emailGroup, emailError, emailErr);
          hasError = true;
        } else {
          clearError(emailGroup, emailError);
          showValid(emailGroup);
        }

        if (passErr) {
          showError(passwordGroup, passwordError, passErr);
          hasError = true;
        } else {
          clearError(passwordGroup, passwordError);
          showValid(passwordGroup);
        }

        if (hasError) return;

        // Start loading
        isSubmitting = true;
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Success
        loginBtn.classList.remove('loading');
        loginBtn.classList.add('success');

        await new Promise(resolve => setTimeout(resolve, 800));

        // Show overlay
        successOverlay.classList.add('visible');

        // Reset after delay
        setTimeout(() => {
          loginBtn.classList.remove('success');
          loginBtn.disabled = false;
          isSubmitting = false;
          successOverlay.classList.remove('visible');
          form.reset();
          emailInput.classList.remove('has-value');
          passwordInput.classList.remove('has-value');
          emailGroup.classList.remove('valid');
          passwordGroup.classList.remove('valid');
          strengthContainer.classList.remove('visible');
          strengthText.textContent = '';
          strengthBars.forEach(b => b.className = 'strength-bar');
        }, 3500);
      }

      function init() {
        emailInput.addEventListener('input', handleEmailInput);
        passwordInput.addEventListener('input', handlePasswordInput);
        emailInput.addEventListener('blur', handleEmailBlur);
        toggleBtn.addEventListener('click', togglePassword);
        loginBtn.addEventListener('click', (e) => createRipple(e, loginBtn));
        form.addEventListener('submit', handleSubmit);

        // Initial has-value check (for autofill)
        setTimeout(() => {
          updateHasValue(emailInput);
          updateHasValue(passwordInput);
        }, 100);
      }

      return { init };
    })();


    /* ═══════════════════════════════════════════════
       INITIALIZATION
       ═══════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {
      ParticleSystem.start();
      CursorEffects.init();
      LoginForm.init();
    });
