/* ==========================================================================
   Twin Liquid Glass — Shared Layout, Search & Notifications
========================================================================== */
import {
  auth,
  db,
  isFirebaseConfigured,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  updateProfile,
  writeBatch,
  serverTimestamp,
  ensureUserDoc,
  isUserAdmin,
  ROOT_ADMIN_EMAILS,
  DEFAULT_AVATAR,
  escapeHtml,
  formatTime,
  toMillis,
  getChatId,
  safeLink,
  friendlyError,
  showToast,
  pushNotification,
  resetPassword,
  hasPasswordProvider,
  setOrChangePassword,
  arrayUnion,
  getDocs
} from "./firebase-service.js";

export const ICONS = {
  home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.8 12 3.5l8.5 7.3"/><path d="M5.5 9.5V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9.5"/><path d="M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21"/></svg>`,
  friends: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.3a5 5 0 0 1 5 5.7"/></svg>`,
  groups: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.2"/><path d="M6.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="18.5" cy="9.5" r="2.2"/><path d="M22 19.5a4 4 0 0 0-3-3.8"/><circle cx="5.5" cy="9.5" r="2.2"/><path d="M2 19.5a4 4 0 0 1 3-3.8"/></svg>`,
  pages: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="15.8 8.2 13.8 13.8 8.2 15.8 10.2 10.2 15.8 8.2"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c5 0 9 3.6 9 8.1 0 4.5-4 8.1-9 8.1-1.4 0-2.7-.3-3.9-.8L3.5 20l1.1-3.9A7.6 7.6 0 0 1 3 11.1C3 6.6 7 3 12 3Z"/><path d="M8.5 11.2h.01M12 11.2h.01M15.5 11.2h.01"/></svg>`,
  bell: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z"/><path d="M10 19.5a2.1 2.1 0 0 0 4 0"/></svg>`,
  search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/></svg>`,
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.5 6.5 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2.5 12h2M19.5 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.5s7.5-3.6 7.5-9.5V5.5L12 2.5l-7.5 3V12c0 5.9 7.5 9.5 7.5 9.5Z"/></svg>`,
  bookmark: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v15l-7-4-7 4v-15A1.5 1.5 0 0 1 6.5 4Z"/></svg>`,
  key: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4.5"/><path d="m20.5 3.5-9.2 9.2"/><path d="m15.5 8.5 3 3"/></svg>`,
  logout: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>`,
  palette: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".8" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".8" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".8" fill="currentColor"/><path d="M12 2a10 10 0 0 0 0 20c1.4 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a5 5 0 0 0 5-5c0-5-4.5-9-10-9Z"/></svg>`,
  glass: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 9.5a4.5 4.5 0 0 1 6-2"/><path d="M15.5 14.5a4.5 4.5 0 0 1-5 2"/></svg>`,
  motion: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1"/></svg>`,
  volume: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5.5a9.5 9.5 0 0 1 0 13"/></svg>`,
  type: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/></svg>`,
  sliders: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5-9.5-6.5-9.5-6.5Z"/><circle cx="12" cy="12" r="2.8"/></svg>`,
  lock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10.2V7.8a3.5 3.5 0 0 1 7 0v2.4"/><circle cx="12" cy="14.5" r="1.2" fill="currentColor"/></svg>`
};

let currentUserData = null;
let unsubNotifs = null;
let unsubUser = null;
let unsubSiteSettings = null;
let unsubSearchUsers = null;
let unsubSearchGroups = null;
let unsubSearchPages = null;
let globalListenersBound = false;
let latestNotifItems = [];
let notifsInitialized = false;
let activeChatPeerUid = null;
const seenNotifIds = new Set();
const chatUnreadListeners = new Set();

const searchDirectory = {
  users: [],
  groups: [],
  pages: []
};
const openChats = new Map();

export const DEFAULT_WEB_PREFS = {
  theme: "light",
  accent: "blue",
  glass: "full",
  motion: "full",
  bgGrid: true,
  sound: true,
  fontSize: "md",
  density: "comfortable",
  feedPageSize: 5
};

const DEFAULT_SITE_SETTINGS = {
  siteName: "Twin",
  announcement: "",
  allowHtmlPosts: true,
  defaultFeedPageSize: 5
};

let siteSettings = { ...DEFAULT_SITE_SETTINGS };

export function getSiteSettings() {
  return { ...siteSettings };
}

export function getWebPrefs() {
  const savedTheme = localStorage.getItem("twin_theme_ios27");
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("twin_web_prefs_v2") || "{}") || {};
  } catch {
    stored = {};
  }
  const merged = {
    ...DEFAULT_WEB_PREFS,
    ...stored,
    theme: stored.theme || savedTheme || DEFAULT_WEB_PREFS.theme
  };
  const validAccents = ["blue", "indigo", "mint", "orange", "pink"];
  if (!validAccents.includes(merged.accent)) merged.accent = "blue";
  if (!["sm", "md", "lg"].includes(merged.fontSize)) merged.fontSize = "md";
  if (!["comfortable", "compact"].includes(merged.density)) merged.density = "comfortable";
  if (!["full", "reduced"].includes(merged.motion)) merged.motion = "full";
  if (!["full", "reduced"].includes(merged.glass)) merged.glass = "full";
  const pageSize = Number(merged.feedPageSize);
  merged.feedPageSize = [5, 10, 15, 20].includes(pageSize) ? pageSize : (siteSettings.defaultFeedPageSize || 5);
  merged.bgGrid = merged.bgGrid !== false;
  merged.sound = merged.sound !== false;
  return merged;
}

export function applyWebPrefs(prefs = getWebPrefs()) {
  const root = document.documentElement;
  root.setAttribute("data-theme", prefs.theme === "dark" ? "dark" : "light");
  root.setAttribute("data-accent", prefs.accent || "blue");
  root.setAttribute("data-glass", prefs.glass === "reduced" ? "reduced" : "full");
  root.setAttribute("data-motion", prefs.motion === "reduced" ? "reduced" : "full");
  root.setAttribute("data-bg-grid", prefs.bgGrid === false ? "off" : "on");
  root.setAttribute("data-font-size", prefs.fontSize || "md");
  root.setAttribute("data-density", prefs.density || "comfortable");

  const isDark = prefs.theme === "dark";
  const iconBtn = document.getElementById("twin-theme-btn");
  if (iconBtn) iconBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
  const label = document.getElementById("twin-theme-label");
  if (label) label.textContent = isDark ? "Chế độ Sáng" : "Chế độ Tối";
}

export function saveWebPrefs(partial, { syncCloud = true } = {}) {
  const next = { ...getWebPrefs(), ...partial };
  localStorage.setItem("twin_web_prefs_v2", JSON.stringify(next));
  localStorage.setItem("twin_theme_ios27", next.theme);
  applyWebPrefs(next);
  window.dispatchEvent(new CustomEvent("twin-prefs-changed", { detail: next }));
  if (syncCloud && db && currentUserData?.uid) {
    updateDoc(doc(db, "users", currentUserData.uid), { preferences: next }).catch(() => {});
  }
  return next;
}

export function applySavedTheme() {
  applyWebPrefs(getWebPrefs());
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  saveWebPrefs({ theme: next });
}

function applySiteSettingsToDOM() {
  const brandNameEl = document.getElementById("twin-brand-name");
  const brandCircleEl = document.getElementById("twin-brand-circle");
  const name = (siteSettings.siteName || "Twin").trim() || "Twin";
  if (brandNameEl) brandNameEl.textContent = name;
  if (brandCircleEl) brandCircleEl.textContent = name.charAt(0).toUpperCase();

  const header = document.getElementById("twin-header");
  let banner = document.getElementById("twin-site-announcement");
  const msg = (siteSettings.announcement || "").trim();
  if (msg && header) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "twin-site-announcement";
      banner.className = "twin-site-announcement";
      header.insertAdjacentElement("afterend", banner);
    }
    banner.innerHTML = `<span class="twin-site-announcement-text">${escapeHtml(msg)}</span>`;
  } else if (banner) {
    banner.remove();
  }
}

function subscribeSiteSettings() {
  if (!db || unsubSiteSettings) return;
  unsubSiteSettings = onSnapshot(doc(db, "settings", "web"), (snap) => {
    const data = snap.exists() ? snap.data() : {};
    const parsedSize = Number(data.defaultFeedPageSize);
    siteSettings = {
      siteName: typeof data.siteName === "string" && data.siteName.trim() ? data.siteName.trim().slice(0, 32) : "Twin",
      announcement: typeof data.announcement === "string" ? data.announcement.trim().slice(0, 240) : "",
      allowHtmlPosts: data.allowHtmlPosts !== false,
      defaultFeedPageSize: [5, 10, 15, 20].includes(parsedSize) ? parsedSize : 5
    };
    applySiteSettingsToDOM();
    window.dispatchEvent(new CustomEvent("twin-site-settings-changed", { detail: { ...siteSettings } }));
  }, () => {});
}

