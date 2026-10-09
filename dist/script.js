const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navLinks.classList.toggle('open', !isOpen);
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  });
});

const identityButtons = document.querySelectorAll('.identity-tabs [role="tab"]');
const identitySwitcher = document.querySelector('.identity-switcher');

function selectIdentity(selected) {
  identityButtons.forEach((button) => {
    const active = button === selected;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(`panel-${button.dataset.target}`);
    if (panel) panel.hidden = !active;
  });
  identitySwitcher.dataset.identity = selected.dataset.target;
}

identityButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectIdentity(button));
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowRight' ? (index + 1) % identityButtons.length : (index - 1 + identityButtons.length) % identityButtons.length;
    identityButtons[next].focus();
    selectIdentity(identityButtons[next]);
  });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.13 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = document.querySelectorAll('main section[id]');
const navigation = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigation.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

sections.forEach((section) => sectionObserver.observe(section));
document.getElementById('year').textContent = new Date().getFullYear();


const quoteCards = [...document.querySelectorAll('.quote-card')];
const roleFilter = document.getElementById('quote-role');
const seasonFilter = document.getElementById('quote-season');
function filterQuotes() {
  let visible = 0;
  quoteCards.forEach((card) => {
    card.hidden = !((roleFilter.value === 'all' || card.dataset.role === roleFilter.value) &&
      (seasonFilter.value === 'all' || card.dataset.season === seasonFilter.value));
    if (!card.hidden) visible++;
  });
  document.getElementById('quote-count').textContent = `显示 ${visible} / ${quoteCards.length} 条台词`;
  document.querySelector('.quote-empty').hidden = visible !== 0;
}
roleFilter.addEventListener('change', filterQuotes);
seasonFilter.addEventListener('change', filterQuotes);
document.getElementById('quote-reset').addEventListener('click', () => {
  roleFilter.value = seasonFilter.value = 'all';
  filterQuotes();
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Try the local fallback. */ }
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:0;left:-9999px';
  document.body.append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}
quoteCards.forEach((card) => {
  const button = card.querySelector('.copy-quote');
  button.addEventListener('click', async () => {
    const original = button.innerHTML;
    const quote = card.querySelector('blockquote').textContent.trim();
    const speaker = card.querySelector('h3').childNodes[0].textContent.trim();
    button.disabled = true;
    try {
      await copyText(quote);
      button.textContent = '已复制 ✓';
      document.querySelector('.copy-status').textContent = `已复制${speaker}的台词`;
    } catch {
      button.textContent = '复制失败，请手动选中台词';
      document.querySelector('.copy-status').textContent = '浏览器未允许复制，请手动选中台词复制。';
    } finally {
      button.disabled = false;
      button.focus({ preventScroll: true });
      window.setTimeout(() => { button.innerHTML = original; }, 2500);
    }
  });
});
// Keep old shared links useful without retaining the misleading section name.
if (window.location.hash === '#reviews') window.location.replace('#quotes');

const guestbookFilters = document.querySelectorAll('[data-review-filter]');
const guestbookNotes = document.querySelectorAll('[data-review]');
guestbookFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.reviewFilter;
    guestbookFilters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    guestbookNotes.forEach((note) => {
      note.hidden = filter !== 'all' && note.dataset.review !== filter;
      if (!note.hidden) count++;
    });
    document.getElementById('guestbook-count').textContent = `显示 ${count} 条虚构留言`;
  });
});
