/* =========================================================
   Вантажна логістика — поведінка сторінки
   ========================================================= */

/**
 * ЄДИНЕ МІСЦЕ ДЛЯ ДАНИХ КОМПАНІЇ.
 * Порожні значення приховують відповідні елементи на сторінці.
 * Заповнюйте лише підтвердженими даними.
 */
const SITE_CONFIG = {
  brandName: 'Вантажна логістика', // робоча назва до погодження
  phone: '', // напр. '+380 44 000 00 00' — після підтвердження компанією
  email: '', // напр. 'cargo@example.com' — після підтвердження компанією
  googleReviewsUrl: '', // посилання на Google Business Profile
  formEndpoint: '', // URL сервісу заявок (POST, JSON). Порожньо → демоверсія
};

const MESSAGES = {
  required: 'Заповніть це поле.',
  contact: 'Вкажіть телефон або email для відповіді.',
  email: 'Перевірте формат email.',
  phone: 'Перевірте номер телефону.',
  demo: 'Дані перевірено. У демоверсії запит не надсилається.',
  pending: 'Надсилаємо…',
  success: 'Запит отримано. Зв’яжемося з вами за вказаним контактом.',
  error: 'Запит не вдалося надіслати. Спробуйте ще раз.',
};

/**
 * Точка для майбутньої події конверсії (Google Ads, GA4, Meta тощо).
 * Викликається ТІЛЬКИ після підтвердженої відповіді сервісу заявок.
 * У демоверсії не викликається.
 */
function trackQuoteConversion(payload) {
  // Приклад після підключення аналітики:
  // window.gtag?.('event', 'generate_lead', { service: payload.service || 'not_set' });
  void payload;
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Дані компанії ---------- */
function applyConfig() {
  const { brandName, phone, email, googleReviewsUrl } = SITE_CONFIG;

  if (brandName) $$('[data-brand]').forEach((el) => (el.textContent = brandName));
  $$('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

  const contacts = { phone, email };
  const hrefs = {
    phone: phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '',
    email: email ? `mailto:${email}` : '',
  };

  Object.entries(contacts).forEach(([type, value]) => {
    $$(`[data-contact="${type}"]`).forEach((el) => {
      el.hidden = !value;
      if (value) {
        el.textContent = value;
        el.href = hrefs[type];
      }
    });
    $$(`[data-contact-item="${type}"]`).forEach((el) => (el.hidden = !value));
  });

  const anyContact = Boolean(phone || email);
  $$('[data-contact-list], [data-footer-contacts]').forEach((el) => (el.hidden = !anyContact));

  const reviewsLink = $('[data-reviews-link]');
  if (googleReviewsUrl && reviewsLink) {
    reviewsLink.href = googleReviewsUrl;
    reviewsLink.hidden = false;
    const placeholder = $('[data-reviews-placeholder]');
    if (placeholder) placeholder.hidden = true;
  }

  const badge = $('[data-demo-badge]');
  if (badge) badge.hidden = Boolean(SITE_CONFIG.formEndpoint);
}

/* ---------- Шапка й мобільне меню ---------- */
function initHeader() {
  const header = $('[data-header]');
  const toggle = $('[data-nav-toggle]');
  const menu = $('[data-nav-menu]');
  if (!header || !toggle || !menu) return;

  const desktop = window.matchMedia('(min-width: 1024px)');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = (open, { returnFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Закрити' : 'Меню';
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    if (!open && returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) menu.querySelector('a')?.focus();
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && !desktop.matches) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, { returnFocus: true });
    }
  });

  document.addEventListener('click', (e) => {
    if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) setOpen(false);
  });

  desktop.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/* ---------- Кнопки послуг підставляють тип перевезення ---------- */
function initServiceLinks() {
  const select = $('#f-service');
  if (!select) return;
  $$('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      // не перезаписуємо вибір користувача
      if (!select.value) select.value = link.dataset.service;
    });
  });
}

/* ---------- Форма запиту ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPhone = (v) => /^\+?\d{9,15}$/.test(v.replace(/[\s().-]/g, ''));

function initQuoteForm() {
  const form = $('[data-quote-form]');
  if (!form) return;

  const status = $('[data-form-status]', form);
  const submit = $('[data-submit]', form);
  const submitLabel = $('[data-submit-label]', form);
  const contactError = $('#contact-err', form);
  const f = (name) => form.elements.namedItem(name);
  let attempted = false;
  let sending = false;

  const setError = (input, message) => {
    const slot = $(`[data-error-for="${input.id}"]`, form);
    if (slot) slot.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const setStatus = (state, text) => {
    status.dataset.state = state || '';
    status.textContent = text || '';
  };

  /** Повертає поля з помилками в порядку DOM */
  const validate = () => {
    const invalid = [];

    ['name', 'from', 'to', 'cargo'].forEach((name) => {
      const input = f(name);
      const empty = !input.value.trim();
      setError(input, empty ? MESSAGES.required : '');
      if (empty) invalid.push(input);
    });

    const phone = f('phone');
    const email = f('email');
    const phoneVal = phone.value.trim();
    const emailVal = email.value.trim();

    setError(phone, phoneVal && !isPhone(phoneVal) ? MESSAGES.phone : '');
    setError(email, emailVal && !EMAIL_RE.test(emailVal) ? MESSAGES.email : '');
    if (phoneVal && !isPhone(phoneVal)) invalid.push(phone);
    if (emailVal && !EMAIL_RE.test(emailVal)) invalid.push(email);

    const noContact = !phoneVal && !emailVal;
    contactError.textContent = noContact ? MESSAGES.contact : '';
    if (noContact) {
      phone.setAttribute('aria-invalid', 'true');
      email.setAttribute('aria-invalid', 'true');
      invalid.push(phone);
    }

    const order = $$('input, select, textarea', form);
    return [...new Set(invalid)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  };

  // Після першої спроби — оновлюємо помилки під час введення
  form.addEventListener('input', () => {
    if (attempted) validate();
    if (status.dataset.state === 'demo' || status.dataset.state === 'error') setStatus('', '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    attempted = true;
    setStatus('', '');

    const invalid = validate();
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    if (!SITE_CONFIG.formEndpoint) {
      setStatus('demo', MESSAGES.demo);
      return;
    }

    sending = true;
    submit.setAttribute('aria-disabled', 'true');
    submitLabel.textContent = MESSAGES.pending;
    setStatus('pending', MESSAGES.pending);

    try {
      const res = await fetch(SITE_CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success', MESSAGES.success);
      trackQuoteConversion(payload);
      form.reset();
      attempted = false;
    } catch {
      setStatus('error', MESSAGES.error);
    } finally {
      sending = false;
      submit.removeAttribute('aria-disabled');
      submitLabel.textContent = 'Надіслати запит';
    }
  });
}

applyConfig();
initHeader();
initServiceLinks();
initQuoteForm();
