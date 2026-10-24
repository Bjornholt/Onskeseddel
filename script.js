const STORAGE_KEY = "onskeseddel-wishes-v1";
const reviewerMode = new URLSearchParams(location.search).get("view") === "reviewer";
const app = document.querySelector("#app");
const wishDialog = document.querySelector("#wish-dialog");
const wishForm = document.querySelector("#wish-form");
const confirmDialog = document.querySelector("#confirm-dialog");
let wishes = readWishes();
let editingId = null;
let dragState = null;

function readWishes() {
  const match = location.hash.match(/^#list=(.+)$/);
  const snapshot = match ? WishlistCore.decodeSnapshot(match[1]) : null;
  if (snapshot) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      const cleaned = WishlistCore.normalizeWishes(saved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    }
  } catch { /* Start with the embedded list if the local copy is unreadable. */ }
  const starter = WishlistCore.starterWishes();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));
  return starter;
}

function saveWishes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  if (location.hash.startsWith("#list=")) {
    history.replaceState(null, "", `${location.pathname}${location.search}#list=${WishlistCore.encodeSnapshot(wishes)}`);
  }
  render();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
}

function safeUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value, location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}

function wishCard(wish, index) {
  const store = safeUrl(wish.url);
  const image = safeUrl(wish.image);
  const controls = reviewerMode
    ? ""
    : `<div class="wish-actions">
        <button class="icon-button drag-handle" type="button" data-id="${escapeHtml(wish.id)}" aria-label="Træk for at flytte ${escapeHtml(wish.title)}" title="Træk for at flytte">⠿</button>
        <button class="icon-button" data-action="move-up" data-id="${escapeHtml(wish.id)}" aria-label="Flyt op" title="Flyt op" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-button" data-action="move-down" data-id="${escapeHtml(wish.id)}" aria-label="Flyt ned" title="Flyt ned" ${index === wishes.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon-button" data-action="edit" data-id="${escapeHtml(wish.id)}" aria-label="Rediger ${escapeHtml(wish.title)}" title="Rediger">✎</button>
        <button class="icon-button" data-action="delete" data-id="${escapeHtml(wish.id)}" aria-label="Slet ${escapeHtml(wish.title)}" title="Slet">×</button>
      </div>`;
  return `<article class="wish-card" data-wish-id="${escapeHtml(wish.id)}">
    <a class="wish-image-wrap" href="${store || "#"}" ${store ? 'target="_blank" rel="noopener noreferrer"' : ""} aria-label="Se ${escapeHtml(wish.title)} hos forhandleren">
      ${image ? `<img src="${image}" alt="${escapeHtml(wish.title)}" loading="lazy" onerror="this.style.display='none'">` : ""}
    </a>
    <div class="wish-body"><h2>${escapeHtml(wish.title)}</h2>${wish.description ? `<p class="description">${escapeHtml(wish.description)}</p>` : ""}
      <div class="wish-bottom"><div>${wish.price ? `<p class="price">${escapeHtml(wish.price)}</p>` : ""}${store ? `<a class="store-link" href="${store}" target="_blank" rel="noopener noreferrer">Se hos forhandler ↗</a>` : ""}</div>${controls}</div>
    </div></article>`;
}

function render() {
  document.querySelector("#top-note").textContent = reviewerMode ? "Lasses ønskeliste til dig" : "En lille samling af ønsker";
  const header = reviewerMode
    ? `<section class="hero"><div><p class="eyebrow">Lasse · Ønskeliste</p><h1>Find den helt rigtige gave</h1><p class="intro">Her er ønskerne på listen.</p></div></section>`
    : `<section class="hero"><div><p class="eyebrow">Lasse · Min ønskeliste</p><h1>Ønsker, der gør mig glad</h1><p class="intro">Saml dine ønsker ét sted, og del listen med dem, du holder af.</p></div><div class="hero-actions"><button class="button button-light" data-action="share">↗ Del listen</button><button class="button button-primary" data-action="add">＋ Tilføj ønske</button></div></section>`;
  const summary = `<div class="summary"><strong>${wishes.length} ønsker</strong></div>`;
  const empty = `<div class="empty"><div class="empty-icon">🎁</div><h2>${reviewerMode ? "Listen er tom lige nu" : "Start din ønskeliste"}</h2><p>${reviewerMode ? "Der er ikke tilføjet ønsker endnu." : "Tilføj et ønske med et link, så er du i gang."}</p>${reviewerMode ? "" : '<button class="button button-primary" data-action="add">＋ Tilføj dit første ønske</button>'}</div>`;
  const footer = reviewerMode
    ? '<p class="footnote centered">Ønskelisten er delt med dig — god gavejagt!</p>'
    : '<p class="footnote centered">Dine ændringer gemmes i denne browser og kommer med i reviewerlinket, når du deler listen.</p>';
  app.innerHTML = `${header}${summary}<section class="wish-grid" id="wish-grid" aria-label="Ønsker">${wishes.length ? wishes.map(wishCard).join("") : empty}</section>${footer}`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openWishForm(wish = null) {
  editingId = wish?.id || null;
  wishForm.reset();
  for (const field of ["title", "url", "image", "description", "price"]) wishForm.elements[field].value = wish?.[field] || "";
  document.querySelector("#dialog-title").textContent = editingId ? "Rediger ønske" : "Tilføj et ønske";
  wishDialog.showModal();
  wishForm.elements.title.focus();
}

function copyText(value, success) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(() => showToast(success)).catch(() => window.prompt("Kopiér linket:", value));
  } else window.prompt("Kopiér linket:", value);
}

