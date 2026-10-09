const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeNavigation() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navLinks?.classList.remove('open');
  const label = menuButton?.querySelector('.sr-only');
  if (label) label.textContent = '展开导航';
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navLinks.classList.toggle('open', !isOpen);
  menuButton.querySelector('.sr-only').textContent = isOpen ? '展开导航' : '关闭导航';
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    closeNavigation();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeNavigation();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeNavigation();
});
window.matchMedia('(max-width: 1040px)').addEventListener('change', closeNavigation);

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

const soundtrack = document.querySelector('.soundtrack');
const saulAudio = document.getElementById('saul-audio');
const audioLoop = document.getElementById('audio-loop');
const audioStatus = document.getElementById('audio-status');
audioLoop?.addEventListener('change', () => { saulAudio.loop = audioLoop.checked; });
function updateAudioStatus(message, playing = false) {
  audioStatus.textContent = message;
  soundtrack.classList.toggle('is-playing', playing);
}
saulAudio?.addEventListener('playing', () => updateAudioStatus('正在播放', true));
saulAudio?.addEventListener('pause', () => updateAudioStatus(saulAudio.ended ? '播放结束' : '已暂停'));
saulAudio?.addEventListener('ended', () => updateAudioStatus('播放结束'));
saulAudio?.addEventListener('waiting', () => updateAudioStatus('正在缓冲…'));
saulAudio?.addEventListener('error', () => updateAudioStatus('加载失败，请打开音频链接'));
const commentForm = document.getElementById('local-comment-form');
const commentName = document.getElementById('comment-name');
const commentRating = document.getElementById('comment-rating');
const commentMessage = document.getElementById('comment-message');
const commentStatus = document.getElementById('comment-status');
const commentList = document.getElementById('local-comment-list');
const commentUndo = document.getElementById('comment-undo');
const COMMENT_KEY = 'bcs.localGuestbook.v1';
const COMMENT_LIMIT = 100;
let storageAvailable = true;
let reviewFilter = 'all';
let deletedComment = null;

function readComments() {
  try {
    const stored = window.localStorage.getItem(COMMENT_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored);
    if (data.version !== 1 || !Array.isArray(data.comments)) throw new Error('Invalid data');
    return data.comments.filter((item) => item && typeof item.id === 'string' && item.id.length <= 100 &&
      typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 20 &&
      typeof item.message === 'string' && item.message.trim().length > 0 && item.message.length <= 300 &&
      ['good', 'bad'].includes(item.rating) && typeof item.createdAt === 'string' &&
      Number.isFinite(Date.parse(item.createdAt))).slice(0, COMMENT_LIMIT);
  } catch {
    storageAvailable = false;
    commentStatus.textContent = '无法读取浏览器保存的数据。新留言仅在本次页面保留，刷新后会丢失。';
    return [];
  }
}
let localComments = readComments();

