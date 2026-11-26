/* =========================================================
   Veymark Logistics — поведінка сторінки
   ========================================================= */

/**
 * ЄДИНЕ МІСЦЕ ДЛЯ ДАНИХ КОМПАНІЇ.
 * Порожні значення приховують відповідні елементи на сторінці.
 * Заповнюйте лише підтвердженими даними.
 */
const SITE_CONFIG = {
  brandName: 'Veymark Logistics',
  phone: '', // напр. '+380 44 000 00 00' — після підтвердження компанією
  email: '', // напр. 'cargo@example.com' — після підтвердження компанією
  googleReviewsUrl: '', // посилання на Google Business Profile
  address: [], // рядки адреси, напр. ['вул. …, 1', 'Київ, 01001'] — після підтвердження
  socials: [], // напр. [{ label: 'Instagram', url: 'https://…' }]
  policies: [], // напр. [{ label: 'Політика конфіденційності', url: '/privacy' }]
  formEndpoint: '', // URL сервісу заявок (POST, JSON). Порожньо → демоверсія
  sampleReviews: true, // картки-приклади (позначені «Приклад»), доки не підключено Google-профіль
  sampleContacts: true, // тимчасові контакти для макета — показуються ЛИШЕ на localhost
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

/**
 * ЗРАЗКИ ВІДГУКІВ ДЛЯ МАКЕТА. Вигадані тексти й імена, нейтральні аватари — не справжні люди.
 * Показуються на сайті як позначені приклади, доки не задано googleReviewsUrl.
 * Без оцінки Google і без позначки Google — це не справжні відгуки.
 */
const SAMPLE_REVIEWS = [
  { name: 'Тарас Мельничук', text: 'Швидко порахували вартість перевезення палет зі складу в Києві до магазину у Львові, погодили дату й тримали в курсі статусу до самої доставки.' },
  { name: 'Ірина Савчук', text: 'Потрібно було відправити кілька місць до Польщі без окремої машини. Підказали варіант зі збірним вантажем і заздалегідь уточнили всі параметри.' },
  { name: 'Андрій Бондар', text: 'Зручно, що достатньо описати маршрут і вантаж — решту деталей уточнили самі. Після доставки одразу повідомили в погодженому месенджері.' },
  { name: 'Олена Ткачук', text: 'Регулярно возимо продукцію між майданчиками. Умови завантаження погоджуємо наперед, тож на рампі немає сюрпризів.' },
  { name: 'Максим Гнатюк', text: 'Точні габарити спершу були невідомі — дали приблизні, і перед підтвердженням перевезення нам допомогли все уточнити.' },
  { name: 'Наталія Кравець', text: 'Зрозуміло, від чого залежить вартість, і орієнтовні строки відомі ще до підтвердження. Для нас це головне при плануванні поставок.' },
];

const IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);

/**
 * ТИМЧАСОВІ КОНТАКТИ ДЛЯ ЛОКАЛЬНОГО ПЕРЕГЛЯДУ. Не справжні дані.
 * Підставляються лише на localhost і лише в незаповнені поля SITE_CONFIG.
 */
const PREVIEW_CONTACTS = {
  phone: '+380 00 000 00 00',
  email: 'hello@veymarklogistics.example',
  address: ['вул. Логістична, 12', 'Київ, Україна'],
  socials: [{ label: 'Instagram', url: '#' }, { label: 'Facebook', url: '#' }],
  policies: [{ label: 'Політика конфіденційності', url: '#' }],
};
if (IS_LOCAL_PREVIEW && SITE_CONFIG.sampleContacts) {
  Object.entries(PREVIEW_CONTACTS).forEach(([k, v]) => {
    const empty = Array.isArray(SITE_CONFIG[k]) ? !SITE_CONFIG[k].length : !SITE_CONFIG[k];
    if (empty) SITE_CONFIG[k] = v;
  });
}

const SOCIAL_ICONS = {
  Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" class="fill"/></svg>',
  Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 8.5V7c0-.8.5-1.2 1.2-1.2H17V3h-2.6C11.9 3 11 4.6 11 6.8v1.7H9V11h2v10h3V11h2.4l.5-2.5z" class="fill"/></svg>',
};

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
        const slot = el.querySelector('[data-contact-text]');
        (slot || el).textContent = value;
        el.href = hrefs[type];
      }
    });

    $$(`[data-contact-item="${type}"]`).forEach((el) => (el.hidden = !value));
  });

  const makeLink = (item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = item.label;
    if (/^https?:/.test(item.url)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    if (SOCIAL_ICONS[item.label]) a.insertAdjacentHTML('afterbegin', SOCIAL_ICONS[item.label]); // статичний SVG, не дані
    return a;
  };
  const addItems = (list, items) => items.forEach((it) => {
    const li = document.createElement('li');
    li.append(makeLink(it));
    list.append(li);
  });

  const socials = $('[data-socials]');
  const socialsCol = $('[data-socials-col]');
  if (socials) addItems(socials, SITE_CONFIG.socials);
  if (socialsCol) socialsCol.hidden = !SITE_CONFIG.socials.length;

  const policies = $('[data-policies]');
  if (policies) addItems(policies, SITE_CONFIG.policies);

  const addr = $('[data-address]');
  if (addr && SITE_CONFIG.address.length) {
    addr.replaceChildren(...SITE_CONFIG.address.flatMap((line, i) => (i ? [document.createElement('br'), line] : [line])));
  }

  const reviewsLink = $('[data-reviews-link]');
  if (googleReviewsUrl && reviewsLink) {
    reviewsLink.href = googleReviewsUrl;
    reviewsLink.hidden = false;
    const placeholder = $('[data-reviews-placeholder]');
    if (placeholder) placeholder.hidden = true;
  }

}

/* ---------- Зразки відгуків (тільки локальний перегляд) ---------- */
function renderSampleReviews() {
  const grid = $('[data-reviews-grid]');
  if (!grid || !SITE_CONFIG.sampleReviews || SITE_CONFIG.googleReviewsUrl) return;

  const starsSvg = () => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 108 20');
    svg.setAttribute('class', 'review-stars');
    svg.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8z');
      path.setAttribute('transform', `translate(${i * 22} 0)`);
      svg.appendChild(path);
    }
    return svg;
  };
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  SAMPLE_REVIEWS.forEach((r) => {
    const li = el('li', 'review-card');
    const inner = el('article', 'review-card__inner');
    const head = el('div', 'review-card__head');
    head.append(el('span', 'review-card__avatar'), el('p', 'review-card__name', r.name));
    const foot = el('div', 'review-card__foot');
    const rating = el('span', 'visually-hidden', 'Приклад оцінки');
    const mark = el('span', 'review-card__source');
    mark.append(el('span', 'review-card__source-name', 'Приклад'), el('span', 'review-card__source-sub', 'не справжній відгук'));
    foot.append(starsSvg(), rating, mark);
    inner.append(head, el('p', 'review-card__text', r.text), foot);
    li.append(inner);
    grid.append(li);
  });

  grid.hidden = false;
  $('[data-reviews-badges]').hidden = false;
  const placeholder = $('[data-reviews-placeholder]');
  if (placeholder) placeholder.hidden = true;
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
    toggle.querySelector('.nav-toggle__label').textContent = open ? 'Закрити меню' : 'Відкрити меню';
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

    ['name'].forEach((name) => {
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
renderSampleReviews();
initHeader();
initServiceLinks();
initQuoteForm();