function getCurrentPageKey() {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
  const name = path.split("/").pop();
  const known = ["friends", "groups", "pages", "messages", "profile", "saved", "login", "404"];
  return known.includes(name) ? name : "home";
}

function renderGlobalSearchResults(rawQuery) {
  const drop = document.getElementById("twin-search-dropdown");
  if (!drop) return;
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    drop.classList.remove("open");
    drop.innerHTML = "";
    return;
  }

  const matchedUsers = searchDirectory.users
    .filter((u) => (u.name || "").toLowerCase().includes(q) || (u.bio || "").toLowerCase().includes(q))
    .slice(0, 5);
  const matchedGroups = searchDirectory.groups
    .filter((g) => (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q))
    .slice(0, 4);
  const matchedPages = searchDirectory.pages
    .filter((p) => (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
    .slice(0, 4);

  let html = "";

  if (matchedUsers.length) {
    html += `<div class="twin-search-cat">Mọi người</div>`;
    html += matchedUsers
      .map(
        (u) => `
      <a href="./profile.html?uid=${encodeURIComponent(u.uid)}" class="twin-dropdown-item">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(u.avatar || DEFAULT_AVATAR)}" alt="" />
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.name)}</div>
          <div class="twin-post-meta" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.bio || "Thành viên Twin")}</div>
        </div>
        <span class="twin-pill-tag">Hồ sơ</span>
      </a>`
      )
      .join("");
  }

  if (matchedGroups.length) {
    html += `<div class="twin-search-cat">Nhóm</div>`;
    html += matchedGroups
      .map(
        (g) => `
      <a href="./groups.html?id=${encodeURIComponent(g.id)}" class="twin-dropdown-item">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(g.coverUrl || DEFAULT_AVATAR)}" alt="" />
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(g.name)}</div>
          <div class="twin-post-meta">${(g.members || []).length} thành viên</div>
        </div>
        <span class="twin-pill-tag">Nhóm</span>
      </a>`
      )
      .join("");
  }

  if (matchedPages.length) {
    html += `<div class="twin-search-cat">Trang</div>`;
    html += matchedPages
      .map(
        (p) => `
      <a href="./pages.html?id=${encodeURIComponent(p.id)}" class="twin-dropdown-item">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(p.coverUrl || DEFAULT_AVATAR)}" alt="" />
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
          <div class="twin-post-meta">${escapeHtml(p.category || "Trang")} · ${(p.followers || []).length} theo dõi</div>
        </div>
        <span class="twin-pill-tag">Trang</span>
      </a>`
      )
      .join("");
  }

  html += `
    <hr style="border:none;border-top:1px solid var(--border);margin:6px 0;" />
    <a href="./index.html?q=${encodeURIComponent(rawQuery.trim())}" class="twin-dropdown-item" style="color:var(--primary);font-weight:600;">
      ${ICONS.search}
      <span>Tìm bài viết chứa "${escapeHtml(rawQuery.trim())}"</span>
    </a>
  `;

  drop.innerHTML = html;
  drop.classList.add("open");
}

function subscribeGlobalSearchDirectory() {
  if (!db) return;
  if (!unsubSearchUsers) {
    unsubSearchUsers = onSnapshot(query(collection(db, "users"), limit(150)), (snap) => {
      searchDirectory.users = [];
      snap.forEach((d) => searchDirectory.users.push({ id: d.id, ...d.data() }));
      const inp = document.getElementById("twin-global-search");
      if (inp && document.activeElement === inp && inp.value.trim()) renderGlobalSearchResults(inp.value);
      const adminSearch = document.getElementById("ts-admin-user-search");
      if (adminSearch && document.getElementById("twin-settings-modal")?.classList.contains("open")) {
        renderAdminUserList(adminSearch.value);
      }
    }, () => {});
  }
  if (!unsubSearchGroups) {
    unsubSearchGroups = onSnapshot(query(collection(db, "groups"), limit(100)), (snap) => {
      searchDirectory.groups = [];
      snap.forEach((d) => searchDirectory.groups.push({ id: d.id, ...d.data() }));
      const inp = document.getElementById("twin-global-search");
      if (inp && document.activeElement === inp && inp.value.trim()) renderGlobalSearchResults(inp.value);
    }, () => {});
  }
  if (!unsubSearchPages) {
    unsubSearchPages = onSnapshot(query(collection(db, "pages"), limit(100)), (snap) => {
      searchDirectory.pages = [];
      snap.forEach((d) => searchDirectory.pages.push({ id: d.id, ...d.data() }));
      const inp = document.getElementById("twin-global-search");
      if (inp && document.activeElement === inp && inp.value.trim()) renderGlobalSearchResults(inp.value);
    }, () => {});
  }
}

export function renderAppChrome() {
  applySavedTheme();
  const page = getCurrentPageKey();

  const headerEl = document.getElementById("twin-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="twin-header-left">
        <a href="./index.html" class="twin-logo" title="Trang chủ Twin">
          <span class="twin-logo-circle" id="twin-brand-circle">T</span>
          <span id="twin-brand-name">Twin</span>
        </a>
        <div class="twin-search-wrap" id="twin-search-wrap">
          <div class="twin-search-box" id="twin-search-box">
            <button type="button" id="twin-search-trigger" class="twin-search-trigger" aria-label="Mở tìm kiếm" title="Tìm kiếm">
              ${ICONS.search}
            </button>
            <input id="twin-global-search" type="search" autocomplete="off" placeholder="Tìm người, nhóm, trang, bài viết..." />
            <button type="button" id="twin-search-close" class="twin-search-close" aria-label="Đóng tìm kiếm" title="Đóng">✕</button>
          </div>
          <div id="twin-search-dropdown" class="twin-search-dropdown"></div>
        </div>
      </div>

      <nav class="twin-nav-center" aria-label="Điều hướng chính">
        <a href="./index.html" class="twin-nav-link ${page === "home" ? "active" : ""}" title="Bảng tin">${ICONS.home}</a>
        <a href="./friends.html" class="twin-nav-link ${page === "friends" ? "active" : ""}" title="Bạn bè">${ICONS.friends}</a>
        <a href="./groups.html" class="twin-nav-link ${page === "groups" ? "active" : ""}" title="Nhóm">${ICONS.groups}</a>
        <a href="./pages.html" class="twin-nav-link ${page === "pages" ? "active" : ""}" title="Trang">${ICONS.pages}</a>
        <a href="./messages.html" class="twin-nav-link ${page === "messages" ? "active" : ""}" title="Tin nhắn" style="position:relative;">
          ${ICONS.chat}
          <span class="twin-badge twin-nav-badge" id="twin-nav-chat-badge" style="display:none">0</span>
        </a>
      </nav>

      <div class="twin-header-right" id="twin-header-right">
        <a href="./login.html" class="twin-btn twin-btn-primary twin-btn-sm">Đăng nhập</a>
      </div>
    `;
  }

  const searchWrap = document.getElementById("twin-search-wrap");
  const searchInput = document.getElementById("twin-global-search");
  const searchTrigger = document.getElementById("twin-search-trigger");
  const searchClose = document.getElementById("twin-search-close");

  const openMobileSearch = () => {
    headerEl?.classList.add("search-expanded");
    searchWrap?.classList.add("expanded");
    setTimeout(() => searchInput?.focus(), 40);
  };
  const closeMobileSearch = () => {
    headerEl?.classList.remove("search-expanded");
    searchWrap?.classList.remove("expanded");
    document.getElementById("twin-search-dropdown")?.classList.remove("open");
    searchInput?.blur();
  };

  if (searchInput && searchWrap) {
    searchWrap.addEventListener("click", (e) => e.stopPropagation());
    searchTrigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.innerWidth <= 820 && !searchWrap.classList.contains("expanded")) {
        openMobileSearch();
      } else {
        searchInput.focus();
      }
    });
    searchClose?.addEventListener("click", (e) => {
      e.stopPropagation();
      searchInput.value = "";
      renderGlobalSearchResults("");
      closeMobileSearch();
    });
    searchInput.addEventListener("input", () => {
      renderGlobalSearchResults(searchInput.value);
    });
    searchInput.addEventListener("focus", () => {
      if (window.innerWidth <= 820) openMobileSearch();
      if (searchInput.value.trim()) renderGlobalSearchResults(searchInput.value);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileSearch();
        return;
      }
      const v = searchInput.value.trim();
      if (e.key === "Enter" && v && page !== "home") {
        window.location.href = `./index.html?q=${encodeURIComponent(v)}`;
      }
    });
  }

  let mobileBar = document.getElementById("twin-mobile-bar");
  if (!mobileBar && headerEl) {
    mobileBar = document.createElement("nav");
    mobileBar.id = "twin-mobile-bar";
    mobileBar.className = "twin-mobile-bar";
    mobileBar.innerHTML = `
      <a href="./index.html" class="twin-mobile-tab ${page === "home" ? "active" : ""}">${ICONS.home}<span>Bảng tin</span></a>
      <a href="./friends.html" class="twin-mobile-tab ${page === "friends" ? "active" : ""}">${ICONS.friends}<span>Bạn bè</span></a>
      <a href="./groups.html" class="twin-mobile-tab ${page === "groups" ? "active" : ""}">${ICONS.groups}<span>Nhóm</span></a>
      <a href="./pages.html" class="twin-mobile-tab ${page === "pages" ? "active" : ""}">${ICONS.pages}<span>Trang</span></a>
      <a href="./messages.html" class="twin-mobile-tab ${page === "messages" ? "active" : ""}" style="position:relative;">
        ${ICONS.chat}
        <span>Chat</span>
        <span class="twin-badge twin-mobile-badge" id="twin-mobile-chat-badge" style="display:none">0</span>
      </a>
    `;
    document.body.appendChild(mobileBar);
  }
}

function isMessageNotif(n) {
  return Boolean(n && (n.type === "message" || String(n.link || "").startsWith("./messages.html")));
}

function getNotifTimeMs(n) {
  const ts = toMillis(n?.createdAt);
  if (ts > 0) return ts;
  if (typeof n?.createdAtMs === "number" && n.createdAtMs > 0) return n.createdAtMs;
  return Date.now();
}

export function getUnreadChatCountsByPeer() {
  const counts = new Map();
  for (const n of latestNotifItems) {
    if (!n.read && isMessageNotif(n) && n.fromUid) {
      counts.set(n.fromUid, (counts.get(n.fromUid) || 0) + 1);
    }
  }
  return counts;
}

function notifyChatUnreadListeners() {
  if (!chatUnreadListeners.size) return;
  const counts = getUnreadChatCountsByPeer();
  chatUnreadListeners.forEach((cb) => {
    try { cb(new Map(counts)); } catch {}
  });
}

export function onUnreadChatCountsChange(cb) {
  if (typeof cb !== "function") return () => {};
  chatUnreadListeners.add(cb);
  try { cb(getUnreadChatCountsByPeer()); } catch {}
  return () => chatUnreadListeners.delete(cb);
}

function updateAllBadges() {
  const generalUnread = latestNotifItems.filter((n) => !n.read && !isMessageNotif(n)).length;
  const msgUnread = latestNotifItems.filter((n) => !n.read && isMessageNotif(n)).length;

  const notifBadge = document.getElementById("twin-notif-badge");
  if (notifBadge) {
    notifBadge.style.display = generalUnread > 0 ? "grid" : "none";
    notifBadge.textContent = generalUnread > 9 ? "9+" : String(generalUnread);
  }

  ["twin-chat-badge", "twin-nav-chat-badge", "twin-mobile-chat-badge"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = msgUnread > 0 ? "grid" : "none";
    el.textContent = msgUnread > 9 ? "9+" : String(msgUnread);
  });

  notifyChatUnreadListeners();
}

export function setActiveChatPeer(peerUid) {
  activeChatPeerUid = peerUid || null;
  if (activeChatPeerUid) {
    markChatNotifsFromPeerRead(activeChatPeerUid);
  }
}

export async function markChatNotifsFromPeerRead(peerUid) {
  if (!db || !peerUid) return;
  const targets = latestNotifItems.filter((n) => !n.read && isMessageNotif(n) && n.fromUid === peerUid);
  if (!targets.length) return;
  targets.forEach((n) => { n.read = true; });
  updateAllBadges();
  try {
    const batch = writeBatch(db);
    targets.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  } catch {
    targets.forEach((n) => updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {}));
  }
}

async function markAllGeneralNotificationsRead() {
  const unreadGeneral = latestNotifItems.filter((n) => !n.read && !isMessageNotif(n));
  if (!unreadGeneral.length) {
    updateAllBadges();
    return;
  }
  unreadGeneral.forEach((n) => { n.read = true; });
  updateAllBadges();
  if (!db) return;
  try {
    const batch = writeBatch(db);
    unreadGeneral.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  } catch {
    unreadGeneral.forEach((n) => {
      updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
    });
  }
}

function renderNotifList() {
  const listEl = document.getElementById("twin-notif-list");
  if (!listEl) return;
  const generalItems = latestNotifItems.filter((n) => !isMessageNotif(n));
  if (!generalItems.length) {
    listEl.innerHTML = '<p class="twin-post-meta" style="padding:8px">Chưa có thông báo nào.</p>';
    return;
  }
  listEl.innerHTML = generalItems
    .slice(0, 15)
    .map(
      (n) => `
    <a href="${escapeHtml(safeLink(n.link))}" data-nid="${n.id}" class="twin-dropdown-item ${n.read ? "" : "twin-notif-unread"}">
      <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(n.fromAvatar || DEFAULT_AVATAR)}" alt="" />
      <div>
        <div style="font-size:13.5px;line-height:1.35;"><strong>${escapeHtml(n.fromName)}</strong> ${escapeHtml(n.text)}</div>
        <div class="twin-post-meta">${formatTime(n.createdAt)}</div>
      </div>
    </a>`
    )
    .join("");

  listEl.querySelectorAll("a[data-nid]").forEach((a) => {
    a.addEventListener("click", () => {
      a.classList.remove("twin-notif-unread");
      const target = latestNotifItems.find((item) => item.id === a.dataset.nid);
      if (target) target.read = true;
      updateAllBadges();
      updateDoc(doc(db, "notifications", a.dataset.nid), { read: true }).catch(() => {});
    });
  });
}

function renderLoggedInHeaderRight(user) {
  const wrap = document.getElementById("twin-header-right");
  if (!wrap) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const admin = isUserAdmin(user);

  wrap.innerHTML = `
    <a href="./messages.html" id="twin-chat-btn" class="twin-icon-btn" title="Tin nhắn Twin Chat" aria-label="Tin nhắn Twin Chat">
      ${ICONS.chat}
      <span class="twin-badge" id="twin-chat-badge" style="display:none">0</span>
    </a>
    <button class="twin-icon-btn" id="twin-notif-btn" title="Thông báo" aria-label="Thông báo">
      ${ICONS.bell}
      <span class="twin-badge" id="twin-notif-badge" style="display:none">0</span>
    </button>
    <button class="twin-icon-btn" id="twin-settings-btn" title="Cài đặt tài khoản" aria-label="Cài đặt tài khoản">
      ${ICONS.settings}
    </button>
    <button class="twin-icon-btn" id="twin-theme-btn" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">
      ${isDark ? ICONS.sun : ICONS.moon}
    </button>
    <button id="twin-account-btn" style="display:flex;align-items:center;" title="Tài khoản" aria-label="Tài khoản">
      <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="Avatar" />
    </button>

    <div class="twin-dropdown" id="twin-notif-dropdown">
      <div class="twin-dropdown-title">
        <span>Thông báo</span>
        <button id="twin-mark-all-read" style="font-size:12px;color:var(--primary);font-weight:600;">Đã đọc tất cả</button>
      </div>
      <div id="twin-notif-perm-bar" class="twin-notif-perm-bar" style="display:none;"></div>
      <div id="twin-notif-list"><p class="twin-post-meta" style="padding:8px">Chưa có thông báo nào.</p></div>
    </div>

    <div class="twin-dropdown" id="twin-account-dropdown" style="width:276px;">
      <a href="./profile.html" class="twin-dropdown-item">
        <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="" />
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span id="twin-account-name" style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user.name)}</span>
            ${admin ? `<span class="twin-role-badge admin" id="twin-account-role-badge">Admin</span>` : `<span id="twin-account-role-badge" style="display:none;"></span>`}
          </div>
          <div class="twin-post-meta">Xem trang cá nhân</div>
        </div>
      </a>
      <hr style="border:none;border-top:1px solid var(--border);margin:8px 0;" />
      <button class="twin-dropdown-item" id="twin-menu-settings">${ICONS.settings}<span>Cài đặt tài khoản</span></button>
      ${admin ? `<button class="twin-dropdown-item" id="twin-menu-admin" style="color:var(--primary);">${ICONS.shield}<span>Quản trị Admin</span></button>` : ""}
      <a href="./saved.html" class="twin-dropdown-item">${ICONS.bookmark}<span>Bài viết đã lưu</span></a>
      <button class="twin-dropdown-item" id="twin-menu-theme">${isDark ? ICONS.sun : ICONS.moon}<span id="twin-theme-label">${isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span></button>
      <button class="twin-dropdown-item" id="twin-reset-pass-btn">${ICONS.key}<span>Đặt / Đổi mật khẩu</span></button>
      <button class="twin-dropdown-item" id="twin-logout-btn" style="color:var(--danger)">${ICONS.logout}<span>Đăng xuất</span></button>
    </div>
  `;

  const notifBtn = document.getElementById("twin-notif-btn");
  const notifDrop = document.getElementById("twin-notif-dropdown");
  const accBtn = document.getElementById("twin-account-btn");
  const accDrop = document.getElementById("twin-account-dropdown");

  notifBtn.onclick = (e) => {
    e.stopPropagation();
    accDrop.classList.remove("open");
    document.getElementById("twin-search-dropdown")?.classList.remove("open");
    const willOpen = !notifDrop.classList.contains("open");
    notifDrop.classList.toggle("open", willOpen);
    if (willOpen) {
      markAllGeneralNotificationsRead();
    }
  };

  document.getElementById("twin-mark-all-read").onclick = (e) => {
    e.stopPropagation();
    markAllGeneralNotificationsRead();
    document.querySelectorAll("#twin-notif-list .twin-notif-unread").forEach((el) => {
      el.classList.remove("twin-notif-unread");
    });
  };

  accBtn.onclick = (e) => {
    e.stopPropagation();
    notifDrop.classList.remove("open");
    document.getElementById("twin-search-dropdown")?.classList.remove("open");
    accDrop.classList.toggle("open");
  };

  if (!globalListenersBound) {
    globalListenersBound = true;
    document.addEventListener("click", () => {
      document.getElementById("twin-notif-dropdown")?.classList.remove("open");
      document.getElementById("twin-account-dropdown")?.classList.remove("open");
      document.getElementById("twin-search-dropdown")?.classList.remove("open");
      document.getElementById("twin-header")?.classList.remove("search-expanded");
      document.getElementById("twin-search-wrap")?.classList.remove("expanded");
    });
    document.addEventListener("click", (e) => {
      if (e.target.classList && e.target.classList.contains("twin-modal-backdrop")) e.target.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".twin-modal-backdrop.open").forEach((m) => m.classList.remove("open"));
        document.getElementById("twin-search-dropdown")?.classList.remove("open");
        document.getElementById("twin-header")?.classList.remove("search-expanded");
        document.getElementById("twin-search-wrap")?.classList.remove("expanded");
      }
    });
  }

  notifDrop.addEventListener("click", (e) => e.stopPropagation());

  renderNotifPermBar();

  document.getElementById("twin-settings-btn").onclick = (e) => {
    e.stopPropagation();
    notifDrop.classList.remove("open");
    accDrop.classList.remove("open");
    openAccountSettingsModal("effects");
  };
  document.getElementById("twin-menu-settings").onclick = (e) => {
    e.stopPropagation();
    accDrop.classList.remove("open");
    openAccountSettingsModal("effects");
  };
  const adminMenuBtn = document.getElementById("twin-menu-admin");
  if (adminMenuBtn) {
    adminMenuBtn.onclick = (e) => {
      e.stopPropagation();
      accDrop.classList.remove("open");
      openAccountSettingsModal("admin");
    };
  }
  document.getElementById("twin-theme-btn").onclick = toggleTheme;
  document.getElementById("twin-menu-theme").onclick = toggleTheme;
  document.getElementById("twin-reset-pass-btn").onclick = (e) => {
    e.stopPropagation();
    accDrop.classList.remove("open");
    openAccountSettingsModal("privacy", { focusPassword: true });
  };
  document.getElementById("twin-logout-btn").onclick = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    window.location.href = "./login.html";
  };
}

const ACCENT_PALETTES = [
  { id: "blue", label: "Xanh iOS", color: "#007aff" },
  { id: "indigo", label: "Chàm", color: "#5856d6" },
  { id: "mint", label: "Bạc hà", color: "#009c7b" },
  { id: "orange", label: "Hoàng hôn", color: "#e86c00" },
  { id: "pink", label: "Anh đào", color: "#e02b6b" }
];

function renderAdminUserList(filterText = "") {
  const listEl = document.getElementById("ts-admin-user-list");
  if (!listEl || !currentUserData || !isUserAdmin(currentUserData)) return;
  const q = filterText.trim().toLowerCase();
  const users = searchDirectory.users
    .filter((u) => {
      if (!q) return true;
      return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (isUserAdmin(b) ? 1 : 0) - (isUserAdmin(a) ? 1 : 0) || (a.name || "").localeCompare(b.name || ""));

  if (!users.length) {
    listEl.innerHTML = `<p class="twin-post-meta" style="padding:10px 0;">Không tìm thấy thành viên nào.</p>`;
    return;
  }

  listEl.innerHTML = users
    .slice(0, 40)
    .map((u) => {
      const targetUid = u.uid || u.id;
      const targetEmail = (u.email || "").toLowerCase();
      const targetIsRoot = ROOT_ADMIN_EMAILS.includes(targetEmail);
      const targetIsAdmin = isUserAdmin(u);
      const isSelf = targetUid === currentUserData.uid;
      const locked = targetIsRoot || isSelf;
      return `
        <div class="twin-admin-user-row">
          <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(u.avatar || DEFAULT_AVATAR)}" alt="" />
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <strong style="font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.name || "Thành viên")}</strong>
              <span class="twin-role-badge ${targetIsAdmin ? "admin" : ""}">${targetIsRoot ? "Root Admin" : targetIsAdmin ? "Admin" : "Thành viên"}</span>
            </div>
            <div class="twin-post-meta" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.email || targetUid)}</div>
          </div>
          ${
            locked
              ? `<span class="twin-post-meta" style="font-size:11.5px;flex-shrink:0;">${isSelf ? "Bạn" : "Cố định"}</span>`
              : `<button type="button" class="twin-btn ${targetIsAdmin ? "twin-btn-secondary" : "twin-btn-primary"} twin-btn-sm ts-role-toggle" data-uid="${escapeHtml(targetUid)}" data-next="${targetIsAdmin ? "member" : "admin"}">${targetIsAdmin ? "Gỡ Admin" : "Cấp Admin"}</button>`
          }
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".ts-role-toggle").forEach((btn) => {
    btn.onclick = async () => {
      const uid = btn.dataset.uid;
      const nextRole = btn.dataset.next === "admin" ? "admin" : "member";
      if (!uid) return;
      btn.disabled = true;
      try {
        await updateDoc(doc(db, "users", uid), { role: nextRole });
        showToast(nextRole === "admin" ? "Đã cấp quyền Admin thành công!" : "Đã chuyển tài khoản về Thành viên.");
      } catch (err) {
        showToast(friendlyError(err));
      } finally {
        btn.disabled = false;
      }
    };
  });
}

