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
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  ensureUserDoc,
  DEFAULT_AVATAR,
  escapeHtml,
  formatTime,
  getChatId,
  showToast
} from "./firebase-service.js";

let currentUserData = null;
let unsubNotifs = null;
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
  const btn = document.getElementById("twin-theme-label");
  if (btn) btn.textContent = next === "dark" ? "Chế độ Sáng" : "Chế độ Tối";
}

function getCurrentPageKey() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("friends.html")) return "friends";
  if (path.endsWith("groups.html")) return "groups";
  if (path.endsWith("pages.html")) return "pages";
  if (path.endsWith("profile.html")) return "profile";
  if (path.endsWith("saved.html")) return "saved";
  if (path.endsWith("login.html")) return "login";
  if (path.endsWith("404.html")) return "404";
  return "home";
}

export function renderSharedChrome() {
  applySavedTheme();

  // Config banner if Firebase not configured
  if (!isFirebaseConfigured() && !document.getElementById("twin-cfg-banner")) {
    const banner = document.createElement("div");
    banner.id = "twin-cfg-banner";
    banner.className = "twin-config-banner";
    banner.innerHTML =
      'Chế độ xem trước giao diện Twin — Hãy điền <code>firebaseConfig</code> &amp; <code>cloudinaryConfig</code> trong <code>assets/js/config.js</code> để bật đồng bộ thời gian thực.';
    document.body.prepend(banner);
  }

  const page = getCurrentPageKey();
  const headerEl = document.getElementById("twin-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="twin-header-left">
        <a href="./index.html" class="twin-logo" title="Trang chủ Twin">
          <span class="twin-logo-badge">T</span>
          <span>Twin</span>
        </a>
        <div class="twin-search-box">
          <span>🔍</span>
          <input id="twin-global-search" type="search" placeholder="Tìm kiếm trên Twin..." />
        </div>
      </div>

      <nav class="twin-nav-center" aria-label="Điều hướng chính">
        <a href="./index.html" class="twin-nav-link ${page === "home" ? "active" : ""}" title="Bảng tin">
          <span>🏠</span><span class="nav-label">Bảng tin</span>
        </a>
        <a href="./friends.html" class="twin-nav-link ${page === "friends" ? "active" : ""}" title="Bạn bè">
          <span>👥</span><span class="nav-label">Bạn bè</span>
        </a>
        <a href="./groups.html" class="twin-nav-link ${page === "groups" ? "active" : ""}" title="Nhóm">
          <span>🏘️</span><span class="nav-label">Nhóm</span>
        </a>
        <a href="./pages.html" class="twin-nav-link ${page === "pages" ? "active" : ""}" title="Trang">
          <span>🚩</span><span class="nav-label">Trang</span>
        </a>
      </nav>

      <div class="twin-header-right" id="twin-header-right">
        <a href="./login.html" class="twin-btn twin-btn-primary twin-btn-sm">Đăng nhập</a>
      </div>
    `;
  }

  const footerEl = document.getElementById("twin-footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="twin-footer-inner">
        <div><strong>Twin</strong> © ${new Date().getFullYear()} · Mạng xã hội chạy trên GitHub Pages (Firebase + Cloudinary)</div>
        <div class="twin-footer-links">
          <a href="./index.html">Bảng tin</a>
          <a href="./friends.html">Bạn bè</a>
          <a href="./groups.html">Nhóm</a>
          <a href="./pages.html">Trang</a>
          <a href="./saved.html">Đã lưu</a>
          <a href="./profile.html">Trang cá nhân</a>
        </div>
      </div>
    `;
  }
}

function renderLoggedInHeaderRight(user) {
  const wrap = document.getElementById("twin-header-right");
  if (!wrap) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  wrap.innerHTML = `
    <button class="twin-icon-btn" id="twin-notif-btn" title="Thông báo">
      🔔<span class="twin-badge" id="twin-notif-badge" style="display:none">0</span>
    </button>
    <button class="twin-icon-btn" id="twin-theme-btn" title="Đổi giao diện Sáng / Tối">
      ${isDark ? "☀️" : "🌙"}
    </button>
    <button id="twin-account-btn" style="display:flex;align-items:center;gap:6px;" title="Tài khoản">
      <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="Avatar" />
    </button>

    <div class="twin-dropdown" id="twin-notif-dropdown">
      <div class="twin-dropdown-title">
        <span>Thông báo</span>
      </div>
      <div id="twin-notif-list"><p class="twin-post-meta">Chưa có thông báo nào.</p></div>
    </div>

    <div class="twin-dropdown" id="twin-account-dropdown" style="width:260px;">
      <a href="./profile.html" class="twin-dropdown-item">
        <img class="twin-avatar" src="${escapeHtml(user.avatar || DEFAULT_AVATAR)}" alt="" />
        <div>
          <div style="font-weight:700">${escapeHtml(user.name)}</div>
          <div class="twin-post-meta">Xem trang cá nhân</div>
        </div>
      </a>
      <hr style="border:none;border-top:1px solid var(--twin-border);margin:8px 0;" />
      <a href="./saved.html" class="twin-dropdown-item">🔖 Bài viết đã lưu</a>
      <button class="twin-dropdown-item" id="twin-menu-theme">🌓 <span id="twin-theme-label">${isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span></button>
      <button class="twin-dropdown-item" id="twin-logout-btn" style="color:var(--twin-danger)">🚪 Đăng xuất</button>
    </div>
  `;

  const notifBtn = document.getElementById("twin-notif-btn");
  const notifDrop = document.getElementById("twin-notif-dropdown");
  const accBtn = document.getElementById("twin-account-btn");
  const accDrop = document.getElementById("twin-account-dropdown");

  notifBtn.onclick = (e) => {
    e.stopPropagation();
    accDrop.classList.remove("open");
    notifDrop.classList.toggle("open");
  };
  accBtn.onclick = (e) => {
    e.stopPropagation();
    notifDrop.classList.remove("open");
    accDrop.classList.toggle("open");
  };
  document.addEventListener("click", () => {
    notifDrop.classList.remove("open");
    accDrop.classList.remove("open");
  });

  document.getElementById("twin-theme-btn").onclick = () => {
    toggleTheme();
    document.getElementById("twin-theme-btn").textContent =
      document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  };
  document.getElementById("twin-menu-theme").onclick = () => {
    toggleTheme();
    document.getElementById("twin-theme-btn").textContent =
      document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  };
  document.getElementById("twin-logout-btn").onclick = async () => {
    await signOut(auth);
    window.location.href = "./login.html";
  };
}

