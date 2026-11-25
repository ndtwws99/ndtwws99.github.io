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
  updateDoc,
  writeBatch,
  serverTimestamp,
  ensureUserDoc,
  DEFAULT_AVATAR,
  escapeHtml,
  formatTime,
  toMillis,
  getChatId,
  safeLink,
  friendlyError,
  showToast,
  pushNotification,
  resetPassword
} from "./firebase-service.js";

export const ICONS = {
  home: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7"/><path d="M5 9v10a2 2 0 0 0 2 2h3v-6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v6h3a2 2 0 0 0 2-2V9"/></svg>`,
  friends: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  groups: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="19" cy="9" r="2.2"/><path d="M22 19a4.5 4.5 0 0 0-3-4.2"/><circle cx="5" cy="9" r="2.2"/><path d="M2 19a4.5 4.5 0 0 1 3-4.2"/></svg>`,
  pages: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>`,
  bell: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  bookmark: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  key: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  logout: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

let currentUserData = null;
let unsubNotifs = null;
let unsubUser = null;
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

export function applySavedTheme() {
  const saved = localStorage.getItem("twin_theme_ww") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("twin_theme_ww", next);
  const iconBtn = document.getElementById("twin-theme-btn");
  if (iconBtn) iconBtn.innerHTML = next === "dark" ? ICONS.sun : ICONS.moon;
  const label = document.getElementById("twin-theme-label");
  if (label) label.textContent = next === "dark" ? "Chế độ Sáng" : "Chế độ Tối";
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
          <span class="twin-logo-circle">T</span>
          <span>Twin</span>
        </a>
        <div class="twin-search-wrap" id="twin-search-wrap">
          <div class="twin-search-box">
            ${ICONS.search}
            <input id="twin-global-search" type="search" autocomplete="off" placeholder="Tìm người, nhóm, trang, bài viết..." />
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
  if (searchInput && searchWrap) {
    searchWrap.addEventListener("click", (e) => e.stopPropagation());
    searchInput.addEventListener("input", () => {
      renderGlobalSearchResults(searchInput.value);
    });
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) renderGlobalSearchResults(searchInput.value);
    });
    searchInput.addEventListener("keydown", (e) => {
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

  wrap.innerHTML = `
    <a href="./messages.html" id="twin-chat-btn" class="twin-icon-btn" title="Tin nhắn Twin Chat" aria-label="Tin nhắn Twin Chat">
      ${ICONS.chat}
      <span class="twin-badge" id="twin-chat-badge" style="display:none">0</span>
    </a>
    <button class="twin-icon-btn" id="twin-notif-btn" title="Thông báo" aria-label="Thông báo">
      ${ICONS.bell}
      <span class="twin-badge" id="twin-notif-badge" style="display:none">0</span>
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

    <div class="twin-dropdown" id="twin-account-dropdown" style="width:270px;">
      <a href="./profile.html" class="twin-dropdown-item">
        <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="" />
        <div style="min-width:0;">
          <div id="twin-account-name" style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user.name)}</div>
          <div class="twin-post-meta">Xem trang cá nhân</div>
        </div>
      </a>
      <hr style="border:none;border-top:1px solid var(--border);margin:8px 0;" />
      <a href="./saved.html" class="twin-dropdown-item">${ICONS.bookmark}<span>Bài viết đã lưu</span></a>
      <button class="twin-dropdown-item" id="twin-menu-theme">${isDark ? ICONS.sun : ICONS.moon}<span id="twin-theme-label">${isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span></button>
      <button class="twin-dropdown-item" id="twin-reset-pass-btn">${ICONS.key}<span>Đặt lại mật khẩu</span></button>
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
    });
    document.addEventListener("click", (e) => {
      if (e.target.classList && e.target.classList.contains("twin-modal-backdrop")) e.target.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".twin-modal-backdrop.open").forEach((m) => m.classList.remove("open"));
        document.getElementById("twin-search-dropdown")?.classList.remove("open");
      }
    });
  }

  notifDrop.addEventListener("click", (e) => e.stopPropagation());

  renderNotifPermBar();

  document.getElementById("twin-theme-btn").onclick = toggleTheme;
  document.getElementById("twin-menu-theme").onclick = toggleTheme;
  document.getElementById("twin-reset-pass-btn").onclick = async () => {
    const email = auth?.currentUser?.email || currentUserData?.email;
    if (!email) return showToast("Tài khoản chưa có địa chỉ email để đặt lại mật khẩu.");
    try {
      await resetPassword(email);
      document.getElementById("twin-account-dropdown")?.classList.remove("open");
      showToast(`Đã gửi liên kết đặt lại mật khẩu tới ${email}!`);
    } catch (err) {
      showToast(friendlyError(err));
    }
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

function playNotifChime() {
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
    if (chrome) {
      renderLoggedInHeaderRight(profile);
      subscribeNotifications(fbUser.uid);
      subscribeGlobalSearchDirectory();
    }

    if (unsubUser) unsubUser();
    unsubUser = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
      if (!snap.exists()) return;
      Object.assign(profile, snap.data());
      currentUserData = profile;
      if (chrome) {
        document.querySelectorAll("#twin-account-btn img, #twin-account-dropdown img").forEach((img) => {
          const next = profile.avatar || DEFAULT_AVATAR;
          if (img.getAttribute("src") !== next) img.src = next;
        });
        const nameEl = document.getElementById("twin-account-name");
        if (nameEl && nameEl.textContent !== profile.name) nameEl.textContent = profile.name;
      }
    }, (err) => console.warn("User doc:", err));

    if (onReady) onReady(profile);
  });
}