export function openAccountSettingsModal(initialTab = "effects", { focusPassword = false } = {}) {
  if (!currentUserData) return;
  let backdrop = document.getElementById("twin-settings-modal");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "twin-settings-modal";
    backdrop.className = "twin-modal-backdrop";
    document.body.appendChild(backdrop);
  }

  const prefs = getWebPrefs();
  const admin = isUserAdmin(currentUserData);
  const activeTab = initialTab === "admin" && !admin ? "effects" : initialTab;
  const userEmail = auth?.currentUser?.email || currentUserData.email || "";
  const hasPass = hasPasswordProvider(auth?.currentUser);
  const notifEnabled = isBrowserNotifEnabled();
  const notifBlocked = typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied";

  backdrop.innerHTML = `
    <div class="twin-modal twin-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ts-modal-title">
      <div class="twin-settings-head">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <h2 id="ts-modal-title">Cài đặt</h2>
          <span class="twin-role-badge ${admin ? "admin" : ""}">${admin ? "Admin" : "Thành viên"}</span>
        </div>
        <button type="button" id="ts-close-btn" class="twin-icon-btn" style="width:34px;height:34px;" aria-label="Đóng">✕</button>
      </div>

      <div class="twin-settings-tabs-wrap">
        <div class="twin-settings-tabs" role="tablist">
          <button type="button" class="twin-settings-tab ${activeTab === "effects" ? "active" : ""}" data-tab="effects">Giao diện &amp; Web</button>
          <button type="button" class="twin-settings-tab ${activeTab === "privacy" ? "active" : ""}" data-tab="privacy">Quyền cá nhân</button>
          ${admin ? `<button type="button" class="twin-settings-tab ${activeTab === "admin" ? "active" : ""}" data-tab="admin">${ICONS.shield}<span>Quản trị Admin</span></button>` : ""}
        </div>
      </div>

      <div class="twin-settings-body">
        <!-- TAB 1: iOS 27 SETTINGS — HIỆU ỨNG & THÔNG SỐ WEB -->
        <div class="twin-settings-panel ${activeTab === "effects" ? "active" : ""}" data-panel="effects">
          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Màn hình &amp; Màu sắc</div>
            <div class="twin-setting-group">
              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-blue">${ICONS.sun}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Giao diện</div>
                    <div class="twin-setting-desc">Kính lỏng Sáng hoặc Kính tối.</div>
                  </div>
                </div>
                <div class="twin-seg-tabs">
                  <button type="button" class="twin-seg-tab ts-theme-opt ${prefs.theme === "light" ? "active" : ""}" data-theme-val="light">Sáng</button>
                  <button type="button" class="twin-seg-tab ts-theme-opt ${prefs.theme === "dark" ? "active" : ""}" data-theme-val="dark">Tối</button>
                </div>
              </div>

              <div class="twin-setting-row twin-setting-row-col">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-indigo">${ICONS.palette}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Màu điểm nhấn</div>
                    <div class="twin-setting-desc">Đồng bộ nút bấm, thanh chọn và biểu tượng đang kích hoạt.</div>
                  </div>
                </div>
                <div class="twin-accent-grid">
                  ${ACCENT_PALETTES.map(
                    (p) => `
                    <button type="button" class="twin-accent-swatch ${prefs.accent === p.id ? "active" : ""}" data-accent-val="${p.id}">
                      <span class="twin-accent-dot" style="background:${p.color};"></span>
                      <span>${p.label}</span>
                    </button>`
                  ).join("")}
                </div>
              </div>
            </div>
          </div>

          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Hiệu ứng kính lỏng &amp; Trải nghiệm</div>
            <div class="twin-setting-group">
              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-teal">${ICONS.glass}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Độ trong kính lỏng (Mờ nền)</div>
                    <div class="twin-setting-desc">Hiệu ứng khúc xạ kính trong suốt trên thẻ và thanh điều hướng.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-pref-glass" class="twin-switch" ${prefs.glass !== "reduced" ? "checked" : ""} />
              </label>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-blue">${ICONS.motion}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Hiệu ứng chuyển động</div>
                    <div class="twin-setting-desc">Hoạt ảnh tương tác mượt cho tin ngắn, cảm xúc và bảng chọn.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-pref-motion" class="twin-switch" ${prefs.motion !== "reduced" ? "checked" : ""} />
              </label>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-indigo">${ICONS.sun}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Ánh phản chiếu nền</div>
                    <div class="twin-setting-desc">Tạo chiều sâu ánh sáng dịu phía sau các lớp kính.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-pref-grid" class="twin-switch" ${prefs.bgGrid ? "checked" : ""} />
              </label>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-pink">${ICONS.volume}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Âm thanh thông báo</div>
                    <div class="twin-setting-desc">Phát âm báo nhẹ khi nhận tin nhắn hoặc tương tác mới.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-pref-sound" class="twin-switch" ${prefs.sound ? "checked" : ""} />
              </label>
            </div>
          </div>

          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Thông số hiển thị Web</div>
            <div class="twin-setting-group">
              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-slate">${ICONS.type}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Cỡ chữ</div>
                    <div class="twin-setting-desc">Điều chỉnh kích thước chữ trên toàn trang.</div>
                  </div>
                </div>
                <select id="ts-pref-fontsize" class="twin-select" style="width:auto;min-width:128px;">
                  <option value="sm" ${prefs.fontSize === "sm" ? "selected" : ""}>Nhỏ</option>
                  <option value="md" ${prefs.fontSize === "md" ? "selected" : ""}>Tiêu chuẩn</option>
                  <option value="lg" ${prefs.fontSize === "lg" ? "selected" : ""}>Lớn</option>
                </select>
              </div>

              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-orange">${ICONS.sliders}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Mật độ bố cục</div>
                    <div class="twin-setting-desc">Thu gọn khoảng cách giữa các thẻ nội dung.</div>
                  </div>
                </div>
                <select id="ts-pref-density" class="twin-select" style="width:auto;min-width:128px;">
                  <option value="comfortable" ${prefs.density === "comfortable" ? "selected" : ""}>Thoải mái</option>
                  <option value="compact" ${prefs.density === "compact" ? "selected" : ""}>Gọn gàng</option>
                </select>
              </div>

              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-green">${ICONS.pages}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Bài đăng mỗi lượt tải</div>
                    <div class="twin-setting-desc">Số bài hiện trước trên bảng tin khi cuộn xuống.</div>
                  </div>
                </div>
                <select id="ts-pref-feedsize" class="twin-select" style="width:auto;min-width:128px;">
                  ${[5, 10, 15, 20].map((n) => `<option value="${n}" ${prefs.feedPageSize === n ? "selected" : ""}>${n} bài / lượt</option>`).join("")}
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px;">
              <button type="button" id="ts-reset-prefs" class="twin-btn twin-btn-secondary twin-btn-sm">Khôi phục mặc định</button>
            </div>
          </div>
        </div>

        <!-- TAB 2: QUYỀN CÁ NHÂN & TÀI KHOẢN -->
        <form class="twin-settings-panel ${activeTab === "privacy" ? "active" : ""}" data-panel="privacy" id="ts-privacy-form">
          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Tài khoản &amp; Bảo mật</div>
            <div class="twin-setting-group">
              <div class="twin-setting-row twin-setting-row-col">
                <label class="twin-field-label" for="ts-priv-name" style="margin-bottom:2px;">Tên hiển thị</label>
                <input id="ts-priv-name" class="twin-input" type="text" maxlength="60" value="${escapeHtml(currentUserData.name || "")}" required />
              </div>

              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-indigo">${ICONS.shield}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Vai trò tài khoản</div>
                    <div class="twin-setting-desc">${escapeHtml(userEmail || currentUserData.uid)}</div>
                  </div>
                </div>
                <span class="twin-role-badge ${admin ? "admin" : ""}">${admin ? "Quản trị viên" : "Thành viên"}</span>
              </div>

              <div class="twin-setting-row twin-setting-row-col" id="ts-password-section">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                  <div class="twin-setting-lead">
                    <span class="twin-side-icon ios-orange">${ICONS.lock}</span>
                    <div class="twin-setting-info">
                      <div class="twin-setting-label">${hasPass ? "Đổi mật khẩu đăng nhập" : "Đặt mật khẩu cho tài khoản"}</div>
                      <div class="twin-setting-desc">${hasPass ? "Cập nhật mật khẩu mới trực tiếp ngay tại đây." : "Đặt mật khẩu để có thể đăng nhập bằng Email + Mật khẩu."}</div>
                    </div>
                  </div>
                  <button type="button" id="ts-send-reset-pass" class="twin-btn twin-btn-secondary twin-btn-sm">Gửi mail đặt lại</button>
                </div>
                <div class="twin-password-box">
                  ${
                    hasPass
                      ? `<input id="ts-pass-current" class="twin-input" type="password" autocomplete="current-password" placeholder="Mật khẩu hiện tại (để xác minh)" />`
                      : ""
                  }
                  <div class="twin-form-grid-2">
                    <input id="ts-pass-new" class="twin-input" type="password" autocomplete="new-password" minlength="6" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" />
                    <input id="ts-pass-confirm" class="twin-input" type="password" autocomplete="new-password" minlength="6" placeholder="Nhập lại mật khẩu mới" />
                  </div>
                  <div style="display:flex;justify-content:flex-end;">
                    <button type="button" id="ts-save-password-btn" class="twin-btn twin-btn-primary twin-btn-sm">${hasPass ? "Đổi mật khẩu" : "Đặt mật khẩu"}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Quyền riêng tư cá nhân</div>
            <div class="twin-setting-group">
              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-blue">${ICONS.eye}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Hiển thị địa chỉ email</div>
                    <div class="twin-setting-desc">Cho phép người khác xem email trên trang cá nhân.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-priv-show-email" class="twin-switch" ${currentUserData.showEmail !== false ? "checked" : ""} />
              </label>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-teal">${ICONS.eye}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Hiển thị thông tin cá nhân chi tiết</div>
                    <div class="twin-setting-desc">Ngày sinh, quê quán, điện thoại với người xem khác.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-priv-show-info" class="twin-switch" ${currentUserData.showPersonalInfo !== false ? "checked" : ""} />
              </label>

              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-green">${ICONS.chat}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Ai có thể nhắn tin</div>
                    <div class="twin-setting-desc">Giới hạn người được gửi tin nhắn mới tới bạn.</div>
                  </div>
                </div>
                <select id="ts-priv-msg-from" class="twin-select" style="width:auto;min-width:132px;">
                  <option value="everyone" ${(currentUserData.allowMessagesFrom || "everyone") === "everyone" ? "selected" : ""}>Mọi người</option>
                  <option value="friends" ${currentUserData.allowMessagesFrom === "friends" ? "selected" : ""}>Chỉ bạn bè</option>
                </select>
              </div>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-indigo">${ICONS.friends}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Nhận lời mời kết bạn</div>
                    <div class="twin-setting-desc">Cho phép thành viên khác gửi yêu cầu kết bạn.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-priv-friend-req" class="twin-switch" ${currentUserData.allowFriendRequests !== false ? "checked" : ""} />
              </label>

              <label class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-green">${ICONS.motion}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Trạng thái hoạt động</div>
                    <div class="twin-setting-desc">Hiển thị khi bạn đang hoạt động trên Twin.</div>
                  </div>
                </div>
                <input type="checkbox" id="ts-priv-activity" class="twin-switch" ${currentUserData.showActivity !== false ? "checked" : ""} />
              </label>

              <div class="twin-setting-row">
                <div class="twin-setting-lead">
                  <span class="twin-side-icon ios-pink">${ICONS.bell}</span>
                  <div class="twin-setting-info">
                    <div class="twin-setting-label">Thông báo đẩy trình duyệt</div>
                    <div class="twin-setting-desc">${notifBlocked ? "Đang bị chặn trong cài đặt trình duyệt." : "Nhận thông báo tức thì khi có tương tác mới."}</div>
                  </div>
                </div>
                <button type="button" id="ts-browser-notif-btn" class="twin-btn ${notifEnabled ? "twin-btn-primary" : "twin-btn-secondary"} twin-btn-sm" ${notifBlocked ? "disabled" : ""}>
                  ${notifBlocked ? "Bị chặn" : notifEnabled ? "Đang bật" : "Bật ngay"}
                </button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button type="submit" id="ts-save-privacy-btn" class="twin-btn twin-btn-primary">Lưu quyền cá nhân</button>
          </div>
        </form>

        ${
          admin
            ? `
        <!-- TAB 3: QUẢN TRỊ ADMIN (FULL QUYỀN WEB) -->
        <div class="twin-settings-panel ${activeTab === "admin" ? "active" : ""}" data-panel="admin">
          <form id="ts-admin-site-form" class="twin-setting-section">
            <div class="twin-setting-group-title">Thông số Web toàn hệ thống</div>
            <div class="twin-setting-group">
              <div class="twin-setting-row twin-setting-row-col">
                <label class="twin-field-label" for="ts-site-name" style="margin-bottom:2px;">Tên hiển thị Website</label>
                <input id="ts-site-name" class="twin-input" type="text" maxlength="32" value="${escapeHtml(siteSettings.siteName)}" required />
              </div>

              <div class="twin-setting-row twin-setting-row-col">
                <label class="twin-field-label" for="ts-site-announcement" style="margin-bottom:2px;">Thông báo toàn trang (Banner)</label>
                <input id="ts-site-announcement" class="twin-input" type="text" maxlength="240" placeholder="Để trống nếu muốn ẩn banner thông báo..." value="${escapeHtml(siteSettings.announcement)}" />
              </div>

              <label class="twin-setting-row">
                <div class="twin-setting-info">
                  <div class="twin-setting-label">Cho phép đăng bài mã HTML</div>
                  <div class="twin-setting-desc">Tắt nếu chỉ muốn Admin dùng chế độ đăng bài HTML.</div>
                </div>
                <input type="checkbox" id="ts-site-allow-html" class="twin-switch" ${siteSettings.allowHtmlPosts ? "checked" : ""} />
              </label>

              <div class="twin-setting-row">
                <div class="twin-setting-info">
                  <div class="twin-setting-label">Số bài bảng tin mặc định</div>
                  <div class="twin-setting-desc">Áp dụng cho thành viên chưa tự chỉnh thông số bảng tin.</div>
                </div>
                <select id="ts-site-feedsize" class="twin-select" style="width:auto;min-width:128px;">
                  ${[5, 10, 15, 20].map((n) => `<option value="${n}" ${siteSettings.defaultFeedPageSize === n ? "selected" : ""}>${n} bài / lượt</option>`).join("")}
                </select>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px;">
              <button type="submit" id="ts-save-site-btn" class="twin-btn twin-btn-primary twin-btn-sm">Lưu cấu hình Web</button>
            </div>
          </form>

          <div class="twin-setting-section">
            <div class="twin-setting-group-title">Phân quyền tài khoản Admin</div>
            <div class="twin-setting-group" style="padding:14px 16px;">
              <p class="twin-setting-desc" style="margin-bottom:10px;">
                Admin có toàn quyền quản trị bài viết, tin ngắn, thông số web toàn hệ thống và cấp/gỡ quyền Admin cho tài khoản khác.
              </p>
              <form id="ts-admin-grant-email-form" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                <input id="ts-admin-email-input" class="twin-input" type="email" placeholder="Nhập email để nâng cấp lên Admin..." style="flex:1;min-width:200px;" required />
                <button type="submit" id="ts-admin-grant-email-btn" class="twin-btn twin-btn-primary twin-btn-sm">Cấp Admin</button>
              </form>
              <input id="ts-admin-user-search" class="twin-input" type="search" placeholder="Tìm thành viên theo tên hoặc email..." style="margin-bottom:10px;" />
              <div id="ts-admin-user-list" class="twin-admin-user-list"></div>
            </div>
          </div>
        </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  backdrop.classList.add("open");

  const closeModal = () => backdrop.classList.remove("open");
  backdrop.querySelector("#ts-close-btn").onclick = closeModal;

  backdrop.querySelectorAll(".twin-settings-tab").forEach((tabBtn) => {
    tabBtn.onclick = () => {
      const target = tabBtn.dataset.tab;
      backdrop.querySelectorAll(".twin-settings-tab").forEach((b) => b.classList.toggle("active", b === tabBtn));
      backdrop.querySelectorAll(".twin-settings-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === target));
      if (target === "admin") renderAdminUserList(backdrop.querySelector("#ts-admin-user-search")?.value || "");
    };
  });

  backdrop.querySelectorAll(".ts-theme-opt").forEach((btn) => {
    btn.onclick = () => {
      const val = btn.dataset.themeVal;
      backdrop.querySelectorAll(".ts-theme-opt").forEach((b) => b.classList.toggle("active", b === btn));
      saveWebPrefs({ theme: val });
    };
  });

  backdrop.querySelectorAll(".twin-accent-swatch").forEach((btn) => {
    btn.onclick = () => {
      const val = btn.dataset.accentVal;
      backdrop.querySelectorAll(".twin-accent-swatch").forEach((b) => b.classList.toggle("active", b === btn));
      saveWebPrefs({ accent: val });
    };
  });

  backdrop.querySelector("#ts-pref-glass").onchange = (e) => {
    saveWebPrefs({ glass: e.target.checked ? "full" : "reduced" });
  };
  backdrop.querySelector("#ts-pref-motion").onchange = (e) => {
    saveWebPrefs({ motion: e.target.checked ? "full" : "reduced" });
  };
  backdrop.querySelector("#ts-pref-grid").onchange = (e) => {
    saveWebPrefs({ bgGrid: e.target.checked });
  };
  backdrop.querySelector("#ts-pref-sound").onchange = (e) => {
    saveWebPrefs({ sound: e.target.checked });
    if (e.target.checked) playNotifChime();
  };
  backdrop.querySelector("#ts-pref-fontsize").onchange = (e) => {
    saveWebPrefs({ fontSize: e.target.value });
  };
  backdrop.querySelector("#ts-pref-density").onchange = (e) => {
    saveWebPrefs({ density: e.target.value });
  };
  backdrop.querySelector("#ts-pref-feedsize").onchange = (e) => {
    saveWebPrefs({ feedPageSize: Number(e.target.value) || 5 });
    showToast(`Đã đổi chế độ tải ${e.target.value} bài viết mỗi lượt.`);
  };
  backdrop.querySelector("#ts-reset-prefs").onclick = () => {
    saveWebPrefs({ ...DEFAULT_WEB_PREFS });
    openAccountSettingsModal("effects");
    showToast("Đã khôi phục cài đặt giao diện mặc định.");
  };

  backdrop.querySelector("#ts-send-reset-pass").onclick = async () => {
    if (!userEmail) return showToast("Tài khoản chưa có địa chỉ email.");
    try {
      await resetPassword(userEmail);
      showToast(`Đã gửi liên kết đặt lại mật khẩu tới ${userEmail}!`);
    } catch (err) {
      showToast(friendlyError(err));
    }
  };

  const savePassBtn = backdrop.querySelector("#ts-save-password-btn");
  if (savePassBtn) {
    savePassBtn.onclick = async () => {
      const curEl = backdrop.querySelector("#ts-pass-current");
      const newEl = backdrop.querySelector("#ts-pass-new");
      const confEl = backdrop.querySelector("#ts-pass-confirm");
      const currentPassword = curEl ? curEl.value : "";
      const newPassword = newEl ? newEl.value : "";
      const confirmPassword = confEl ? confEl.value : "";

      if (newPassword.length < 6) return showToast("Mật khẩu mới cần có ít nhất 6 ký tự.");
      if (newPassword !== confirmPassword) return showToast("Mật khẩu nhập lại không khớp.");

      savePassBtn.disabled = true;
      const oldText = savePassBtn.textContent;
      savePassBtn.textContent = "Đang lưu...";
      try {
        const mode = await setOrChangePassword({ currentPassword, newPassword });
        if (curEl) curEl.value = "";
        if (newEl) newEl.value = "";
        if (confEl) confEl.value = "";
        showToast(mode === "linked" ? "Đã đặt mật khẩu thành công!" : "Đã đổi mật khẩu thành công!");
        if (mode === "linked") openAccountSettingsModal("privacy");
      } catch (err) {
        showToast(friendlyError(err));
      } finally {
        savePassBtn.disabled = false;
        savePassBtn.textContent = oldText;
      }
    };
  }

  if (focusPassword) {
    setTimeout(() => {
      const sec = backdrop.querySelector("#ts-password-section");
      sec?.scrollIntoView({ behavior: "smooth", block: "center" });
      (backdrop.querySelector("#ts-pass-current") || backdrop.querySelector("#ts-pass-new"))?.focus();
    }, 60);
  }

  const browserNotifBtn = backdrop.querySelector("#ts-browser-notif-btn");
  if (browserNotifBtn && !notifBlocked) {
    browserNotifBtn.onclick = async () => {
      if (!("Notification" in window)) return showToast("Trình duyệt không hỗ trợ thông báo đẩy.");
      if (Notification.permission === "granted") {
        const next = isBrowserNotifEnabled() ? "off" : "on";
        localStorage.setItem("twin_browser_notifs", next);
        renderNotifPermBar();
        browserNotifBtn.textContent = next === "on" ? "Đang bật" : "Bật ngay";
        browserNotifBtn.className = `twin-btn ${next === "on" ? "twin-btn-primary" : "twin-btn-secondary"} twin-btn-sm`;
        showToast(next === "on" ? "Đã bật thông báo trình duyệt!" : "Đã tạm tắt thông báo trình duyệt.");
        return;
      }
      try {
        const result = await Notification.requestPermission();
        if (result === "granted") {
          localStorage.setItem("twin_browser_notifs", "on");
          renderNotifPermBar();
          browserNotifBtn.textContent = "Đang bật";
          browserNotifBtn.className = "twin-btn twin-btn-primary twin-btn-sm";
          showToast("Đã bật thông báo trình duyệt!");
        } else {
          showToast("Bạn chưa cấp quyền thông báo trình duyệt.");
        }
      } catch {
        showToast("Không thể yêu cầu quyền thông báo.");
      }
    };
  }

  backdrop.querySelector("#ts-privacy-form").onsubmit = async (e) => {
    e.preventDefault();
    const saveBtn = backdrop.querySelector("#ts-save-privacy-btn");
    const nextName = backdrop.querySelector("#ts-priv-name").value.trim().slice(0, 60) || currentUserData.name;
    const payload = {
      name: nextName,
      showEmail: backdrop.querySelector("#ts-priv-show-email").checked,
      showPersonalInfo: backdrop.querySelector("#ts-priv-show-info").checked,
      allowMessagesFrom: backdrop.querySelector("#ts-priv-msg-from").value === "friends" ? "friends" : "everyone",
      allowFriendRequests: backdrop.querySelector("#ts-priv-friend-req").checked,
      showActivity: backdrop.querySelector("#ts-priv-activity").checked
    };
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";
    try {
      await updateDoc(doc(db, "users", currentUserData.uid), payload);
      if (auth?.currentUser && nextName !== currentUserData.name) {
        updateProfile(auth.currentUser, { displayName: nextName }).catch(() => {});
      }
      Object.assign(currentUserData, payload);
      showToast("Đã lưu cài đặt quyền cá nhân!");
    } catch (err) {
      showToast(friendlyError(err));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu quyền cá nhân";
    }
  };

  if (admin) {
    renderAdminUserList("");
    backdrop.querySelector("#ts-admin-user-search").addEventListener("input", (e) => {
      renderAdminUserList(e.target.value);
    });

    const grantEmailForm = backdrop.querySelector("#ts-admin-grant-email-form");
    if (grantEmailForm) {
      grantEmailForm.onsubmit = async (e) => {
        e.preventDefault();
        const emailInput = backdrop.querySelector("#ts-admin-email-input");
        const btn = backdrop.querySelector("#ts-admin-grant-email-btn");
        const cleanEmail = String(emailInput.value || "").trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return showToast("Vui lòng nhập địa chỉ email hợp lệ.");
        }
        btn.disabled = true;
        btn.textContent = "Đang xử lý...";
        try {
          await setDoc(doc(db, "settings", "web"), { adminEmails: arrayUnion(cleanEmail) }, { merge: true });
          const matched = searchDirectory.users.filter((u) => String(u.email || "").trim().toLowerCase() === cleanEmail);
          let upgradedCount = 0;
          if (matched.length) {
            for (const u of matched) {
              await updateDoc(doc(db, "users", u.uid || u.id), { role: "admin" });
              upgradedCount++;
            }
          } else {
            const snap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
            for (const d of snap.docs) {
              await updateDoc(doc(db, "users", d.id), { role: "admin" });
              upgradedCount++;
            }
          }
          emailInput.value = "";
          showToast(
            upgradedCount > 0
              ? `Đã nâng cấp ${cleanEmail} lên Admin!`
              : `Đã thêm ${cleanEmail} vào danh sách Admin (tự động kích hoạt khi đăng nhập).`
          );
        } catch (err) {
          showToast(friendlyError(err));
        } finally {
          btn.disabled = false;
          btn.textContent = "Cấp Admin";
        }
      };
    }

    backdrop.querySelector("#ts-admin-site-form").onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = backdrop.querySelector("#ts-save-site-btn");
      const nextSite = {
        siteName: backdrop.querySelector("#ts-site-name").value.trim().slice(0, 32) || "Twin",
        announcement: backdrop.querySelector("#ts-site-announcement").value.trim().slice(0, 240),
        allowHtmlPosts: backdrop.querySelector("#ts-site-allow-html").checked,
        defaultFeedPageSize: Number(backdrop.querySelector("#ts-site-feedsize").value) || 5,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserData.uid
      };
      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu...";
      try {
        await setDoc(doc(db, "settings", "web"), nextSite, { merge: true });
        showToast("Đã cập nhật cấu hình Web toàn hệ thống!");
      } catch (err) {
        showToast(friendlyError(err));
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Lưu cấu hình Web";
      }
    };
  }
}

