/* ==========================================================================
   Twin Liquid Glass — Post Card & Edit Modal UI
========================================================================== */
import {
  db,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  increment,
  serverTimestamp,
  pushNotification,
  uploadToCloudinary,
  uploadVideoToCloudinary,
  readVideoMetadata,
  getVideoPosterUrl,
  formatDuration,
  sanitizeHtml,
  containsHtmlMarkup,
  DEFAULT_AVATAR,
  escapeHtml,
  renderRichTextHtml,
  formatTime,
  toMillis,
  showToast,
  friendlyError,
  isUserAdmin,
  isGuestUser,
  requireMemberAction,
  renderAdminIconHtml,
  getStoryPrivacyMeta
} from "./firebase-service.js";
import { getSiteSettings } from "./layout.js";

const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;

export const REACTIONS = [
  {
    key: "love",
    emoji: "❤️",
    label: "Yêu thích",
    color: "#f43f5e",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="55%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#be123c"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="14" rx="14" ry="7" fill="#fff" opacity=".26"/><path d="M32 49.5c-.8 0-1.6-.3-2.2-.8C21.5 41.9 16 36.7 16 29.4c0-5.4 4.2-9.6 9.5-9.6 2.9 0 5.4 1.4 6.5 3.6 1.1-2.2 3.6-3.6 6.5-3.6 5.3 0 9.5 4.2 9.5 9.6 0 7.3-5.5 12.5-13.8 19.3-.6.5-1.4.8-2.2.8z" fill="#fff"/></svg>`)
  },
  {
    key: "haha",
    emoji: "😆",
    label: "Haha",
    color: "#f59e0b",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="28%" r="72%"><stop offset="0%" stop-color="#fef08a"/><stop offset="58%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".32"/><ellipse cx="16" cy="35" rx="4.5" ry="2.6" fill="#fb7185" opacity=".4"/><ellipse cx="48" cy="35" rx="4.5" ry="2.6" fill="#fb7185" opacity=".4"/><path d="M16 22l9 4-9 4" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 22l-9 4 9 4" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 35h30c0 9.2-6.7 16-15 16s-15-6.8-15-16z" fill="#451a03"/><path d="M20 35h24v3.8c0 1-.8 1.7-1.7 1.7H21.7c-1 0-1.7-.7-1.7-1.7V35z" fill="#fff"/><path d="M23.5 46.5c2.2-2.2 5.2-3.4 8.5-3.4s6.3 1.2 8.5 3.4C38.2 49.2 35.3 51 32 51s-6.2-1.8-8.5-4.5z" fill="#fb7185"/></svg>`)
  },
  {
    key: "wow",
    emoji: "😮",
    label: "Wow",
    color: "#f59e0b",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="28%" r="72%"><stop offset="0%" stop-color="#fef08a"/><stop offset="58%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".3"/><path d="M16 20c2.2-3.2 6.8-3.8 9.6-1.4" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><path d="M48 20c-2.2-3.2-6.8-3.8-9.6-1.4" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><ellipse cx="22.5" cy="29.5" rx="3.8" ry="4.8" fill="#451a03"/><circle cx="21.3" cy="27.8" r="1.3" fill="#fff"/><ellipse cx="41.5" cy="29.5" rx="3.8" ry="4.8" fill="#451a03"/><circle cx="40.3" cy="27.8" r="1.3" fill="#fff"/><ellipse cx="32" cy="45" rx="7.2" ry="9.2" fill="#451a03"/><ellipse cx="32" cy="49.5" rx="4.2" ry="2.8" fill="#f43f5e" opacity=".75"/></svg>`)
  },
  {
    key: "sad",
    emoji: "😢",
    label: "Buồn",
    color: "#eab308",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="28%" r="72%"><stop offset="0%" stop-color="#fef08a"/><stop offset="58%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".3"/><path d="M16 25c3.4-.5 6.4-2.2 8.4-4.8" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><path d="M48 25c-3.4-.5-6.4-2.2-8.4-4.8" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><circle cx="22.5" cy="32" r="4" fill="#451a03"/><circle cx="21.2" cy="30.6" r="1.3" fill="#fff"/><circle cx="41.5" cy="32" r="4" fill="#451a03"/><circle cx="40.2" cy="30.6" r="1.3" fill="#fff"/><path d="M23 47.5c2.6-3.8 15.4-3.8 18 0" fill="none" stroke="#451a03" stroke-width="3.4" stroke-linecap="round"/><path d="M46 37.5c0 0 5.5 6.2 5.5 10.2a5.5 5.5 0 0 1-11 0c0-4 5.5-10.2 5.5-10.2z" fill="url(#t)"/><ellipse cx="44.3" cy="46.2" rx="1.4" ry="2.4" fill="#fff" opacity=".65"/></svg>`)
  },
  {
    key: "angry",
    emoji: "😡",
    label: "Phẫn nộ",
    color: "#ef4444",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="50%" cy="22%" r="78%"><stop offset="0%" stop-color="#fb923c"/><stop offset="52%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="25" cy="13" rx="13" ry="6" fill="#fff" opacity=".24"/><path d="M16 23l11 5.5" fill="none" stroke="#450a0a" stroke-width="3.8" stroke-linecap="round"/><path d="M48 23l-11 5.5" fill="none" stroke="#450a0a" stroke-width="3.8" stroke-linecap="round"/><circle cx="22.5" cy="33" r="3.8" fill="#450a0a"/><circle cx="21.4" cy="31.7" r="1.2" fill="#fff"/><circle cx="41.5" cy="33" r="3.8" fill="#450a0a"/><circle cx="40.4" cy="31.7" r="1.2" fill="#fff"/><path d="M22.5 47c3-3.6 16-3.6 19 0" fill="none" stroke="#450a0a" stroke-width="3.6" stroke-linecap="round"/></svg>`)
  }
];


// ==========================================================================
// High-Quality Glossy SVG Feelings for Composer & Post Cards
// ==========================================================================
export const FEELINGS = [
  {
    value: "hạnh phúc",
    label: "Hạnh phúc",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#fef08a"/><stop offset="56%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".34"/><ellipse cx="16.5" cy="36" rx="5" ry="3" fill="#fb7185" opacity=".46"/><ellipse cx="47.5" cy="36" rx="5" ry="3" fill="#fb7185" opacity=".46"/><path d="M17 28c1.5-3.4 5.5-3.4 7 0" fill="none" stroke="#451a03" stroke-width="3.4" stroke-linecap="round"/><path d="M40 28c1.5-3.4 5.5-3.4 7 0" fill="none" stroke="#451a03" stroke-width="3.4" stroke-linecap="round"/><path d="M20 37.5c2.6 6.8 21.4 6.8 24 0" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round"/></svg>`)
  },
  {
    value: "hào hứng",
    label: "Hào hứng",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#fef08a"/><stop offset="56%" stop-color="#facc15"/><stop offset="100%" stop-color="#ea580c"/></radialGradient><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".32"/><path d="M20.5 18l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="url(#s)"/><path d="M43.5 18l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="url(#s)"/><path d="M19 38h26c0 8.2-5.8 14-13 14s-13-5.8-13-14z" fill="#451a03"/><path d="M22 38h20v3.2c0 .9-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.6-1.5-1.5V38z" fill="#fff"/><path d="M24.5 47.5c2-2 4.6-3 7.5-3s5.5 1 7.5 3c-2 2.4-4.6 4.2-7.5 4.2s-5.5-1.8-7.5-4.2z" fill="#fb7185"/></svg>`)
  },
  {
    value: "đang yêu",
    label: "Đang yêu",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#fef08a"/><stop offset="56%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".32"/><path d="M21 32c-.4 0-.8-.1-1.1-.4-3.8-3.1-6.4-5.5-6.4-8.8 0-2.5 1.9-4.4 4.3-4.4 1.3 0 2.5.7 3.2 1.7.7-1 1.9-1.7 3.2-1.7 2.4 0 4.3 1.9 4.3 4.4 0 3.3-2.6 5.7-6.4 8.8-.3.3-.7.4-1.1.4z" fill="url(#h)"/><path d="M43 32c-.4 0-.8-.1-1.1-.4-3.8-3.1-6.4-5.5-6.4-8.8 0-2.5 1.9-4.4 4.3-4.4 1.3 0 2.5.7 3.2 1.7.7-1 1.9-1.7 3.2-1.7 2.4 0 4.3 1.9 4.3 4.4 0 3.3-2.6 5.7-6.4 8.8-.3.3-.7.4-1.1.4z" fill="url(#h)"/><path d="M21 39c2.5 6.2 19.5 6.2 22 0" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round"/></svg>`)
  },
  {
    value: "thư giãn",
    label: "Thư giãn",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#a7f3d0"/><stop offset="56%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".3"/><ellipse cx="16.5" cy="36" rx="4.6" ry="2.6" fill="#f43f5e" opacity=".32"/><ellipse cx="47.5" cy="36" rx="4.6" ry="2.6" fill="#f43f5e" opacity=".32"/><path d="M17 28.5c1.8 2.6 5.4 2.6 7.2 0" fill="none" stroke="#064e3b" stroke-width="3.4" stroke-linecap="round"/><path d="M39.8 28.5c1.8 2.6 5.4 2.6 7.2 0" fill="none" stroke="#064e3b" stroke-width="3.4" stroke-linecap="round"/><path d="M23 40c2.5 4 15.5 4 18 0" fill="none" stroke="#064e3b" stroke-width="3.4" stroke-linecap="round"/></svg>`)
  },
  {
    value: "tự hào",
    label: "Tự hào",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#fde68a"/><stop offset="56%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".32"/><rect x="12" y="22" width="18" height="12" rx="4" fill="#1e293b"/><rect x="34" y="22" width="18" height="12" rx="4" fill="#1e293b"/><path d="M30 26h4" stroke="#1e293b" stroke-width="3.2"/><path d="M15 25.5l4.5-1.2M37 25.5l4.5-1.2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/><path d="M22 42c3.2 4.6 16.8 4.6 20 0" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round"/></svg>`)
  },
  {
    value: "biết ơn",
    label: "Biết ơn",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#ddd6fe"/><stop offset="55%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".3"/><path d="M32 16l3.4 9.6L45 29l-9.6 3.4L32 42l-3.4-9.6L19 29l9.6-3.4z" fill="#fff"/><circle cx="47" cy="43" r="3.2" fill="#fde047"/><circle cx="17" cy="44" r="2.5" fill="#fde047"/></svg>`)
  },
  {
    value: "tuyệt vời",
    label: "Tuyệt vời",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="55%" stop-color="#0284c7"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".28"/><path d="M32 15l4.8 10.2 11.2 1.5-8.2 7.8 2 11.2L32 40.3l-9.8 5.4 2-11.2-8.2-7.8 11.2-1.5z" fill="#fef08a"/></svg>`)
  },
  {
    value: "buồn nhẹ",
    label: "Buồn nhẹ",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#bae6fd"/><stop offset="56%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#3b82f6"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".28"/><circle cx="22.5" cy="30" r="3.8" fill="#1e3a8a"/><circle cx="21.4" cy="28.8" r="1.2" fill="#fff"/><circle cx="41.5" cy="30" r="3.8" fill="#1e3a8a"/><circle cx="40.4" cy="28.8" r="1.2" fill="#fff"/><path d="M23 45c2.6-3.4 15.4-3.4 18 0" fill="none" stroke="#1e3a8a" stroke-width="3.4" stroke-linecap="round"/></svg>`)
  }
];

