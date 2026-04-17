// ── App hint overlay ────────────────────────────────────────────────
// Shared overlay tooltip used by menu items and other UI chrome.
// Renders into #app-menu-hint and reads messages from `data-hint`.
// ────────────────────────────────────────────────────────────────────

let hideTimer = null;

function getHintEl() {
  return document.getElementById("app-menu-hint");
}

export function showHint(message) {
  const hintEl = getHintEl();
  if (!hintEl) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  hintEl.textContent = message || "";
  hintEl.classList.toggle("is-visible", Boolean(message));
}

export function hideHintSoon(delayMs = 1000) {
  const hintEl = getHintEl();
  if (!hintEl) return;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    hintEl.classList.remove("is-visible");
    hintEl.textContent = "";
    hideTimer = null;
  }, delayMs);
}

export function attachHint(el, messageOverride) {
  if (!el) return;
  const message = messageOverride ?? el.getAttribute("data-hint");
  if (!message) return;
  el.addEventListener("mouseenter", () => showHint(message));
  el.addEventListener("focusin", () => showHint(message));
  el.addEventListener("mouseleave", () => hideHintSoon());
  el.addEventListener("focusout", () => hideHintSoon());
}