function playNotifChime() {
  if (!getWebPrefs().sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  } catch {}
  try { navigator.vibrate?.(70); } catch {}
}

function isBrowserNotifEnabled() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    localStorage.getItem("twin_browser_notifs") !== "off"
  );
}

function renderNotifPermBar() {
  const bar = document.getElementById("twin-notif-perm-bar");
  if (!bar) return;
  if (typeof window === "undefined" || !("Notification" in window)) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "flex";

  if (Notification.permission === "denied") {
    bar.innerHTML = `
      <span>Thông báo trình duyệt đang bị chặn</span>
      <span style="font-size:11.5px;color:var(--text-3);font-weight:600;">Cài đặt trình duyệt</span>
    `;
    return;
  }

  const enabled = isBrowserNotifEnabled();
  bar.innerHTML = `
    <span>${enabled ? "Đang bật nhận thông báo mới" : "Nhận thông báo tức thì trên thiết bị"}</span>
    <button type="button" id="twin-notif-perm-btn" class="twin-notif-perm-btn ${enabled ? "enabled" : ""}">
      ${enabled ? "Đang bật" : "Bật ngay"}
    </button>
  `;

  const btn = document.getElementById("twin-notif-perm-btn");
  if (!btn) return;
  btn.onclick = async (e) => {
    e.stopPropagation();
    if (Notification.permission === "granted") {
      const next = enabled ? "off" : "on";
      localStorage.setItem("twin_browser_notifs", next);
      renderNotifPermBar();
      showToast(next === "on" ? "Đã bật nhận thông báo!" : "Đã tạm tắt thông báo trình duyệt.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        localStorage.setItem("twin_browser_notifs", "on");
        showToast("Đã bật nhận thông báo!");
      } else {
        showToast("Bạn chưa cấp quyền nhận thông báo trình duyệt.");
      }
    } catch {
      showToast("Trình duyệt không hỗ trợ bật thông báo.");
    }
    renderNotifPermBar();
  };
}