const FEELING_DEFAULT_ICON = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="35%" cy="26%" r="74%"><stop offset="0%" stop-color="#fef08a"/><stop offset="56%" stop-color="#facc15"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="13" rx="13" ry="6" fill="#fff" opacity=".32"/><circle cx="22.5" cy="27.5" r="3.6" fill="#451a03"/><circle cx="41.5" cy="27.5" r="3.6" fill="#451a03"/><path d="M21 37.5c2.6 5.8 19.4 5.8 22 0" fill="none" stroke="#451a03" stroke-width="3.6" stroke-linecap="round"/></svg>`);

export function findFeelingObj(raw = "") {
  const clean = String(raw || "").trim().toLowerCase();
  if (!clean) return null;
  return FEELINGS.find((f) => clean.startsWith(f.value) || clean.includes(f.value)) || null;
}

export function renderFeelingBadgeHtml(rawFeeling = "") {
  const txt = String(rawFeeling || "").trim();
  if (!txt) return "";
  const f = findFeelingObj(txt);
  if (f) {
    return `<span class="twin-post-feeling-badge"><span style="font-weight:400;color:var(--text-3)"> đang cảm thấy </span><img class="twin-feeling-inline-ico" src="${f.icon}" alt="${escapeHtml(f.label)}" draggable="false" /><strong>${escapeHtml(f.label)}</strong></span>`;
  }
  return `<span style="font-weight:400;color:var(--text-3)"> đang cảm thấy ${escapeHtml(txt)}</span>`;
}

let feelingPopoverCloserBound = false;
function bindFeelingPopoverCloser() {
  if (feelingPopoverCloserBound) return;
  feelingPopoverCloserBound = true;
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".twin-feeling-wrap.open").forEach((w) => {
      if (!w.contains(e.target)) w.classList.remove("open");
    });
  });
}

export function enhanceFeelingSelect(selectEl) {
  if (!selectEl || selectEl.dataset.enhancedFeeling === "1") return null;
  bindFeelingPopoverCloser();
  selectEl.dataset.enhancedFeeling = "1";

  // Populate select options from FEELINGS so .value always matches
  const initialVal = selectEl.value || "";
  selectEl.innerHTML = `<option value="">Cảm xúc...</option>` + FEELINGS.map((f) => `<option value="${escapeHtml(f.value)}">${escapeHtml(f.label)}</option>`).join("");
  const matchedInit = findFeelingObj(initialVal);
  selectEl.value = matchedInit ? matchedInit.value : "";

  const pill = selectEl.closest(".twin-feeling-pill") || selectEl.parentElement;
  if (!pill) return null;

  const wrap = document.createElement("div");
  wrap.className = "twin-feeling-wrap";
  pill.parentNode.insertBefore(wrap, pill);

  selectEl.style.display = "none";
  wrap.appendChild(selectEl);
  pill.remove();

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "twin-feeling-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  wrap.appendChild(trigger);

  const popover = document.createElement("div");
  popover.className = "twin-feeling-popover";
  popover.setAttribute("role", "listbox");
  popover.innerHTML = `
    <div class="twin-feeling-pop-head">
      <span>Bạn đang cảm thấy thế nào?</span>
      <button type="button" class="twin-feeling-clear-btn">Bỏ chọn</button>
    </div>
    <div class="twin-feeling-grid">
      ${FEELINGS.map(
        (f) => `
        <button type="button" class="twin-feeling-opt" data-val="${escapeHtml(f.value)}">
          <img class="twin-feeling-opt-ico" src="${f.icon}" alt="${escapeHtml(f.label)}" draggable="false" />
          <span>${escapeHtml(f.label)}</span>
        </button>`
      ).join("")}
    </div>
  `;
  wrap.appendChild(popover);

  const syncUi = () => {
    const f = findFeelingObj(selectEl.value);
    if (f) {
      trigger.classList.add("has-value");
      trigger.innerHTML = `
        <img class="twin-feeling-ico" src="${f.icon}" alt="${escapeHtml(f.label)}" draggable="false" />
        <span>${escapeHtml(f.label)}</span>
        <span class="twin-feeling-caret" aria-hidden="true">▾</span>
      `;
    } else {
      trigger.classList.remove("has-value");
      trigger.innerHTML = `
        <img class="twin-feeling-ico" src="${FEELING_DEFAULT_ICON}" alt="Cảm xúc" draggable="false" />
        <span>Cảm xúc</span>
        <span class="twin-feeling-caret" aria-hidden="true">▾</span>
      `;
    }
    popover.querySelectorAll(".twin-feeling-opt").forEach((b) => {
      b.classList.toggle("active", Boolean(f && b.dataset.val === f.value));
    });
  };

  trigger.onclick = (e) => {
    e.stopPropagation();
    const opening = !wrap.classList.contains("open");
    document.querySelectorAll(".twin-feeling-wrap.open").forEach((w) => w.classList.remove("open"));
    wrap.classList.toggle("open", opening);
    trigger.setAttribute("aria-expanded", opening ? "true" : "false");
  };

  popover.querySelectorAll(".twin-feeling-opt").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      selectEl.value = btn.dataset.val || "";
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      syncUi();
      wrap.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    };
  });

  popover.querySelector(".twin-feeling-clear-btn").onclick = (e) => {
    e.stopPropagation();
    selectEl.value = "";
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    syncUi();
    wrap.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  };

  selectEl.addEventListener("change", syncUi);
  selectEl._syncFeelingUi = syncUi;
  syncUi();
  return { sync: syncUi };
}

export function renderReactionIcon(key, className = "twin-rx-icon") {
  const r = REACTIONS.find((x) => x.key === key) || REACTIONS[0];
  return `<img class="${className}" src="${r.icon}" alt="${r.label}" draggable="false" />`;
}

const SVG = {
  like: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comment: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5c4.9 0 8.8 3.5 8.8 7.9 0 4.4-3.9 7.9-8.8 7.9-1.3 0-2.6-.3-3.7-.8L4 20l1.1-3.7a7.3 7.3 0 0 1-1.9-4.9c0-4.4 3.9-7.9 8.8-7.9Z"/></svg>`,
  share: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5"/></svg>`,
  save: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v15l-7-4-7 4v-15A1.5 1.5 0 0 1 6.5 4Z"/></svg>`,
  saveFilled: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v15l-7-4-7 4v-15A1.5 1.5 0 0 1 6.5 4Z"/></svg>`,
  pin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16.5V22"/><path d="M9 10.5 6 14v1.5h12V14l-3-3.5V6l1.5-2h-9L9 6v4.5Z"/></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m14 6 4 4"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16"/><path d="M18.5 6.5 17.6 19a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5.5 6.5"/><path d="M9 6.5v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`
};

async function safe(fn) {
  try {
    await fn();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err));
  }
}

let pickerCloserBound = false;
function bindPickerCloser() {
  if (pickerCloserBound) return;
  pickerCloserBound = true;
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".twin-react-wrap.open").forEach((w) => {
      if (!w.contains(e.target)) w.classList.remove("open");
    });
  });
}

// ==========================================================================
// Album ảnh & Video Gallery + Full-screen Media Lightbox
// ==========================================================================
export function getPostImages(post) {
  if (!post) return [];
  if (Array.isArray(post.imageUrls) && post.imageUrls.length) {
    return post.imageUrls.filter((u) => typeof u === "string" && u.trim());
  }
  if (typeof post.imageUrl === "string" && post.imageUrl.trim()) {
    return [post.imageUrl.trim()];
  }
  return [];
}

let lbItems = [];
let lbIndex = 0;

function ensureMediaLightbox() {
  let backdrop = document.getElementById("twin-media-lightbox");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.id = "twin-media-lightbox";
  backdrop.className = "twin-modal-backdrop twin-media-lightbox";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.innerHTML = `
    <div class="twin-media-lb-shell">
      <div class="twin-media-lb-bar">
        <div style="min-width:0;display:flex;align-items:center;gap:10px;">
          <span id="twin-mlb-title" class="twin-media-lb-title">Album</span>
          <span id="twin-mlb-counter" class="twin-media-lb-counter"></span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <a id="twin-mlb-open" href="#" target="_blank" rel="noopener noreferrer" class="twin-btn twin-btn-secondary twin-btn-sm" style="background:rgba(255,255,255,0.14);color:#fff;border-color:transparent;">Mở gốc</a>
          <button type="button" id="twin-mlb-close" class="twin-icon-btn twin-lightbox-close-btn" aria-label="Đóng">✕</button>
        </div>
      </div>
      <div class="twin-media-lb-stage">
        <button type="button" id="twin-mlb-prev" class="twin-media-lb-nav prev" aria-label="Trước">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <img id="twin-mlb-img" alt="Xem ảnh" style="display:none;" />
        <video id="twin-mlb-video" controls playsinline style="display:none;"></video>
        <button type="button" id="twin-mlb-next" class="twin-media-lb-nav next" aria-label="Tiếp theo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      <div id="twin-mlb-caption" class="twin-media-lb-caption" style="display:none;"></div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const imgEl = backdrop.querySelector("#twin-mlb-img");
  const vidEl = backdrop.querySelector("#twin-mlb-video");
  const titleEl = backdrop.querySelector("#twin-mlb-title");
  const counterEl = backdrop.querySelector("#twin-mlb-counter");
  const openEl = backdrop.querySelector("#twin-mlb-open");
  const capEl = backdrop.querySelector("#twin-mlb-caption");
  const prevBtn = backdrop.querySelector("#twin-mlb-prev");
  const nextBtn = backdrop.querySelector("#twin-mlb-next");

  const close = () => {
    try { vidEl.pause(); vidEl.removeAttribute("src"); vidEl.load(); } catch {}
    backdrop.classList.remove("open");
  };

  const paint = () => {
    if (!lbItems.length) return;
    lbIndex = ((lbIndex % lbItems.length) + lbItems.length) % lbItems.length;
    const item = lbItems[lbIndex];
    const url = typeof item === "string" ? item : item.url;
    const isVid = typeof item === "object" && item.type === "video";
    const caption = typeof item === "object" ? (item.caption || "") : "";

    counterEl.textContent = lbItems.length > 1 ? `${lbIndex + 1} / ${lbItems.length}` : "";
    openEl.href = url || "#";
    prevBtn.style.display = lbItems.length > 1 ? "grid" : "none";
    nextBtn.style.display = lbItems.length > 1 ? "grid" : "none";

    if (isVid) {
      imgEl.style.display = "none";
      vidEl.style.display = "block";
      vidEl.src = url;
      if (item.poster) vidEl.poster = item.poster;
      else vidEl.removeAttribute("poster");
    } else {
      try { vidEl.pause(); vidEl.removeAttribute("src"); vidEl.load(); } catch {}
      vidEl.style.display = "none";
      imgEl.style.display = "block";
      imgEl.src = url;
    }

    if (caption) {
      capEl.textContent = caption;
      capEl.style.display = "block";
    } else {
      capEl.style.display = "none";
    }
  };

  backdrop.querySelector("#twin-mlb-close").onclick = close;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  prevBtn.onclick = (e) => { e.stopPropagation(); lbIndex -= 1; paint(); };
  nextBtn.onclick = (e) => { e.stopPropagation(); lbIndex += 1; paint(); };

  document.addEventListener("keydown", (e) => {
    if (!backdrop.classList.contains("open")) return;
    if (e.key === "ArrowLeft" && lbItems.length > 1) { lbIndex -= 1; paint(); }
    else if (e.key === "ArrowRight" && lbItems.length > 1) { lbIndex += 1; paint(); }
    else if (e.key === "Escape") close();
  });

  backdrop._paint = paint;
  backdrop._titleEl = titleEl;
  return backdrop;
}

