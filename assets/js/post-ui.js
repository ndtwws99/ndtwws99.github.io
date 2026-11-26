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
    key: "like",
    emoji: "👍",
    label: "Thích",
    color: "#1877f2",
    icon: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="55%" stop-color="#1877f2"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#g)"/><ellipse cx="24" cy="14" rx="14" ry="7" fill="#fff" opacity=".26"/><path d="M18 30h6v18h-6a2 2 0 0 1-2-2V32a2 2 0 0 1 2-2zm9 0 5.4-10.8c1-2 3.8-2.2 4.8-.2.8 1.5.7 3.5-.1 5.6L35.6 28h10.2c2.5 0 4.4 2.2 4 4.7l-1.9 11.4c-.4 2.3-2.4 3.9-4.7 3.9H27V30z" fill="#fff"/></svg>`)
  },
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

export function renderReactionIcon(key, className = "twin-rx-icon") {
  const r = REACTIONS.find((x) => x.key === key) || REACTIONS[0];
  return `<img class="${className}" src="${r.icon}" alt="${r.label}" draggable="false" />`;
}

const SVG = {
  like: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 10.5V20"/><path d="M14.8 5.6 14 10h5.4a2 2 0 0 1 1.95 2.45l-1.8 7.5A2 2 0 0 1 17.6 21.5H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.7a2 2 0 0 0 1.8-1.1L12 3.2a2.5 2.5 0 0 1 2.8 2.4Z"/></svg>`,
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
  backdrop.querySelector("#ep-feeling").value = post.feeling || "";
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

  const renderAsHtml = Boolean(post.isHtml || (post.content && containsHtmlMarkup(post.content)));
  const bodyHtml = post.content
    ? renderAsHtml
      ? `<div class="twin-post-body twin-post-html">${sanitizeHtml(post.content)}</div>`
      : `<div class="twin-post-body">${renderRichTextHtml(post.content)}</div>`
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
            ${post.feeling ? `<span style="font-weight:400;color:var(--text-3)"> đang cảm thấy ${escapeHtml(post.feeling)}</span>` : ""}
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
            const isShort = post.videoType === "short";
            const poster = post.videoPoster || getVideoPosterUrl(post.videoUrl);
            const durText = post.videoDuration ? formatDuration(post.videoDuration) : "";
            return `
              <div class="twin-post-video-wrap ${isShort ? "is-short" : ""}">
                <div class="twin-post-video-top">
                  <span class="twin-post-video-badge ${isShort ? "short" : ""}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    <span>${isShort ? "Video ngắn" : "Video"}${durText ? ` · ${escapeHtml(durText)}` : ""}</span>
                  </span>
                  ${
                    isShort
                      ? `<a href="./reels.html?id=${encodeURIComponent(post.id)}" class="twin-post-video-reel-link">Xem Reels</a>`
                      : ""
                  }
                </div>
                <video
                  class="twin-post-video"
                  src="${escapeHtml(post.videoUrl)}"
                  ${poster ? `poster="${escapeHtml(poster)}"` : ""}
                  controls
                  playsinline
                  ${isShort ? "loop" : ""}
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
    setReaction(myReactionKey || "like");
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
        <textarea id="pfc-content" class="twin-textarea" placeholder="Bạn đang nghĩ gì?"></textarea>
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
    if (e.target.closest(".twin-composer-avatar-link")) return;
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