function showLiveNotificationPopup(n) {
  playNotifChime();
  const targetBtn = document.getElementById(isMessageNotif(n) ? "twin-chat-btn" : "twin-notif-btn");
  if (targetBtn) {
    targetBtn.classList.remove("twin-bell-ring");
    void targetBtn.offsetWidth;
    targetBtn.classList.add("twin-bell-ring");
  }

  let stack = document.getElementById("twin-notif-popup-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "twin-notif-popup-stack";
    stack.className = "twin-notif-popup-stack";
    document.body.appendChild(stack);
  }

  const card = document.createElement("div");
  card.className = "twin-notif-popup";
  card.innerHTML = `
    <a href="${escapeHtml(safeLink(n.link))}" class="twin-notif-popup-link">
      <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(n.fromAvatar || DEFAULT_AVATAR)}" alt="" />
      <div style="min-width:0;flex:1;">
        <div style="font-size:13.5px;line-height:1.35;"><strong>${escapeHtml(n.fromName || "Ai đó")}</strong> ${escapeHtml(n.text || "")}</div>
        <div class="twin-post-meta" style="font-size:11.5px;">Vừa xong · Nhấn để xem</div>
      </div>
    </a>
    <button type="button" class="twin-notif-popup-close" aria-label="Đóng thông báo">✕</button>
  `;

  const dismiss = () => {
    if (!card.isConnected) return;
    card.classList.add("closing");
    setTimeout(() => card.remove(), 200);
  };

  card.querySelector(".twin-notif-popup-close").onclick = (e) => {
    e.stopPropagation();
    dismiss();
  };
  card.querySelector(".twin-notif-popup-link").onclick = () => {
    if (n.id && db) {
      updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
    }
  };

  stack.prepend(card);
  while (stack.children.length > 3) {
    stack.lastElementChild?.remove();
  }
  setTimeout(dismiss, 5200);

  if (isBrowserNotifEnabled()) {
    try {
      const browserNotif = new Notification(`${n.fromName || "Twin"}`, {
        body: n.text || "Bạn có thông báo mới trên Twin",
        icon: n.fromAvatar || DEFAULT_AVATAR
      });
      browserNotif.onclick = () => {
        window.focus();
        if (n.id && db) {
          updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
        }
        window.location.href = safeLink(n.link);
        browserNotif.close();
      };
    } catch {}
  }
}