export function openMediaLightbox(items = [], startIndex = 0, title = "Album ảnh") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return;
  const backdrop = ensureMediaLightbox();
  lbItems = list;
  lbIndex = Math.max(0, Math.min(startIndex, list.length - 1));
  backdrop._titleEl.textContent = title || "Album ảnh";
  backdrop._paint();
  backdrop.classList.add("open");
}

export function extractMediaFromPosts(posts = []) {
  const photos = [];
  const videos = [];
  posts.forEach((p) => {
    const imgs = getPostImages(p);
    const plainCap = p.content ? String(p.content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140) : "";
    imgs.forEach((url) => {
      photos.push({
        type: "image",
        url,
        postId: p.id,
        authorName: p.authorName || "",
        caption: plainCap,
        createdAt: p.createdAt
      });
    });
    if (p.videoUrl) {
      videos.push({
        type: "video",
        url: p.videoUrl,
        poster: p.videoPoster || getVideoPosterUrl(p.videoUrl),
        duration: p.videoDuration || 0,
        postId: p.id,
        authorName: p.authorName || "",
        caption: plainCap,
        createdAt: p.createdAt
      });
    }
  });
  return { photos, videos };
}

export function renderMediaGallery(container, posts = [], { type = "photo", emptyText = "", title = "" } = {}) {
  if (!container) return;
  const { photos, videos } = extractMediaFromPosts(posts);

  if (type === "video") {
    if (!videos.length) {
      container.innerHTML = `<div class="twin-card twin-gallery-empty">${escapeHtml(emptyText || "Chưa có video nào trong album.")}</div>`;
      return;
    }
    container.innerHTML = `<div class="twin-video-gallery-grid"></div>`;
    const grid = container.querySelector(".twin-video-gallery-grid");
    videos.forEach((v, idx) => {
      const card = document.createElement("div");
      card.className = "twin-video-gallery-card";
      const dur = v.duration ? formatDuration(v.duration) : "Video";
      card.innerHTML = `
        <div class="twin-video-gallery-media">
          <video src="${escapeHtml(v.url)}" ${v.poster ? `poster="${escapeHtml(v.poster)}"` : ""} controls playsinline preload="metadata"></video>
          <span class="twin-video-gallery-badge">${escapeHtml(dur)}</span>
        </div>
        <div class="twin-video-gallery-foot">
          <div class="twin-video-gallery-cap">${escapeHtml(v.caption || "Video đã đăng")}</div>
          <button type="button" class="twin-btn twin-btn-secondary twin-btn-sm btn-open-v-lb">Phóng to</button>
        </div>
      `;
      card.querySelector(".btn-open-v-lb").onclick = () => openMediaLightbox(videos, idx, title || "Album video");
      grid.appendChild(card);
    });
    return;
  }

  if (!photos.length) {
    container.innerHTML = `<div class="twin-card twin-gallery-empty">${escapeHtml(emptyText || "Chưa có ảnh nào trong album.")}</div>`;
    return;
  }
  container.innerHTML = `<div class="twin-album-grid"></div>`;
  const grid = container.querySelector(".twin-album-grid");
  photos.forEach((item, idx) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "twin-album-tile";
    tile.title = item.caption || "Xem ảnh";
    tile.innerHTML = `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.caption || "Ảnh album")}" loading="lazy" />`;
    tile.onclick = () => openMediaLightbox(photos, idx, title || "Album ảnh");
    grid.appendChild(tile);
  });
}


// ==========================================================================
// Modal chỉnh sửa bài viết (Tự động nhận diện Văn bản hoặc Mã HTML)
// ==========================================================================
let editingPost = null;
let editNewFile = null;
let editRemoveImage = false;
let editRemoveVideo = false;
let editingUser = null;