function saveComments(next) {
  localComments = next;
  if (!storageAvailable) return false;
  try {
    window.localStorage.setItem(COMMENT_KEY, JSON.stringify({ version: 1, comments: next }));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}
function commentElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function filterGuestbook() {
  const notes = [...document.querySelectorAll('#guestbook [data-review]')];
  let fictional = 0, local = 0;
  notes.forEach((note) => {
    note.hidden = reviewFilter !== 'all' && note.dataset.review !== reviewFilter;
    if (!note.hidden) note.dataset.localComment ? local++ : fictional++;
  });
  guestbookFilters.forEach((button) => {
    const type = button.dataset.reviewFilter;
    const count = notes.filter((note) => type === 'all' || note.dataset.review === type).length;
    button.textContent = `${{ all: '全部留言', good: '好评', bad: '差评' }[type]} / ${count}`;
    button.setAttribute('aria-pressed', String(type === reviewFilter));
  });
  document.getElementById('guestbook-count').textContent = `角色留言 ${fictional} 条 · 本机留言 ${local} 条`;
  const empty = document.getElementById('local-comment-empty');
  empty.hidden = local > 0;
  empty.textContent = localComments.length ? '当前筛选下没有本机留言，试试“全部留言”。' : '还没有便签。写下第一条留言吧。';
}
function renderComments() {
  commentList.replaceChildren();
  localComments.forEach((item) => {
    const card = commentElement('article', `guestbook-note guestbook-note--${item.rating} local-comment-note`);
    card.dataset.review = item.rating;
    card.dataset.localComment = item.id;
    const top = commentElement('div', 'note-top');
    top.append(commentElement('span', 'note-verdict', item.rating === 'good' ? '好评' : '差评'),
      commentElement('span', 'local-comment-badge', '仅本机保存'));
    const body = commentElement('p', 'note-body', item.message);
    const footer = commentElement('footer');
    footer.append(commentElement('strong', '', item.name));
    const time = commentElement('time', 'local-comment-time', new Date(item.createdAt).toLocaleString('zh-CN'));
    time.dateTime = item.createdAt;
    footer.append(time, commentElement('span', '', '访客便签 · 非剧中角色或原台词'));
    const remove = commentElement('button', 'comment-delete', '删除这条便签');
    remove.type = 'button';
    remove.setAttribute('aria-label', `删除 ${item.name} 的本机留言`);
    remove.addEventListener('click', () => {
      deletedComment = item;
      const saved = saveComments(localComments.filter((entry) => entry.id !== item.id));
      renderComments();
      commentUndo.hidden = false;
      commentStatus.textContent = saved ? '已删除这条本机留言，可以撤销。' : '已从本次页面移除，但无法同步浏览器存储。刷新后旧数据可能仍在。';
      commentUndo.focus({ preventScroll: true });
    });
    footer.append(remove);
    card.append(top, commentElement('h3', '', item.rating === 'good' ? '给索尔一个好评' : '给索尔一个差评'), body, footer);
    commentList.append(card);
  });
  filterGuestbook();
}
guestbookFilters.forEach((button) => {
  button.addEventListener('click', () => {
    reviewFilter = button.dataset.reviewFilter;
    filterGuestbook();
  });
});
function updateCommentLength() {
  document.getElementById('comment-length').textContent = `${commentMessage.value.length} / 300 字符`;
  commentMessage.setCustomValidity('');
}
commentMessage.addEventListener('input', updateCommentLength);
commentName.addEventListener('input', () => commentName.setCustomValidity(''));
commentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = commentName.value.trim(), message = commentMessage.value.trim();
  commentName.setCustomValidity(name.length > 0 && name.length <= 20 ? '' : '请填写 1–20 个字符的昵称。');
  commentMessage.setCustomValidity(message.length > 0 && message.length <= 300 ? '' : '请填写 1–300 个字符的留言。');
  if (!commentForm.reportValidity()) return;
  if (localComments.length >= COMMENT_LIMIT) {
    commentStatus.textContent = '本机最多保存 100 条留言，请先删除不需要的便签。';
    return;
  }
  const rating = commentRating.value;
  if (!['good', 'bad'].includes(rating)) return;
  const item = { id: window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name, message, rating, createdAt: new Date().toISOString() };
  const saved = saveComments([item, ...localComments]);
  reviewFilter = 'all';
  deletedComment = null;
  commentUndo.hidden = true;
  renderComments();
  commentForm.reset();
  updateCommentLength();
  commentStatus.textContent = saved ? '便签已保存到当前浏览器。刷新后仍在，其他访客不可见。' : '便签已显示，但浏览器无法保存。刷新或关闭页面后会丢失。';
});
commentUndo.addEventListener('click', () => {
  if (!deletedComment || localComments.length >= COMMENT_LIMIT) return;
  const saved = saveComments([deletedComment, ...localComments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
  deletedComment = null;
  commentUndo.hidden = true;
  reviewFilter = 'all';
  renderComments();
  commentStatus.textContent = saved ? '已恢复刚才删除的留言。' : '已在本次页面恢复，但浏览器无法保存。';
  commentMessage.focus({ preventScroll: true });
});
window.addEventListener('storage', (event) => {
  if (event.key !== COMMENT_KEY && event.key !== null) return;
  localComments = readComments();
  deletedComment = null;
  commentUndo.hidden = true;
  renderComments();
});
renderComments();
document.getElementById('comment-submit').disabled = false;