function subscribeNotifications(uid) {
  if (!db) return;
  if (unsubNotifs) unsubNotifs();
  notifsInitialized = false;
  seenNotifIds.clear();
  const q = query(collection(db, "notifications"), where("toUid", "==", uid));
  unsubNotifs = onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => getNotifTimeMs(b) - getNotifTimeMs(a));

    latestNotifItems = items;

    // Tự động đánh dấu đã đọc tin nhắn từ người đang mở khung trò chuyện
    const autoReadPeers = new Set();
    if (activeChatPeerUid) autoReadPeers.add(activeChatPeerUid);
    openChats.forEach((_, peerUid) => autoReadPeers.add(peerUid));
    autoReadPeers.forEach((peerUid) => {
      const unreadForPeer = latestNotifItems.filter((n) => !n.read && isMessageNotif(n) && n.fromUid === peerUid);
      if (unreadForPeer.length) {
        markChatNotifsFromPeerRead(peerUid);
      }
    });

    if (!notifsInitialized) {
      items.forEach((n) => seenNotifIds.add(n.id));
      notifsInitialized = true;
    } else {
      const freshUnread = [];
      for (const n of items) {
        if (!seenNotifIds.has(n.id)) {
          seenNotifIds.add(n.id);
          if (!n.read && !(isMessageNotif(n) && autoReadPeers.has(n.fromUid))) {
            freshUnread.push(n);
          }
        }
      }
      freshUnread.slice(0, 2).forEach((n) => showLiveNotificationPopup(n));
    }

    const notifDrop = document.getElementById("twin-notif-dropdown");
    const isDropdownOpen = notifDrop && notifDrop.classList.contains("open");
    if (isDropdownOpen && latestNotifItems.some((n) => !n.read && !isMessageNotif(n))) {
      markAllGeneralNotificationsRead();
    } else {
      updateAllBadges();
    }
    renderNotifList();
  }, (err) => console.warn("Notifications:", err));
}