function ensureEditModal() {
  let backdrop = document.getElementById("twin-edit-post-modal");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.id = "twin-edit-post-modal";
  backdrop.className = "twin-modal-backdrop";
  backdrop.innerHTML = `
    <div class="twin-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h2 style="font-size:19px;font-weight:800;">Chỉnh sửa bài viết</h2>
        <button type="button" id="ep-close-btn" class="twin-icon-btn" style="width:32px;height:32px;">✕</button>
      </div>
      <form id="ep-form" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <div class="twin-composer-pills">
            <div class="twin-feeling-pill twin-privacy-pill" title="Quyền xem bài viết">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19Z"/></svg>
              <select id="ep-privacy" class="twin-feeling-select" aria-label="Quyền xem bài viết">
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
            <div class="twin-feeling-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/></svg>
              <select id="ep-feeling" class="twin-feeling-select" aria-label="Cảm xúc bài viết">
                <option value="">Cảm xúc...</option>
                <option value="hạnh phúc 😊">Hạnh phúc 😊</option>
                <option value="hào hứng 🤩">Hào hứng 🤩</option>
                <option value="thư giãn 😌">Thư giãn 😌</option>
                <option value="tự hào 💪">Tự hào 💪</option>
                <option value="buồn nhẹ 😔">Buồn nhẹ 😔</option>
              </select>
            </div>
          </div>
          <button type="button" id="ep-toggle-preview" class="twin-btn twin-btn-secondary twin-btn-sm" style="display:none;">Xem trước HTML</button>
        </div>

        <textarea id="ep-content" class="twin-textarea" placeholder="Nội dung bài viết (gõ văn bản bình thường hoặc mã HTML)..." rows="5"></textarea>

        <div id="ep-html-preview-box" class="twin-html-preview" style="display:none;margin-top:0;">
          <div class="twin-html-preview-label">Xem trước mã HTML tự động nhận diện</div>
          <div id="ep-html-preview-body" class="twin-post-body twin-post-html" style="margin-bottom:0;"></div>
        </div>

        <div id="ep-img-box" style="display:none;position:relative;">
          <img id="ep-img-preview" class="twin-post-image" style="max-height:240px;margin-bottom:0;" alt="Ảnh bài viết" />
          <button type="button" id="ep-img-remove" class="twin-icon-btn" style="position:absolute;top:8px;right:8px;width:30px;height:30px;" title="Gỡ ảnh">✕</button>
        </div>

        <div id="ep-video-box" style="display:none;position:relative;">
          <video id="ep-video-preview" class="twin-post-video" controls playsinline preload="metadata" style="max-height:240px;border-radius:12px;"></video>
          <button type="button" id="ep-video-remove" class="twin-icon-btn" style="position:absolute;top:8px;right:8px;width:30px;height:30px;background:rgba(0,0,0,0.65);color:#fff;" title="Gỡ video">✕</button>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <label class="twin-btn twin-btn-secondary twin-btn-sm" style="cursor:pointer;">
            <span>Đổi / Thêm ảnh</span>
            <input id="ep-file-input" type="file" accept="image/*" hidden />
          </label>
          <div style="display:flex;gap:8px;">
            <button type="button" id="ep-cancel-btn" class="twin-btn twin-btn-secondary">Hủy</button>
            <button type="submit" id="ep-save-btn" class="twin-btn twin-btn-primary">Lưu thay đổi</button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => {
    backdrop.classList.remove("open");
    editingPost = null;
    editNewFile = null;
    editRemoveImage = false;
    editRemoveVideo = false;
    const vp = backdrop.querySelector("#ep-video-preview");
    if (vp) { vp.pause(); vp.removeAttribute("src"); vp.load(); }
  };
  backdrop.querySelector("#ep-close-btn").onclick = close;
  backdrop.querySelector("#ep-cancel-btn").onclick = close;

  const contentEl = backdrop.querySelector("#ep-content");
  const prevToggleBtn = backdrop.querySelector("#ep-toggle-preview");
  const prevBox = backdrop.querySelector("#ep-html-preview-box");
  const prevBody = backdrop.querySelector("#ep-html-preview-body");

  const canHtmlNow = () => getSiteSettings().allowHtmlPosts || isUserAdmin(editingUser);

  const syncHtmlAutoUi = () => {
    const detected = canHtmlNow() && containsHtmlMarkup(contentEl.value);
    prevToggleBtn.style.display = detected ? "inline-flex" : "none";
    if (!detected) {
      prevBox.style.display = "none";
    } else if (prevBox.style.display !== "none") {
      prevBody.innerHTML = sanitizeHtml(contentEl.value);
    }
  };

  prevToggleBtn.onclick = () => {
    const show = prevBox.style.display === "none";
    prevBox.style.display = show ? "block" : "none";
    if (show) prevBody.innerHTML = sanitizeHtml(contentEl.value);
  };
  contentEl.addEventListener("input", syncHtmlAutoUi);

  const fileInput = backdrop.querySelector("#ep-file-input");
  const imgBox = backdrop.querySelector("#ep-img-box");
  const imgPrev = backdrop.querySelector("#ep-img-preview");

  fileInput.onchange = () => {
    const f = fileInput.files[0];
    if (!f) return;
    editNewFile = f;
    editRemoveImage = false;
    imgPrev.src = URL.createObjectURL(f);
    imgBox.style.display = "block";
  };

  const videoBox = backdrop.querySelector("#ep-video-box");
  const videoPrev = backdrop.querySelector("#ep-video-preview");

  backdrop.querySelector("#ep-img-remove").onclick = () => {
    editNewFile = null;
    editRemoveImage = true;
    fileInput.value = "";
    imgPrev.src = "";
    imgBox.style.display = "none";
  };

  backdrop.querySelector("#ep-video-remove").onclick = () => {
    editRemoveVideo = true;
    videoPrev.pause();
    videoPrev.removeAttribute("src");
    videoPrev.load();
    videoBox.style.display = "none";
  };

  backdrop.querySelector("#ep-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    const content = contentEl.value.trim();
    const feeling = backdrop.querySelector("#ep-feeling").value;
    const hasImageAfter = Boolean(editNewFile || (!editRemoveImage && editingPost.imageUrl));
    const hasVideoAfter = Boolean(!editRemoveVideo && editingPost.videoUrl);
    if (!content && !hasImageAfter && !hasVideoAfter) {
      return showToast("Bài viết cần có nội dung, hình ảnh hoặc video.");
    }

    const saveBtn = backdrop.querySelector("#ep-save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";
    try {
      let nextImageUrl = editingPost.imageUrl || "";
      if (editNewFile) {
        nextImageUrl = await uploadToCloudinary(editNewFile);
      } else if (editRemoveImage) {
        nextImageUrl = "";
      }

      const detectedHtml = canHtmlNow() && containsHtmlMarkup(content);
      const nextPrivacy = backdrop.querySelector("#ep-privacy")?.value || "public";
      const patch = {
        content,
        isHtml: detectedHtml,
        feeling,
        privacy: nextPrivacy,
        allowedFriendUids: nextPrivacy === "friends" && Array.isArray(editingUser?.friends) ? editingUser.friends : [],
        imageUrl: nextImageUrl,
        editedAt: Date.now()
      };
      if (editRemoveVideo) {
        patch.videoUrl = "";
        patch.videoType = "";
        patch.videoPoster = "";
        patch.videoDuration = 0;
      }
      await updateDoc(doc(db, "posts", editingPost.id), patch);
      close();
      showToast("Đã cập nhật bài viết!");
    } catch (err) {
      showToast(friendlyError(err));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu thay đổi";
    }
  };

  enhanceFeelingSelect(backdrop.querySelector("#ep-feeling"));
  backdrop._syncHtmlAutoUi = syncHtmlAutoUi;
  return backdrop;
}

export function openEditPostModal(post, currentUser = null) {
  const backdrop = ensureEditModal();
  editingPost = post;
  editingUser = currentUser;
  editNewFile = null;
  editRemoveImage = false;
  editRemoveVideo = false;

  backdrop.querySelector("#ep-content").value = post.content || "";
  const epFeelEl = backdrop.querySelector("#ep-feeling");
  const matchedEpFeel = findFeelingObj(post.feeling || "");
  epFeelEl.value = matchedEpFeel ? matchedEpFeel.value : "";
  epFeelEl._syncFeelingUi?.();
  const epPriv = backdrop.querySelector("#ep-privacy");
  if (epPriv) epPriv.value = post.privacy || "public";
  backdrop.querySelector("#ep-file-input").value = "";
  backdrop.querySelector("#ep-html-preview-box").style.display = "none";
  backdrop._syncHtmlAutoUi();

  const imgBox = backdrop.querySelector("#ep-img-box");
  const imgPrev = backdrop.querySelector("#ep-img-preview");
  if (post.imageUrl) {
    imgPrev.src = post.imageUrl;
    imgBox.style.display = "block";
  } else {
    imgPrev.src = "";
    imgBox.style.display = "none";
  }

  const videoBox = backdrop.querySelector("#ep-video-box");
  const videoPrev = backdrop.querySelector("#ep-video-preview");
  if (post.videoUrl) {
    videoPrev.src = post.videoUrl;
    videoBox.style.display = "block";
  } else {
    videoPrev.pause();
    videoPrev.removeAttribute("src");
    videoPrev.load();
    videoBox.style.display = "none";
  }

  backdrop.classList.add("open");
  setTimeout(() => backdrop.querySelector("#ep-content")?.focus(), 40);
}

// ==========================================================================
// Thu gọn bài viết quá dài — chỉ hiển thị tối đa 6 dòng đầu (giữ nguyên ảnh)
// ==========================================================================
const expandedLongPosts = new Set();
const POST_COLLAPSED_MAX_LINES = 6;
const POST_PLAIN_CLAMP_CANDIDATE_CHARS = 160;
const POST_HTML_COLLAPSED_MAX_CHARS = 380;
const HTML_BLOCK_TAGS = new Set(["P", "LI", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "TR"]);

function updatePlainClampState(bodyWrap) {
  if (!bodyWrap || !bodyWrap.isConnected) return;
  const bodyEl = bodyWrap.querySelector(".twin-post-body");
  const expandBtn = bodyWrap.querySelector(".twin-post-expand-btn");
  if (!bodyEl || !expandBtn || bodyEl.clientWidth === 0) return;

  const expanded = bodyWrap.classList.contains("is-expanded");
  if (!expanded) {
    const overflows = bodyEl.scrollHeight > bodyEl.clientHeight + 2;
    expandBtn.hidden = !overflows;
  } else {
    const cs = getComputedStyle(bodyEl);
    const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14.5) * 1.55;
    const exceeds = bodyEl.scrollHeight > lineHeight * (POST_COLLAPSED_MAX_LINES + 0.45);
    expandBtn.hidden = !exceeds;
  }
}

const postBodyResizeObserver =
  typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        for (const entry of entries) {
          const el = entry.target;
          if (!el.isConnected) {
            postBodyResizeObserver.unobserve(el);
            continue;
          }
          const wrap = el.closest(".twin-post-body-wrap");
          if (wrap) updatePlainClampState(wrap);
        }
      })
    : null;

function isPlainTextClampCandidate(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return false;
  const lines = trimmed.split(/\r?\n/);
  return lines.length > POST_COLLAPSED_MAX_LINES || trimmed.length > POST_PLAIN_CLAMP_CANDIDATE_CHARS;
}

function buildCollapsedHtmlPreservingImages(safeHtml) {
  const root = document.createElement("div");
  root.innerHTML = safeHtml;
  const plainText = (root.textContent || "").trim();
  const blockCount = root.querySelectorAll("p, li, div, h1, h2, h3, h4, h5, h6, blockquote, pre, tr, br").length;
  const lineCount = plainText ? plainText.split(/\r?\n/).length : 0;
  const isLong =
    plainText.length > POST_HTML_COLLAPSED_MAX_CHARS ||
    lineCount > POST_COLLAPSED_MAX_LINES ||
    blockCount > POST_COLLAPSED_MAX_LINES;
  if (!isLong) return null;

  let remainingChars = POST_HTML_COLLAPSED_MAX_CHARS;
  let linesUsed = 0;
  let truncated = false;
  let lastTextNode = null;

  function appendEllipsisToLast() {
    if (lastTextNode && lastTextNode.nodeValue && !lastTextNode.nodeValue.trimEnd().endsWith("…")) {
      lastTextNode.nodeValue = `${lastTextNode.nodeValue.trimEnd()}…`;
    }
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.nodeValue || "";
      if (!txt) return;
      if (truncated) {
        node.nodeValue = "";
        return;
      }
      const hasVisible = txt.trim().length > 0;
      const nlMatches = txt.match(/\r?\n/g);
      const nlCount = nlMatches ? nlMatches.length : 0;

      if (linesUsed + nlCount > POST_COLLAPSED_MAX_LINES) {
        const allowNewlines = Math.max(0, POST_COLLAPSED_MAX_LINES - linesUsed);
        const parts = txt.split(/\r?\n/);
        let cut = parts.slice(0, allowNewlines + 1).join("\n");
        if (cut.length > remainingChars) {
          cut = cut.slice(0, remainingChars);
          const wsMatch = cut.search(/\s+\S*$/);
          if (wsMatch > Math.floor(remainingChars * 0.55)) cut = cut.slice(0, wsMatch);
        }
        node.nodeValue = `${cut.trimEnd()}…`;
        remainingChars = 0;
        linesUsed = POST_COLLAPSED_MAX_LINES;
        truncated = true;
        return;
      }

      if (txt.length <= remainingChars) {
        remainingChars -= txt.length;
        linesUsed += nlCount;
        if (hasVisible) lastTextNode = node;
        return;
      }

      let cut = txt.slice(0, remainingChars);
      const wsMatch = cut.search(/\s+\S*$/);
      if (wsMatch > Math.floor(remainingChars * 0.55)) {
        cut = cut.slice(0, wsMatch);
      }
      node.nodeValue = `${cut.trimEnd()}…`;
      remainingChars = 0;
      truncated = true;
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toUpperCase();
      if (tag === "IMG" || tag === "PICTURE") {
        // Không bao giờ thu gọn hay ẩn ảnh
        return;
      }
      if (tag === "BR") {
        if (truncated) {
          node.remove();
          return;
        }
        linesUsed += 1;
        if (linesUsed >= POST_COLLAPSED_MAX_LINES) {
          truncated = true;
          appendEllipsisToLast();
          node.remove();
        }
        return;
      }

      const isLeafBlock =
        HTML_BLOCK_TAGS.has(tag) &&
        !node.querySelector("p, li, div, h1, h2, h3, h4, h5, h6, blockquote, pre, tr");
      const hasDirectText = (node.textContent || "").trim().length > 0;
      if (isLeafBlock && hasDirectText) {
        if (truncated || linesUsed >= POST_COLLAPSED_MAX_LINES) {
          if (!truncated) {
            truncated = true;
            appendEllipsisToLast();
          }
          const children = Array.from(node.childNodes);
          for (const child of children) walk(child);
          const hasMedia = Boolean(node.querySelector("img, picture, video, svg"));
          if (!hasMedia) node.remove();
          return;
        }
        linesUsed += 1;
      }

      const children = Array.from(node.childNodes);
      for (const child of children) {
        walk(child);
      }
      if (truncated && tag !== "HR") {
        const hasMedia = Boolean(node.querySelector("img, picture, video, svg"));
        const hasText = (node.textContent || "").trim().length > 0;
        if (!hasMedia && !hasText) {
          node.remove();
        }
      }
    }
  }

  walk(root);
  if (!truncated) return null;
  Array.from(root.querySelectorAll("hr")).forEach((hr) => {
    if (!hr.nextElementSibling || !hr.previousElementSibling) hr.remove();
  });
  const hasInlineMedia = Boolean(root.querySelector("img, picture, video"));
  return { html: root.innerHTML, hasInlineMedia };
}

function buildPostTextContent(post) {
  const raw = post?.content ? String(post.content) : "";
  if (!raw.trim()) {
    return { isHtml: false, mode: "none", fullHtml: "", collapsedHtml: null, hasInlineMedia: false };
  }
  const renderAsHtml = Boolean(post.isHtml || containsHtmlMarkup(raw));
  if (renderAsHtml) {
    const fullHtml = sanitizeHtml(raw);
    const collapsed = buildCollapsedHtmlPreservingImages(fullHtml);
    return {
      isHtml: true,
      mode: collapsed ? "html" : "none",
      fullHtml,
      collapsedHtml: collapsed ? collapsed.html : null,
      hasInlineMedia: collapsed ? collapsed.hasInlineMedia : false
    };
  }
  const fullHtml = renderRichTextHtml(raw);
  const canClamp = isPlainTextClampCandidate(raw);
  return {
    isHtml: false,
    mode: canClamp ? "clamp" : "none",
    fullHtml,
    collapsedHtml: null,
    hasInlineMedia: false
  };
}

export function renderPostCard(post, currentUser) {
  bindPickerCloser();
  const card = document.createElement("article");
  card.className = `twin-card ${post.pinned ? "twin-pinned-card" : ""}`;
  card.id = `post-${post.id}`;

  const reactions = post.reactions || {};
  const reactionValues = Object.values(reactions);
  const guest = isGuestUser(currentUser);
  const myReactionKey = !guest && currentUser ? reactions[currentUser.uid] : null;
  const myReactionObj = REACTIONS.find((r) => r.key === myReactionKey);
  const comments = post.comments || [];
  const isOwner = Boolean(!guest && currentUser && currentUser.uid === post.authorUid);
  const canManage = Boolean(!guest && (isOwner || isUserAdmin(currentUser)));
  let isSaved = Boolean(!guest && currentUser && (currentUser.savedPosts || []).includes(post.id));
  const isPinned = Boolean(post.pinned);

  const uniqueReactionBadges = [...new Set(reactionValues)]
    .slice(0, 3)
    .map((k) => renderReactionIcon(k, "twin-rx-badge"))
    .join("");

  const displayName = post.pageName ? post.pageName : post.authorName;
  const displayAvatar = post.pageAvatar || post.authorAvatar || DEFAULT_AVATAR;

  const textState = buildPostTextContent(post);
  const isCollapsible = textState.mode !== "none";
  let isTextExpanded = Boolean(!isCollapsible || expandedLongPosts.has(post.id));
  const initialBodyInner =
    textState.mode === "html" && !isTextExpanded ? textState.collapsedHtml : textState.fullHtml;
  const bodyExtraClass =
    textState.mode === "clamp"
      ? " is-line-clamped"
      : textState.mode === "html" && !textState.hasInlineMedia
        ? " twin-post-html is-html-clamped"
        : textState.isHtml
          ? " twin-post-html"
          : "";
  const hideBtnInitially = textState.mode === "clamp" && !isTextExpanded;
  const bodyHtml = textState.fullHtml
      ? isCollapsible
        ? `<div class="twin-post-body-wrap${isTextExpanded ? " is-expanded" : " is-collapsed"}">
            <div class="twin-post-body${bodyExtraClass}">${initialBodyInner}</div>
            <button type="button" class="twin-post-expand-btn" aria-expanded="${isTextExpanded ? "true" : "false"}"${hideBtnInitially ? " hidden" : ""}>
              <span class="twin-post-expand-label">${isTextExpanded ? "Thu gọn" : "Xem thêm"}</span>
              <svg class="twin-post-expand-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>`
        : `<div class="twin-post-body${textState.isHtml ? " twin-post-html" : ""}">${textState.fullHtml}</div>`
      : "";

  card.innerHTML = `
    ${isPinned ? `<div class="twin-pin-banner">${SVG.pin}<span>Bài viết đã ghim</span></div>` : ""}

    <div class="twin-post-header">
      <a href="./profile.html?uid=${encodeURIComponent(post.authorUid)}" class="twin-post-author">
        <img class="twin-avatar" src="${escapeHtml(displayAvatar)}" alt="" />
        <div style="min-width:0;">
          <div class="twin-post-author-name">
            ${escapeHtml(displayName)}${!post.pageName ? renderAdminIconHtml(post.authorUid) : ""}
            ${post.pageName ? `<span class="twin-pill-tag" style="margin-left:4px;">Trang</span>` : ""}
            ${post.isHtml ? `<span class="twin-pill-tag" style="margin-left:4px;font-family:monospace;">HTML</span>` : ""}
            ${post.feeling ? renderFeelingBadgeHtml(post.feeling) : ""}
            ${post.groupName ? `<span style="font-weight:400;color:var(--text-3)"> trong <strong>${escapeHtml(post.groupName)}</strong></span>` : ""}
          </div>
          <div class="twin-post-meta">
            ${post.pageName ? `Đăng bởi ${escapeHtml(post.authorName)}${renderAdminIconHtml(post.authorUid)} · ` : ""}${formatTime(post.createdAt)}${post.editedAt ? " · Đã chỉnh sửa" : ""} · ${escapeHtml(getStoryPrivacyMeta(post.privacy).label)}
          </div>
        </div>
      </a>
      ${
        canManage
          ? `<div class="twin-post-tools">
              <button class="twin-icon-btn btn-pin-post" style="width:34px;height:34px;color:${isPinned ? "var(--primary)" : "var(--text-3)"};background:${isPinned ? "var(--primary-soft)" : ""};" title="${isPinned ? "Bỏ ghim bài viết" : "Ghim bài viết lên đầu"}">${SVG.pin}</button>
              <button class="twin-icon-btn btn-edit-post" style="width:34px;height:34px;color:var(--text-3);" title="Chỉnh sửa bài viết">${SVG.edit}</button>
              <button class="twin-icon-btn btn-del-post" style="width:34px;height:34px;color:var(--text-3);" title="Xóa bài viết">${SVG.trash}</button>
            </div>`
          : ""
      }
    </div>

    ${bodyHtml}
    ${(() => {
      const imgs = getPostImages(post);
      if (!imgs.length) return "";
      if (imgs.length === 1) {
        return `<img class="twin-post-image twin-post-album-trigger" data-idx="0" src="${escapeHtml(imgs[0])}" alt="Ảnh bài viết" loading="lazy" />`;
      }
      const shown = imgs.slice(0, 4);
      const extra = imgs.length - 4;
      const cls = `count-${Math.min(imgs.length, 4)}`;
      return `
        <div class="twin-album-post-grid ${cls}">
          ${shown
            .map(
              (url, i) => `
            <button type="button" class="twin-album-post-item twin-post-album-trigger" data-idx="${i}" aria-label="Xem ảnh ${i + 1}/${imgs.length}">
              <img src="${escapeHtml(url)}" alt="Ảnh ${i + 1}" loading="lazy" />
              ${i === 3 && extra > 0 ? `<span class="twin-album-more-badge">+${extra}</span>` : ""}
            </button>`
            )
            .join("")}
        </div>
      `;
    })()}
    ${
      post.videoUrl
        ? (() => {
            const poster = post.videoPoster || getVideoPosterUrl(post.videoUrl);
            const durText = post.videoDuration ? formatDuration(post.videoDuration) : "";
            const vw = Number(post.videoWidth) || 0;
            const vh = Number(post.videoHeight) || 0;
            const initPortrait = vw > 0 && vh > 0 ? vh > vw * 1.05 : false;
            const initClass = vw > 0 && vh > 0 ? (initPortrait ? " is-portrait" : " is-landscape") : "";
            const initStyle =
              vw > 0 && vh > 0
                ? ` style="--video-ar:${vw} / ${vh};--video-ratio:${(vw / vh).toFixed(4)};"`
                : "";
            return `
              <div class="twin-post-video-wrap${initClass}"${initStyle}>
                <div class="twin-post-video-top">
                  <span class="twin-post-video-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    <span>Video${durText ? ` · ${escapeHtml(durText)}` : ""}</span>
                  </span>
                  <a href="./reels.html?id=${encodeURIComponent(post.id)}" class="twin-post-video-reel-link">Xem trong Video</a>
                </div>
                <video
                  class="twin-post-video"
                  src="${escapeHtml(post.videoUrl)}"
                  ${poster ? `poster="${escapeHtml(poster)}"` : ""}
                  controls
                  playsinline
                  preload="metadata"
                ></video>
              </div>
            `;
          })()
        : ""
    }

    <div class="twin-post-stats">
      <div class="twin-stats-reacts">${reactionValues.length > 0 ? `<span class="twin-rx-stack">${uniqueReactionBadges}</span><span>${reactionValues.length}</span>` : "Chưa có cảm xúc"}</div>
      <div class="twin-stats-metrics">
        <span>${comments.length} bình luận</span>
        <span aria-hidden="true">·</span>
        <span class="post-shares-count">${Number(post.sharesCount) || 0} chia sẻ</span>
        <span aria-hidden="true">·</span>
        <span class="post-saves-count">${Array.isArray(post.savedBy) ? post.savedBy.length : 0} lượt lưu</span>
      </div>
    </div>

    <div class="twin-post-actions twin-post-actions-icons">
      <div class="twin-react-wrap">
        <div class="twin-react-picker">
          ${REACTIONS.map((r) => `<button type="button" class="twin-react-emoji" data-react="${r.key}" title="${r.label}" aria-label="${r.label}"><img class="twin-rx-picker-img" src="${r.icon}" alt="${r.label}" draggable="false" /><span class="twin-react-tip">${r.label}</span></button>`).join("")}
        </div>
        <button type="button" class="twin-action-btn btn-main-react ${myReactionObj ? "reacted" : ""}" style="width:100%;" title="${myReactionObj ? myReactionObj.label : "Thả cảm xúc"}" aria-label="${myReactionObj ? myReactionObj.label : "Thả cảm xúc"}">
          ${myReactionObj ? renderReactionIcon(myReactionObj.key, "twin-rx-active-img") : SVG.like}
        </button>
      </div>
      <button type="button" class="twin-action-btn btn-toggle-cmt" title="Bình luận" aria-label="Bình luận">${SVG.comment}</button>
      <button type="button" class="twin-action-btn btn-share-post" title="Chia sẻ" aria-label="Chia sẻ">${SVG.share}</button>
      <button type="button" class="twin-action-btn btn-save-post ${isSaved ? "reacted" : ""}" title="${isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}" aria-label="${isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}">${isSaved ? SVG.saveFilled : SVG.save}</button>
    </div>

    <div class="twin-comments" style="display:${comments.length ? "block" : "none"}">
      <div class="twin-comments-list">
        ${comments
          .map(
            (c) => `
          <div class="twin-comment-item">
            <a href="./profile.html?uid=${encodeURIComponent(c.authorUid || "")}" class="twin-avatar-link" title="Xem trang cá nhân">
              <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(c.authorAvatar || DEFAULT_AVATAR)}" alt="" />
            </a>
            <div class="twin-comment-bubble">
              <a href="./profile.html?uid=${encodeURIComponent(c.authorUid || "")}" style="font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:4px;">${escapeHtml(c.authorName)}${renderAdminIconHtml(c.authorUid)}</a>
              <div>${renderRichTextHtml(c.text)}</div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      ${
        guest
          ? `<div class="twin-guest-inline-note">Chế độ Khách chỉ xem bình luận. <a href="./login.html">Đăng nhập</a> để bình luận.</div>`
          : `<form class="twin-comment-form">
              <input class="twin-input" type="text" placeholder="Viết bình luận..." required maxlength="1000" style="padding:8px 14px;" />
              <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit">Gửi</button>
            </form>`
      }
    </div>
  `;

  if (isCollapsible) {
    const bodyWrap = card.querySelector(".twin-post-body-wrap");
    const bodyEl = bodyWrap?.querySelector(".twin-post-body");
    const expandBtn = bodyWrap?.querySelector(".twin-post-expand-btn");
    const expandLabel = expandBtn?.querySelector(".twin-post-expand-label");
    if (bodyWrap && bodyEl && expandBtn && expandLabel) {
      if (textState.mode === "clamp") {
        postBodyResizeObserver?.observe(bodyEl);
        requestAnimationFrame(() => updatePlainClampState(bodyWrap));
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => updatePlainClampState(bodyWrap));
        }
      }
      expandBtn.addEventListener("click", () => {
        isTextExpanded = !isTextExpanded;
        if (isTextExpanded) {
          expandedLongPosts.add(post.id);
          if (textState.mode === "html") bodyEl.innerHTML = textState.fullHtml;
        } else {
          expandedLongPosts.delete(post.id);
          if (textState.mode === "html") bodyEl.innerHTML = textState.collapsedHtml;
        }
        bodyWrap.classList.toggle("is-expanded", isTextExpanded);
        bodyWrap.classList.toggle("is-collapsed", !isTextExpanded);
        expandBtn.setAttribute("aria-expanded", isTextExpanded ? "true" : "false");
        expandLabel.textContent = isTextExpanded ? "Thu gọn" : "Xem thêm";
        if (textState.mode === "clamp") {
          requestAnimationFrame(() => updatePlainClampState(bodyWrap));
        }
        if (!isTextExpanded) {
          const rect = card.getBoundingClientRect();
          if (rect.top < 72) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      });
    }
  }

  const postVideoWrap = card.querySelector(".twin-post-video-wrap");
  const postVideoEl = postVideoWrap?.querySelector("video.twin-post-video");
  if (postVideoWrap && postVideoEl) {
    const syncPostVideoOrientation = () => {
      const vw = postVideoEl.videoWidth || Number(post.videoWidth) || 0;
      const vh = postVideoEl.videoHeight || Number(post.videoHeight) || 0;
      if (!vw || !vh) return;
      const ratio = vw / vh;
      const isPortrait = vh > vw * 1.05;
      postVideoWrap.style.setProperty("--video-ar", `${vw} / ${vh}`);
      postVideoWrap.style.setProperty("--video-ratio", String(ratio));
      postVideoWrap.classList.toggle("is-portrait", isPortrait);
      postVideoWrap.classList.toggle("is-landscape", !isPortrait);
    };
    if (postVideoEl.readyState >= 1) syncPostVideoOrientation();
    postVideoEl.addEventListener("loadedmetadata", syncPostVideoOrientation);
  }

  const postImgs = getPostImages(post);
  if (postImgs.length) {
    const plainCap = post.content ? String(post.content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140) : "";
    const lbList = postImgs.map((url) => ({ type: "image", url, caption: plainCap }));
    card.querySelectorAll(".twin-post-album-trigger").forEach((el) => {
      el.addEventListener("click", () => {
        openMediaLightbox(lbList, Number(el.dataset.idx) || 0, post.authorName ? `Ảnh của ${post.authorName}` : "Album ảnh");
      });
    });
  }

  const postLink = `./index.html#post-${post.id}`;

  async function setReaction(key) {
    if (!requireMemberAction(currentUser, "thả cảm xúc")) return;
    const ref = doc(db, "posts", post.id);
    if (reactions[currentUser.uid] === key) {
      await safe(() => updateDoc(ref, { [`reactions.${currentUser.uid}`]: deleteField() }));
    } else {
      await safe(async () => {
        await updateDoc(ref, { [`reactions.${currentUser.uid}`]: key });
        const reactObj = REACTIONS.find((r) => r.key === key);
        pushNotification(post.authorUid, {
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar || DEFAULT_AVATAR,
          type: "reaction",
          postId: post.id,
          text: `đã bày tỏ cảm xúc ${reactObj ? reactObj.emoji : ""} về bài viết của bạn.`,
          link: postLink
        }).catch((err) => console.warn("Reaction notification:", err));
      });
    }
  }

  const wrap = card.querySelector(".twin-react-wrap");
  const mainBtn = card.querySelector(".btn-main-react");
  let pressTimer = null;
  let longPressed = false;
  mainBtn.addEventListener("touchstart", () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      wrap.classList.add("open");
    }, 450);
  }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach((ev) =>
    mainBtn.addEventListener(ev, () => clearTimeout(pressTimer), { passive: true })
  );
  mainBtn.addEventListener("contextmenu", (e) => { if (longPressed) e.preventDefault(); });
  mainBtn.onclick = () => {
    if (longPressed) { longPressed = false; return; }
    setReaction(myReactionKey || "love");
  };
  card.querySelectorAll(".twin-react-emoji").forEach((btn) => {
    btn.onclick = () => {
      wrap.classList.remove("open");
      setReaction(btn.dataset.react);
    };
  });

  card.querySelector(".btn-toggle-cmt").onclick = () => {
    const box = card.querySelector(".twin-comments");
    box.style.display = box.style.display === "none" ? "block" : "none";
    if (box.style.display !== "none") box.querySelector("input")?.focus();
  };

  const cmtForm = card.querySelector(".twin-comment-form");
  if (cmtForm) cmtForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!requireMemberAction(currentUser, "bình luận")) return;
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    const newCmt = {
      id: Date.now().toString(),
      authorUid: currentUser.uid,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar || DEFAULT_AVATAR,
      text,
      createdAt: Date.now()
    };
    try {
      await updateDoc(doc(db, "posts", post.id), { comments: arrayUnion(newCmt) });
    } catch (err) {
      console.error(err);
      input.value = text;
      showToast(friendlyError(err));
      return;
    }
    const commentLink = `./index.html?comment=1#post-${post.id}`;
    if (post.authorUid && post.authorUid !== currentUser.uid) {
      pushNotification(post.authorUid, {
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar || DEFAULT_AVATAR,
        type: "comment",
        postId: post.id,
        text: `đã bình luận bài viết của bạn: "${text.slice(0, 45)}"`,
        link: commentLink
      }).catch((err) => console.warn("Comment notification:", err));
    }

    const otherCommenters = [...new Set(
      comments
        .map((c) => c.authorUid)
        .filter((uid) => uid && uid !== currentUser.uid && uid !== post.authorUid)
    )].slice(-8);

    otherCommenters.forEach((uid) => {
      pushNotification(uid, {
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar || DEFAULT_AVATAR,
        type: "comment",
        postId: post.id,
        text: `cũng đã bình luận: "${text.slice(0, 40)}"`,
        link: commentLink
      }).catch((err) => console.warn("Thread comment notification:", err));
    });
  };

  let localSharesCount = Number(post.sharesCount) || 0;
  let localSavesCount = Array.isArray(post.savedBy) ? post.savedBy.length : 0;
  const sharesCountEl = card.querySelector(".post-shares-count");
  const savesCountEl = card.querySelector(".post-saves-count");

  card.querySelector(".btn-share-post").onclick = async () => {
    const base = new URL("./index.html", window.location.href);
    base.search = "";
    base.hash = `post-${post.id}`;
    try {
      await navigator.clipboard.writeText(base.href);
      showToast("Đã sao chép liên kết bài viết!");
    } catch {
      window.prompt("Sao chép liên kết bài viết:", base.href);
    }
    if (!guest && currentUser?.uid) {
      localSharesCount += 1;
      if (sharesCountEl) sharesCountEl.textContent = `${localSharesCount} chia sẻ`;
      updateDoc(doc(db, "posts", post.id), { sharesCount: increment(1) }).catch(() => {});
    }
  };

  const saveBtn = card.querySelector(".btn-save-post");
  saveBtn.onclick = async () => {
    if (!requireMemberAction(currentUser, "lưu bài viết")) return;
    const wasSaved = isSaved;
    const paint = () => {
      saveBtn.classList.toggle("reacted", isSaved);
      saveBtn.innerHTML = isSaved ? SVG.saveFilled : SVG.save;
      const tip = isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết";
      saveBtn.title = tip;
      saveBtn.setAttribute("aria-label", tip);
      if (savesCountEl) savesCountEl.textContent = `${Math.max(0, localSavesCount)} lượt lưu`;
    };
    isSaved = !wasSaved;
    localSavesCount = Math.max(0, localSavesCount + (isSaved ? 1 : -1));
    paint();
    const list = Array.isArray(currentUser.savedPosts) ? currentUser.savedPosts : (currentUser.savedPosts = []);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        savedPosts: wasSaved ? arrayRemove(post.id) : arrayUnion(post.id)
      });
      updateDoc(doc(db, "posts", post.id), {
        savedBy: wasSaved ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      }).catch(() => {});
      if (wasSaved) {
        const i = list.indexOf(post.id);
        if (i >= 0) list.splice(i, 1);
      } else if (!list.includes(post.id)) {
        list.push(post.id);
      }
      showToast(wasSaved ? "Đã bỏ lưu bài viết." : "Đã lưu bài viết!");
    } catch (err) {
      console.error(err);
      isSaved = wasSaved;
      localSavesCount = Math.max(0, localSavesCount + (wasSaved ? 1 : -1));
      paint();
      showToast(friendlyError(err));
    }
  };

  const pinBtn = card.querySelector(".btn-pin-post");
  if (pinBtn) {
    pinBtn.onclick = async () => {
      const nextPin = !isPinned;
      await safe(async () => {
        await updateDoc(doc(db, "posts", post.id), {
          pinned: nextPin,
          pinnedAt: nextPin ? Date.now() : 0
        });
        showToast(nextPin ? "Đã ghim bài viết lên đầu!" : "Đã bỏ ghim bài viết.");
      });
    };
  }

  const editBtn = card.querySelector(".btn-edit-post");
  if (editBtn) {
    editBtn.onclick = () => openEditPostModal(post, currentUser);
  }

  const delBtn = card.querySelector(".btn-del-post");
  if (delBtn) {
    delBtn.onclick = async () => {
      if (!confirm("Xóa bài viết này?")) return;
      await safe(async () => {
        await deleteDoc(doc(db, "posts", post.id));
        showToast("Đã xóa bài viết.");
      });
    };
  }

  return card;
}

