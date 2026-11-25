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
  showToast
} from "./firebase-service.js";

export const ICONS = {
  home: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>`,
  friends: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  groups: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>`,
  pages: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  bell: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  bookmark: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  logout: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

let currentUserData = null;
let unsubNotifs = null;
let unsubUser = null;
let unsubSearchUsers = null;
let unsubSearchGroups = null;
let unsubSearchPages = null;
let globalListenersBound = false;
let latestNotifItems = [];

const searchDirectory = {
  users: [],
  groups: [],
  pages: []
};
const openChats = new Map();

export function applySavedTheme() {
  const saved = localStorage.getItem("twin_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
}

export function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("twin_theme", next);
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
        <a href="./messages.html" class="twin-nav-link ${page === "messages" ? "active" : ""}" title="Tin nhắn">${ICONS.chat}</a>
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
      <a href="./messages.html" class="twin-mobile-tab ${page === "messages" ? "active" : ""}">${ICONS.chat}<span>Chat</span></a>
    `;
    document.body.appendChild(mobileBar);
  }
}

function setBadgeCount(count) {
  const badge = document.getElementById("twin-notif-badge");
  if (!badge) return;
  badge.style.display = count > 0 ? "grid" : "none";
  badge.textContent = count > 9 ? "9+" : String(count);
}

async function markAllNotificationsRead() {
  setBadgeCount(0);
  const unreadDocs = latestNotifItems.filter((n) => !n.read);
  unreadDocs.forEach((n) => { n.read = true; });
  if (!db || !unreadDocs.length) return;
  try {
    const batch = writeBatch(db);
    unreadDocs.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  } catch {
    unreadDocs.forEach((n) => {
      updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
    });
  }
}

function renderNotifList() {
  const listEl = document.getElementById("twin-notif-list");
  if (!listEl) return;
  if (!latestNotifItems.length) {
    listEl.innerHTML = '<p class="twin-post-meta" style="padding:8px">Chưa có thông báo nào.</p>';
    return;
  }
  listEl.innerHTML = latestNotifItems
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
      setBadgeCount(latestNotifItems.filter((item) => !item.read).length);
      updateDoc(doc(db, "notifications", a.dataset.nid), { read: true }).catch(() => {});
    });
  });
}

function renderLoggedInHeaderRight(user) {
  const wrap = document.getElementById("twin-header-right");
  if (!wrap) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  wrap.innerHTML = `
    <a href="./messages.html" class="twin-icon-btn" title="Tin nhắn Twin Chat">${ICONS.chat}</a>
    <button class="twin-icon-btn" id="twin-notif-btn" title="Thông báo">
      ${ICONS.bell}
      <span class="twin-badge" id="twin-notif-badge" style="display:none">0</span>
    </button>
    <button class="twin-icon-btn" id="twin-theme-btn" title="Đổi giao diện Sáng / Tối">
      ${isDark ? ICONS.sun : ICONS.moon}
    </button>
    <button id="twin-account-btn" style="display:flex;align-items:center;" title="Tài khoản">
      <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="Avatar" />
    </button>

    <div class="twin-dropdown" id="twin-notif-dropdown">
      <div class="twin-dropdown-title">
        <span>Thông báo</span>
        <button id="twin-mark-all-read" style="font-size:12px;color:var(--primary);font-weight:600;">Đã đọc tất cả</button>
      </div>
      <div id="twin-notif-list"><p class="twin-post-meta" style="padding:8px">Chưa có thông báo nào.</p></div>
    </div>

    <div class="twin-dropdown" id="twin-account-dropdown" style="width:265px;">
      <a href="./profile.html" class="twin-dropdown-item">
        <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="" />
        <div>
          <div id="twin-account-name" style="font-weight:700">${escapeHtml(user.name)}</div>
          <div class="twin-post-meta">Xem trang cá nhân</div>
        </div>
      </a>
      <hr style="border:none;border-top:1px solid var(--border);margin:8px 0;" />
      <a href="./saved.html" class="twin-dropdown-item">${ICONS.bookmark}<span>Bài viết đã lưu</span></a>
      <button class="twin-dropdown-item" id="twin-menu-theme">${ICONS.moon}<span id="twin-theme-label">${isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span></button>
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
      markAllNotificationsRead();
    }
  };

  document.getElementById("twin-mark-all-read").onclick = (e) => {
    e.stopPropagation();
    markAllNotificationsRead();
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

  document.getElementById("twin-theme-btn").onclick = toggleTheme;
  document.getElementById("twin-menu-theme").onclick = toggleTheme;
  document.getElementById("twin-logout-btn").onclick = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    window.location.href = "./login.html";
  };
}

function subscribeNotifications(uid) {
  if (!db) return;
  if (unsubNotifs) unsubNotifs();
  const q = query(collection(db, "notifications"), where("toUid", "==", uid));
  unsubNotifs = onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    latestNotifItems = items;

    const notifDrop = document.getElementById("twin-notif-dropdown");
    const isDropdownOpen = notifDrop && notifDrop.classList.contains("open");
    if (isDropdownOpen && items.some((n) => !n.read)) {
      markAllNotificationsRead();
    } else {
      setBadgeCount(items.filter((n) => !n.read).length);
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
  if (openChats.has(peer.uid)) return;

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
      <input class="twin-input" type="text" placeholder="Nhắn tin..." required style="padding:8px 12px;border-radius:999px;" />
      <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit" style="border-radius:999px;">Gửi</button>
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