export function openTwinChat(peer) {
  if (!currentUserData || !peer || peer.uid === currentUserData.uid) return;
  if (
    peer.allowMessagesFrom === "friends" &&
    !isUserAdmin(currentUserData) &&
    !(currentUserData.friends || []).includes(peer.uid)
  ) {
    showToast("Người này chỉ nhận tin nhắn từ bạn bè.");
    return;
  }
  if (window.innerWidth <= 820) {
    window.location.href = `./messages.html?uid=${encodeURIComponent(peer.uid)}`;
    return;
  }
  let dock = document.getElementById("twin-chat-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.id = "twin-chat-dock";
    dock.className = "twin-chat-dock";
    document.body.appendChild(dock);
  }
  if (openChats.has(peer.uid)) {
    markChatNotifsFromPeerRead(peer.uid);
    return;
  }
  markChatNotifsFromPeerRead(peer.uid);

  const chatId = getChatId(currentUserData.uid, peer.uid);
  const box = document.createElement("div");
  box.className = "twin-chat-box";
  box.innerHTML = `
    <div class="twin-chat-head">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(peer.avatar || DEFAULT_AVATAR)}" alt="" />
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(peer.name)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <a href="./messages.html?uid=${encodeURIComponent(peer.uid)}" class="twin-icon-btn" style="width:28px;height:28px;font-size:13px;" title="Mở toàn màn hình">⤢</a>
        <button class="twin-icon-btn chat-close" style="width:28px;height:28px;font-size:14px;" title="Đóng">✕</button>
      </div>
    </div>
    <div class="twin-chat-messages"></div>
    <form class="twin-chat-form">
      <input class="twin-input" type="text" placeholder="Nhắn tin..." required style="padding:8px 12px;" />
      <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit">Gửi</button>
    </form>
  `;
  dock.appendChild(box);

  const msgWrap = box.querySelector(".twin-chat-messages");
  const q = query(collection(db, "messages", chatId, "items"), orderBy("createdAt", "asc"));
  const unsub = onSnapshot(q, (snap) => {
    msgWrap.innerHTML = "";
    snap.forEach((d) => {
      const m = d.data();
      const div = document.createElement("div");
      div.className = `twin-msg ${m.senderUid === currentUserData.uid ? "me" : "them"}`;
      if (m.text) {
        const p = document.createElement("div");
        p.textContent = m.text;
        div.appendChild(p);
      }
      if (m.imageUrl) {
        const img = document.createElement("img");
        img.src = m.imageUrl;
        img.alt = "Ảnh";
        div.appendChild(img);
      }
      msgWrap.appendChild(div);
    });
    msgWrap.scrollTop = msgWrap.scrollHeight;
  }, (err) => {
    console.warn("Chat:", err);
    msgWrap.textContent = friendlyError(err);
  });

  box.querySelector(".twin-chat-form").onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    try {
      await addDoc(collection(db, "messages", chatId, "items"), {
        senderUid: currentUserData.uid,
        text,
        createdAt: serverTimestamp()
      });
      pushNotification(peer.uid, {
        fromUid: currentUserData.uid,
        fromName: currentUserData.name,
        fromAvatar: currentUserData.avatar || DEFAULT_AVATAR,
        type: "message",
        text: `đã nhắn: "${text.slice(0, 45)}"`,
        link: `./messages.html?uid=${encodeURIComponent(currentUserData.uid)}`
      }).catch((err) => console.warn("Mini chat notification:", err));
    } catch (err) {
      console.error(err);
      input.value = text;
      showToast(friendlyError(err));
    }
  };

  box.querySelector(".chat-close").onclick = () => {
    unsub();
    openChats.delete(peer.uid);
    box.remove();
  };

  openChats.set(peer.uid, { box, unsub });
}