const listCache = new WeakMap();
let hashHandled = false;

function postSignature(p, currentUser) {
  const saved = !!(currentUser && (currentUser.savedPosts || []).includes(p.id));
  const canManage = Boolean(currentUser && (currentUser.uid === p.authorUid || isUserAdmin(currentUser)));
  return JSON.stringify([
    p.content, Boolean(p.isHtml), p.privacy || "public", p.imageUrl, Array.isArray(p.imageUrls) ? p.imageUrls.join("|") : "", p.videoUrl || "", p.videoType || "", p.videoDuration || 0,
    p.feeling, p.groupName, p.pageName, p.authorName, p.authorAvatar,
    Boolean(p.pinned), p.pinnedAt || 0, p.editedAt || 0,
    Number(p.sharesCount) || 0, Array.isArray(p.savedBy) ? p.savedBy.length : 0,
    p.reactions || {}, (p.comments || []).map((c) => c.id), toMillis(p.createdAt), saved, canManage
  ]);
}

export function renderPostList(container, posts, currentUser, emptyHtml = "") {
  let map = listCache.get(container);
  if (!map) {
    map = new Map();
    listCache.set(container, map);
  }
  if (!posts.length) {
    container.innerHTML = emptyHtml;
    map.clear();
    return;
  }
  [...container.children].forEach((ch) => { if (!ch.dataset.postId) ch.remove(); });

  const seen = new Set();
  let prev = null;
  posts.forEach((p) => {
    const sig = postSignature(p, currentUser);
    let entry = map.get(p.id);
    if (!entry || entry.sig !== sig) {
      const card = renderPostCard(p, currentUser);
      card.dataset.postId = p.id;
      if (entry) {
        const oldBox = entry.card.querySelector(".twin-comments");
        const oldInput = entry.card.querySelector(".twin-comment-form input");
        const newBox = card.querySelector(".twin-comments");
        const newInput = card.querySelector(".twin-comment-form input");
        if (oldBox && newBox && oldBox.style.display !== "none") newBox.style.display = "block";
        if (oldInput && newInput && oldInput.value) newInput.value = oldInput.value;
        const hadFocus = oldInput && document.activeElement === oldInput;
        if (entry.card.parentNode === container) container.replaceChild(card, entry.card);
        if (hadFocus && newInput) newInput.focus();
      }
      entry = { card, sig };
      map.set(p.id, entry);
    }
    seen.add(p.id);
    const want = prev ? prev.nextSibling : container.firstChild;
    if (entry.card !== want) container.insertBefore(entry.card, want);
    prev = entry.card;
  });
  for (const [id, e] of map) {
    if (!seen.has(id)) {
      e.card.remove();
      map.delete(id);
    }
  }

  if (!hashHandled && window.location.hash.startsWith("#post-")) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) {
      hashHandled = true;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("twin-highlight");
      setTimeout(() => target.classList.remove("twin-highlight"), 2400);
    }
  }
}