function subscribeNotifications(uid) {
  if (!db) return;
  if (unsubNotifs) unsubNotifs();
  const q = query(
    collection(db, "notifications"),
    where("toUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  unsubNotifs = onSnapshot(q, (snap) => {
    const listEl = document.getElementById("twin-notif-list");
    const badge = document.getElementById("twin-notif-badge");
    if (!listEl || !badge) return;
    let unread = 0;
    const items = [];
    snap.forEach((d) => {
      const n = { id: d.id, ...d.data() };
      if (!n.read) unread++;
      items.push(n);
    });
    badge.style.display = unread > 0 ? "grid" : "none";
    badge.textContent = unread > 9 ? "9+" : String(unread);

    if (!items.length) {
      listEl.innerHTML = '<p class="twin-post-meta" style="padding:8px">Chưa có thông báo nào.</p>';
      return;
    }
    listEl.innerHTML = items
      .slice(0, 15)
      .map(
        (n) => `
      <a href="${escapeHtml(n.link || "./index.html")}" data-nid="${n.id}" class="twin-dropdown-item ${n.read ? "" : "twin-notif-unread"}">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(n.fromAvatar || DEFAULT_AVATAR)}" alt="" />
        <div>
          <div><strong>${escapeHtml(n.fromName)}</strong> ${escapeHtml(n.text)}</div>
          <div class="twin-post-meta">${formatTime(n.createdAt)}</div>
        </div>
      </a>`
      )
      .join("");

    listEl.querySelectorAll("a[data-nid]").forEach((a) => {
      a.addEventListener("click", () => {
        updateDoc(doc(db, "notifications", a.dataset.nid), { read: true }).catch(() => {});
      });
    });
  }, () => {});
}

export function openTwinChat(peer) {
  if (!currentUserData || !peer || peer.uid === currentUserData.uid) return;
  const dock = document.getElementById("twin-chat-dock");
  if (!dock) return;
  if (openChats.has(peer.uid)) return;

  const chatId = getChatId(currentUserData.uid, peer.uid);
  const box = document.createElement("div");
  box.className = "twin-chat-box";
  box.innerHTML = `
    <div class="twin-chat-head">
      <div style="display:flex;align-items:center;gap:8px;">
        <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(peer.avatar || DEFAULT_AVATAR)}" alt="" />
        <span>${escapeHtml(peer.name)}</span>
      </div>
      <button class="chat-close" style="color:#fff;font-size:18px;">✕</button>
    </div>
    <div class="twin-chat-messages"></div>
    <form class="twin-chat-form">
      <input class="twin-input" type="text" placeholder="Nhắn tin trên Twin Chat..." required style="padding:7px 10px;" />
      <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit">Gửi</button>
    </form>
  `;
  dock.appendChild(box);

  const msgWrap = box.querySelector(".twin-chat-messages");
  const q = query(
    collection(db, "messages", chatId, "items"),
    orderBy("createdAt", "asc")
  );
  const unsub = onSnapshot(q, (snap) => {
    msgWrap.innerHTML = "";
    snap.forEach((d) => {
      const m = d.data();
      const div = document.createElement("div");
      div.className = `twin-msg ${m.senderUid === currentUserData.uid ? "me" : "them"}`;
      div.textContent = m.text;
      msgWrap.appendChild(div);
    });
    msgWrap.scrollTop = msgWrap.scrollHeight;
  });

  box.querySelector(".twin-chat-form").onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await addDoc(collection(db, "messages", chatId, "items"), {
      senderUid: currentUserData.uid,
      text,
      createdAt: serverTimestamp()
    });
  };

  box.querySelector(".chat-close").onclick = () => {
    unsub();
    openChats.delete(peer.uid);
    box.remove();
  };

  openChats.set(peer.uid, { box, unsub });
}

export function initTwinPage({ requireAuth = true, onReady = null } = {}) {
  renderSharedChrome();

  if (!isFirebaseConfigured()) {
    if (onReady) onReady(null);
    return;
  }

  onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      currentUserData = null;
      if (requireAuth) {
        window.location.href = "./login.html";
        return;
      }
      if (onReady) onReady(null);
      return;
    }

    const profile = await ensureUserDoc(fbUser);
    currentUserData = profile;
    renderLoggedInHeaderRight(profile);
    subscribeNotifications(fbUser.uid);

    // Real-time update of current user profile
    onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
      if (snap.exists()) {
        currentUserData = snap.data();
      }
    });

    if (onReady) onReady(profile);
  });
}

export function getCurrentUser() {
  return currentUserData;
}