export function initTwinPage({ requireAuth = true, chrome = true, ensureProfile = true, onReady = null } = {}) {
  applySavedTheme();
  if (chrome) renderAppChrome();

  if (!isFirebaseConfigured()) {
    if (onReady) onReady(null);
    return;
  }

  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      currentUserData = null;
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }
      if (unsubSiteSettings) { unsubSiteSettings(); unsubSiteSettings = null; }
      if (requireAuth) {
        window.location.href = "./login.html";
        return;
      }
      if (onReady) onReady(null);
      return;
    }

    if (!ensureProfile) {
      if (onReady) onReady({ uid: fbUser.uid });
      return;
    }

    let profile;
    try {
      profile = await ensureUserDoc(fbUser);
    } catch (err) {
      console.error(err);
      showToast(friendlyError(err));
      if (onReady) onReady(null);
      return;
    }
    currentUserData = profile;
    if (profile.preferences && !localStorage.getItem("twin_web_prefs_v2")) {
      saveWebPrefs(profile.preferences, { syncCloud: false });
    }
    if (chrome) {
      renderLoggedInHeaderRight(profile);
      subscribeNotifications(fbUser.uid);
      subscribeGlobalSearchDirectory();
      subscribeSiteSettings();
    }

    if (unsubUser) unsubUser();
    let prevIsAdmin = isUserAdmin(profile);
    unsubUser = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
      if (!snap.exists()) return;
      Object.assign(profile, snap.data());
      currentUserData = profile;
      const nowIsAdmin = isUserAdmin(profile);
      if (chrome) {
        if (nowIsAdmin !== prevIsAdmin) {
          prevIsAdmin = nowIsAdmin;
          renderLoggedInHeaderRight(profile);
          updateAllBadges();
          renderNotifList();
        } else {
          document.querySelectorAll("#twin-account-btn img, #twin-account-dropdown img").forEach((img) => {
            const next = profile.avatar || DEFAULT_AVATAR;
            if (img.getAttribute("src") !== next) img.src = next;
          });
          const nameEl = document.getElementById("twin-account-name");
          if (nameEl && nameEl.textContent !== profile.name) nameEl.textContent = profile.name;
        }
      }
    }, (err) => console.warn("User doc:", err));

    if (onReady) onReady(profile);
  });
}