// ==========================================================================
// Reusable Full-Featured Post Composer (dùng trên Trang cá nhân giống Bảng tin)
// ==========================================================================
export function mountPostComposer(container, currentUser, { isProfilePage = false, onAvatarClick = null, groupId = "", groupName = "" } = {}) {
  if (!container || !currentUser || isGuestUser(currentUser)) return null;

  container.innerHTML = `
    <section class="twin-card twin-composer-card" id="pf-composer-card">
      <div class="twin-composer-bar">
        <div class="twin-composer-pills">
          <div class="twin-feeling-pill twin-privacy-pill" title="Quyền xem bài đăng">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19Z"/></svg>
            <select id="pfc-privacy" class="twin-feeling-select" aria-label="Quyền xem bài đăng">
              <option value="public">Công khai</option>
              <option value="friends">Bạn bè</option>
              <option value="private">Riêng tư</option>
            </select>
          </div>
          <div class="twin-feeling-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/></svg>
            <select id="pfc-feeling" class="twin-feeling-select" aria-label="Cảm xúc bài viết">
              <option value="">Cảm xúc...</option>
              <option value="hạnh phúc 😊">Hạnh phúc 😊</option>
              <option value="hào hứng 🤩">Hào hứng 🤩</option>
              <option value="thư giãn 😌">Thư giãn 😌</option>
              <option value="tự hào 💪">Tự hào 💪</option>
              <option value="buồn nhẹ 😔">Buồn nhẹ 😔</option>
            </select>
          </div>
        </div>
        <div class="twin-composer-bar-right">
          <button type="button" id="pfc-html-preview-btn" class="twin-btn twin-btn-secondary twin-btn-sm" style="display:none;">Xem trước HTML</button>
          <button type="button" id="pfc-collapse" class="twin-icon-btn twin-composer-collapse" title="Thu gọn" aria-label="Thu gọn khung đăng bài">✕</button>
        </div>
      </div>

      <div class="twin-composer-top">
        ${
          isProfilePage
            ? `<button type="button" id="pfc-avatar-trigger" class="twin-composer-avatar-link" title="Xem ảnh đại diện" aria-label="Xem ảnh đại diện">
                <img class="twin-avatar" id="pfc-avatar" src="${escapeHtml(currentUser.avatar || DEFAULT_AVATAR)}" alt="" />
              </button>`
            : `<a href="./profile.html" class="twin-composer-avatar-link" title="Xem trang cá nhân" aria-label="Xem trang cá nhân">
                <img class="twin-avatar" id="pfc-avatar" src="${escapeHtml(currentUser.avatar || DEFAULT_AVATAR)}" alt="" />
              </a>`
        }
        <textarea id="pfc-content" class="twin-textarea" rows="1" placeholder="${escapeHtml((String(currentUser.name || "").trim().split(/\s+/).pop() || "Bạn") + " ơi, bạn đang nghĩ gì thế?")}"></textarea>
        <div class="twin-composer-quick-icons">
          <label for="pfc-file" class="twin-composer-quick-btn" title="Thêm ảnh / album" aria-label="Thêm ảnh / album">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2.5" fill="#45bd62" opacity="0.28"/><rect x="6" y="4" width="15" height="15" rx="3" fill="#45bd62"/><circle cx="10.5" cy="9" r="1.6" fill="#ffffff"/><path d="M7.8 16.5 11.4 12.6a1 1 0 0 1 1.45 0l1.95 2.05 1.45-1.5a1 1 0 0 1 1.45 0l2 2.15v1.2H7.8Z" fill="#ffffff"/></svg>
          </label>
          <label for="pfc-video" id="pfc-quick-video-btn" class="twin-composer-quick-btn" title="Thêm video" aria-label="Thêm video">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4" fill="#f3425f"/><path d="M3 9h18" stroke="#ffffff" stroke-width="1.6"/><path d="M8.5 4 10.5 9M14 4l2 5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/><polygon points="10.2 11.8 15.6 14.8 10.2 17.8 10.2 11.8" fill="#ffffff"/></svg>
          </label>
        </div>
      </div>

      <div class="twin-composer-extras">
        <div id="pfc-html-preview-wrap" class="twin-html-preview" style="display:none;">
          <div class="twin-html-preview-label">Xem trước mã HTML tự động nhận diện</div>
          <div id="pfc-html-preview-body" class="twin-post-body twin-post-html" style="margin-bottom:0;"></div>
        </div>

        <div id="pfc-preview-wrap" style="margin-top:10px;display:none;">
          <div class="twin-composer-album-head">
            <span id="pfc-album-count" class="twin-post-meta" style="font-weight:700;"></span>
            <button id="pfc-preview-remove" type="button" class="twin-btn twin-btn-ghost twin-btn-sm" style="padding:3px 9px;color:var(--danger);">Xóa tất cả ảnh</button>
          </div>
          <div id="pfc-album-grid" class="twin-composer-album-grid"></div>
        </div>

        <div id="pfc-video-preview-wrap" class="twin-composer-video-preview" style="margin-top:10px;display:none;position:relative;">
          <div class="twin-video-mode-bar">
            <span class="twin-post-meta" id="pfc-video-meta" style="font-weight:600;"></span>
          </div>
          <video id="pfc-preview-video" class="twin-post-video" controls playsinline muted></video>
          <button id="pfc-video-remove" type="button" class="twin-icon-btn" style="position:absolute;top:8px;right:8px;width:30px;height:30px;background:rgba(0,0,0,0.65);color:#fff;" title="Bỏ video">✕</button>
        </div>

        <div id="pfc-upload-progress" class="twin-upload-progress" style="display:none;">
          <div class="twin-upload-progress-track">
            <div id="pfc-upload-progress-fill" class="twin-upload-progress-fill" style="width:0%"></div>
          </div>
          <span id="pfc-upload-progress-text" class="twin-post-meta">Đang tải lên 0%...</span>
        </div>
      </div>

      <div class="twin-composer-actions">
        <div class="twin-composer-media-btns">
          <label class="twin-btn twin-btn-secondary twin-btn-sm twin-media-btn-photo" style="cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L5 19"/></svg>
            <span>Ảnh / Album</span>
            <input id="pfc-file" type="file" accept="image/*" multiple hidden />
          </label>
          <label class="twin-btn twin-btn-secondary twin-btn-sm twin-media-btn-video" id="pfc-video-label" style="cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5.5" width="14" height="13" rx="2.5"/><path d="m16.5 10 5-3v10l-5-3"/></svg>
            <span>Video</span>
            <input id="pfc-video" type="file" accept="video/*" hidden />
          </label>
        </div>
        <button id="pfc-publish" type="button" class="twin-btn twin-btn-primary">Đăng bài</button>
      </div>
    </section>
  `;

  const card = container.querySelector("#pf-composer-card");
  const contentEl = container.querySelector("#pfc-content");
  const privacyEl = container.querySelector("#pfc-privacy");
  const feelingEl = container.querySelector("#pfc-feeling");
  enhanceFeelingSelect(feelingEl);
  const htmlBtn = container.querySelector("#pfc-html-preview-btn");
  const htmlWrap = container.querySelector("#pfc-html-preview-wrap");
  const htmlBody = container.querySelector("#pfc-html-preview-body");
  const fileInput = container.querySelector("#pfc-file");
  const previewWrap = container.querySelector("#pfc-preview-wrap");
  const albumGrid = container.querySelector("#pfc-album-grid");
  const albumCountEl = container.querySelector("#pfc-album-count");
  const videoLabel = container.querySelector("#pfc-video-label");
  const videoInput = container.querySelector("#pfc-video");
  const videoWrap = container.querySelector("#pfc-video-preview-wrap");
  const previewVideo = container.querySelector("#pfc-preview-video");
  const videoMeta = container.querySelector("#pfc-video-meta");
  const progressEl = container.querySelector("#pfc-upload-progress");
  const progressFill = container.querySelector("#pfc-upload-progress-fill");
  const progressText = container.querySelector("#pfc-upload-progress-text");
  const publishBtn = container.querySelector("#pfc-publish");
  const avatarTrigger = container.querySelector("#pfc-avatar-trigger");

  let selectedFiles = [];
  let selectedVideoFile = null;
  let selectedVideoDuration = 0;
  let selectedVideoObjUrl = "";

  if (avatarTrigger && typeof onAvatarClick === "function") {
    avatarTrigger.onclick = (e) => {
      e.stopPropagation();
      onAvatarClick();
    };
  }

  const syncPolicy = () => {
    const cfg = getSiteSettings();
    const allowVid = cfg.allowVideoPosts || isUserAdmin(currentUser);
    if (videoLabel) videoLabel.style.display = allowVid ? "inline-flex" : "none";
    const qVid = container.querySelector("#pfc-quick-video-btn");
    if (qVid) qVid.style.display = allowVid ? "inline-grid" : "none";
  };
  syncPolicy();
  window.addEventListener("twin-site-settings-changed", syncPolicy);

  const canUseHtml = () => getSiteSettings().allowHtmlPosts || isUserAdmin(currentUser);
  const syncHtml = () => {
    const detected = canUseHtml() && containsHtmlMarkup(contentEl.value);
    htmlBtn.style.display = detected ? "inline-flex" : "none";
    if (!detected) {
      htmlWrap.style.display = "none";
    } else if (htmlWrap.style.display !== "none") {
      htmlBody.innerHTML = sanitizeHtml(contentEl.value);
    }
  };

  htmlBtn.onclick = () => {
    const show = htmlWrap.style.display === "none";
    htmlWrap.style.display = show ? "block" : "none";
    if (show) htmlBody.innerHTML = sanitizeHtml(contentEl.value);
  };
  contentEl.addEventListener("input", syncHtml);

  const expand = (focus = false) => {
    if (!card.classList.contains("expanded")) card.classList.add("expanded");
    if (focus) setTimeout(() => contentEl.focus(), 10);
  };
  const collapse = () => {
    card.classList.remove("expanded");
    htmlWrap.style.display = "none";
  };
  card.addEventListener("click", (e) => {
    if (e.target.closest(".twin-composer-avatar-link") || e.target.closest(".twin-composer-quick-icons")) return;
    if (!card.classList.contains("expanded")) expand(true);
  });
  contentEl.addEventListener("focus", () => expand(false));
  container.querySelector("#pfc-collapse").onclick = (e) => {
    e.stopPropagation();
    collapse();
  };

  const renderAlbumPreview = () => {
    albumGrid.innerHTML = "";
    if (!selectedFiles.length) {
      previewWrap.style.display = "none";
      return;
    }
    previewWrap.style.display = "block";
    albumCountEl.textContent = selectedFiles.length > 1 ? `Album ${selectedFiles.length} ảnh` : "1 ảnh đã chọn";
    selectedFiles.forEach((item, idx) => {
      const tile = document.createElement("div");
      tile.className = "twin-composer-album-tile";
      tile.innerHTML = `
        <img src="${item.url}" alt="Ảnh ${idx + 1}" />
        <button type="button" class="twin-composer-album-del" title="Bỏ ảnh này" aria-label="Bỏ ảnh này">✕</button>
      `;
      tile.querySelector(".twin-composer-album-del").onclick = () => {
        URL.revokeObjectURL(item.url);
        selectedFiles.splice(idx, 1);
        renderAlbumPreview();
      };
      albumGrid.appendChild(tile);
    });
  };

  const clearMedia = () => {
    selectedFiles.forEach((it) => URL.revokeObjectURL(it.url));
    selectedFiles = [];
    fileInput.value = "";
    albumGrid.innerHTML = "";
    previewWrap.style.display = "none";
    if (selectedVideoObjUrl) {
      URL.revokeObjectURL(selectedVideoObjUrl);
      selectedVideoObjUrl = "";
    }
    selectedVideoFile = null;
    selectedVideoDuration = 0;
    videoInput.value = "";
    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideo.load();
    videoWrap.style.display = "none";
    videoMeta.textContent = "";
  };

  fileInput.onchange = () => {
    const picked = [...(fileInput.files || [])].filter((f) => f && f.type && f.type.startsWith("image/"));
    fileInput.value = "";
    if (!picked.length) return;
    if (selectedVideoFile) {
      if (selectedVideoObjUrl) { URL.revokeObjectURL(selectedVideoObjUrl); selectedVideoObjUrl = ""; }
      selectedVideoFile = null;
      selectedVideoDuration = 0;
      videoInput.value = "";
      previewVideo.pause();
      previewVideo.removeAttribute("src");
      previewVideo.load();
      videoWrap.style.display = "none";
      videoMeta.textContent = "";
    }
    const remaining = Math.max(0, 10 - selectedFiles.length);
    if (picked.length > remaining) {
      showToast("Mỗi bài viết hỗ trợ tối đa 10 ảnh trong album.");
    }
    picked.slice(0, remaining).forEach((f) => {
      selectedFiles.push({ file: f, url: URL.createObjectURL(f) });
    });
    renderAlbumPreview();
    expand(false);
  };
  container.querySelector("#pfc-preview-remove").onclick = clearMedia;

  videoInput.onchange = async () => {
    const f = videoInput.files[0] || null;
    clearMedia();
    if (!f) return;
    if (!f.type || !f.type.startsWith("video/")) {
      showToast("Vui lòng chọn tệp video hợp lệ (MP4, MOV, WebM...).");
      return;
    }
    const maxMb = getSiteSettings().maxVideoSizeMb || 100;
    if (f.size > maxMb * 1024 * 1024) {
      showToast(`Video quá lớn (giới hạn hiện tại ${maxMb}MB).`);
      return;
    }
    selectedVideoFile = f;
    selectedVideoObjUrl = URL.createObjectURL(f);
    previewVideo.src = selectedVideoObjUrl;
    videoWrap.style.display = "flex";
    const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
    videoMeta.textContent = `${f.name} · ${sizeMb} MB`;
    expand(false);

    const meta = await readVideoMetadata(f);
    if (selectedVideoFile !== f) return;
    selectedVideoDuration = meta.duration || 0;
    videoMeta.textContent = `${meta.duration ? `${formatDuration(meta.duration)} · ` : ""}${sizeMb} MB`;
  };
  container.querySelector("#pfc-video-remove").onclick = clearMedia;

  publishBtn.onclick = async () => {
    const cfg = getSiteSettings();
    if (cfg.readOnlyMode && !isUserAdmin(currentUser)) {
      return showToast("Hệ thống đang ở chế độ chỉ đọc. Chỉ Admin được đăng bài mới.");
    }
    const content = contentEl.value.trim();
    const feeling = feelingEl.value;
    if (!content && !selectedFiles.length && !selectedVideoFile) {
      return showToast("Hãy nhập nội dung hoặc chọn ảnh / video.");
    }
    if (selectedVideoFile && !cfg.allowVideoPosts && !isUserAdmin(currentUser)) {
      return showToast("Admin đang tạm tắt đăng video bài viết.");
    }

    publishBtn.disabled = true;
    publishBtn.textContent = selectedVideoFile ? "Đang tải video..." : (selectedFiles.length > 1 ? "Đang tải album..." : "Đang đăng...");
    try {
      let imageUrl = "";
      let imageUrls = [];
      let videoUrl = "";
      let videoType = "";
      let videoDuration = 0;
      let videoPoster = "";
      if (selectedFiles.length) {
        if (selectedFiles.length > 1) {
          progressEl.style.display = "flex";
        }
        for (let i = 0; i < selectedFiles.length; i++) {
          if (selectedFiles.length > 1) {
            const pct = Math.round((i / selectedFiles.length) * 100);
            progressFill.style.width = `${pct}%`;
            progressText.textContent = `Đang tải ảnh ${i + 1}/${selectedFiles.length}...`;
            publishBtn.textContent = `Đang tải ${i + 1}/${selectedFiles.length}...`;
          }
          const url = await uploadToCloudinary(selectedFiles[i].file);
          if (url) imageUrls.push(url);
        }
        imageUrl = imageUrls[0] || "";
        if (selectedFiles.length > 1) {
          progressFill.style.width = "100%";
        }
      } else if (selectedVideoFile) {
        progressEl.style.display = "flex";
        progressFill.style.width = "0%";
        progressText.textContent = "Đang tải video 0%...";
        const uploaded = await uploadVideoToCloudinary(
          selectedVideoFile,
          (pct) => {
            progressFill.style.width = `${pct}%`;
            progressText.textContent = `Đang tải video ${pct}%...`;
            publishBtn.textContent = `Đang tải ${pct}%...`;
          },
          { maxSizeMb: cfg.maxVideoSizeMb || 100 }
        );
        videoUrl = uploaded.url;
        videoType = "video";
        videoDuration = uploaded.duration || selectedVideoDuration || 0;
        videoPoster = uploaded.poster || "";
      }

      const isHtml = canUseHtml() && containsHtmlMarkup(content);
      const privacy = privacyEl?.value || "public";
      const postPayload = {
        authorUid: currentUser.uid,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar || DEFAULT_AVATAR,
        content,
        isHtml,
        feeling,
        privacy,
        allowedFriendUids: privacy === "friends" && Array.isArray(currentUser.friends) ? currentUser.friends : [],
        imageUrl,
        imageUrls,
        videoUrl,
        videoType,
        videoDuration,
        videoPoster,
        pinned: false,
        reactions: {},
        comments: [],
        savedBy: [],
        sharesCount: 0,
        createdAt: serverTimestamp()
      };
      if (groupId) {
        postPayload.groupId = groupId;
        postPayload.groupName = groupName;
      }
      await addDoc(collection(db, "posts"), postPayload);

      contentEl.value = "";
      feelingEl.value = "";
      feelingEl._syncFeelingUi?.();
      if (privacyEl) privacyEl.value = "public";
      syncHtml();
      htmlWrap.style.display = "none";
      clearMedia();
      collapse();
      showToast(videoUrl ? "Đã đăng video!" : "Đã đăng bài!");
    } catch (err) {
      showToast(friendlyError(err));
    } finally {
      progressEl.style.display = "none";
      progressFill.style.width = "0%";
      publishBtn.disabled = false;
      publishBtn.textContent = "Đăng bài";
    }
  };

  return {
    updateAvatar(url) {
      const img = container.querySelector("#pfc-avatar");
      if (img) img.src = url || DEFAULT_AVATAR;
    }
  };
}