app.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const {action,id} = button.dataset;
  const wish = wishes.find(item => item.id === id);
  if (action === "add" && !reviewerMode) openWishForm();
  if (action === "edit" && wish && !reviewerMode) openWishForm(wish);
  if (action === "delete" && wish && !reviewerMode) {
    if (await confirmDelete()) {
      wishes = WishlistCore.removeWish(wishes, id);
      saveWishes();
      showToast("Ønsket er slettet");
    }
  }
  if ((action === "move-up" || action === "move-down") && wish && !reviewerMode) {
    wishes = WishlistCore.moveWish(wishes, id, action === "move-up" ? -1 : 1);
    saveWishes();
  }
  if (action === "share" && !reviewerMode) copyText(WishlistCore.reviewUrl(location.href, wishes), "Reviewerlink kopieret");
});

function confirmDelete() {
  confirmDialog.showModal();
  return new Promise(resolve => {
    confirmDialog.addEventListener("close", () => resolve(confirmDialog.returnValue === "delete"), {once:true});
  });
}

wishForm.addEventListener("submit", event => {
  event.preventDefault();
  const fields = new FormData(wishForm);
  const title = String(fields.get("title") || "").trim();
  if (!title) return;
  const id = editingId || globalThis.crypto?.randomUUID?.() || String(Date.now());
  const previous = wishes.find(wish => wish.id === id);
  wishes = WishlistCore.upsertWish(wishes, {
    id, title,
    url: safeUrl(String(fields.get("url") || "").trim()),
    image: safeUrl(String(fields.get("image") || "").trim()),
    description: String(fields.get("description") || "").trim(),
    price: String(fields.get("price") || "").trim()
  });
  saveWishes();
  wishDialog.close();
  editingId = null;
  showToast(previous ? "Ønsket er opdateret" : "Ønsket er tilføjet");
});

document.querySelector(".close-button").addEventListener("click", () => wishDialog.close());
document.querySelector(".cancel-button").addEventListener("click", () => wishDialog.close());

function beginDrag(handle, event) {
  const card = handle.closest(".wish-card");
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const placeholder = document.createElement("article");
  placeholder.className = "wish-card drag-placeholder";
  placeholder.dataset.wishId = card.dataset.wishId;
  placeholder.style.height = `${rect.height}px`;
  card.before(placeholder);
  card.classList.add("dragging");
  Object.assign(card.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    pointerEvents: "none",
    zIndex: "10"
  });

  dragState.started = true;
  dragState.card = card;
  dragState.placeholder = placeholder;
  dragState.offsetX = event.clientX - rect.left;
  dragState.offsetY = event.clientY - rect.top;
  handle.setPointerCapture(event.pointerId);
}

function movePlaceholder(event) {
  const { card, placeholder } = dragState;
  card.style.left = `${event.clientX - dragState.offsetX}px`;
  card.style.top = `${event.clientY - dragState.offsetY}px`;

  const target = document.elementFromPoint(event.clientX, event.clientY)
    ?.closest(".wish-card:not(.dragging):not(.drag-placeholder)");
  const grid = document.querySelector("#wish-grid");
  if (!target || !grid.contains(target)) return;

  const rect = target.getBoundingClientRect();
  const deltaX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
  const deltaY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
  const insertAfter = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX > 0 : deltaY > 0;
  if (insertAfter) target.after(placeholder);
  else target.before(placeholder);
}

function finishDrag(commit) {
  if (!dragState) return;
  const { card, placeholder, handle, started } = dragState;

  if (started) {
    if (commit) {
      const order = [...document.querySelectorAll("#wish-grid > .wish-card:not(.dragging), #wish-grid > .drag-placeholder")]
        .map(item => item.dataset.wishId);
      wishes = WishlistCore.reorderWishes(wishes, order);
    }
    card.classList.remove("dragging");
    card.removeAttribute("style");
    placeholder.remove();
  }

  if (handle.hasPointerCapture(dragState.pointerId)) handle.releasePointerCapture(dragState.pointerId);
  dragState = null;
  if (started && commit) saveWishes();
}

app.addEventListener("pointerdown", event => {
  const handle = event.target.closest(".drag-handle");
  if (!handle || event.button !== 0) return;
  dragState = {
    handle,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    started: false
  };
});

app.addEventListener("pointermove", event => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  if (!dragState.started) {
    if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) < 6) return;
    beginDrag(dragState.handle, event);
  }
  event.preventDefault();
  movePlaceholder(event);
});

app.addEventListener("pointerup", event => {
  if (dragState?.pointerId === event.pointerId) finishDrag(true);
});

app.addEventListener("pointercancel", event => {
  if (dragState?.pointerId === event.pointerId) finishDrag(false);
});

render();
