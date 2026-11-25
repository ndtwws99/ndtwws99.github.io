/* ==========================================================================
   Twin Liquid Glass — Post Card & Edit Modal UI
========================================================================== */
import {
  db,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  pushNotification,
  uploadToCloudinary,
  sanitizeHtml,
  DEFAULT_AVATAR,
  escapeHtml,
  formatTime,
  toMillis,
  showToast,
  friendlyError,
  isUserAdmin
} from "./firebase-service.js";

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
// Modal chỉnh sửa bài viết (hỗ trợ cả Văn bản & Mã HTML + xem trước)
// ==========================================================================
let editingPost = null;
let editNewFile = null;
let editRemoveImage = false;
let editIsHtml = false;

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
          <div class="twin-seg-tabs">
            <button type="button" id="ep-mode-text" class="twin-seg-tab active">Văn bản</button>
            <button type="button" id="ep-mode-html" class="twin-seg-tab">&lt;/&gt; HTML</button>
          </div>
          <button type="button" id="ep-toggle-preview" class="twin-btn twin-btn-secondary twin-btn-sm" style="display:none;">Xem trước HTML</button>
        </div>

        <textarea id="ep-content" class="twin-textarea" placeholder="Nội dung bài viết..." rows="5"></textarea>

        <div id="ep-html-preview-box" class="twin-html-preview" style="display:none;margin-top:0;">
          <div class="twin-html-preview-label">Xem trước HTML</div>
          <div id="ep-html-preview-body" class="twin-post-body twin-post-html" style="margin-bottom:0;"></div>
        </div>

        <div id="ep-img-box" style="display:none;position:relative;">
          <img id="ep-img-preview" class="twin-post-image" style="max-height:240px;margin-bottom:0;" alt="Ảnh bài viết" />
          <button type="button" id="ep-img-remove" class="twin-icon-btn" style="position:absolute;top:8px;right:8px;width:30px;height:30px;" title="Gỡ ảnh">✕</button>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <label class="twin-btn twin-btn-secondary twin-btn-sm" style="cursor:pointer;">
            <span>Đổi / Thêm ảnh</span>
            <input id="ep-file-input" type="file" accept="image/*" hidden />
          </label>
          <select id="ep-feeling" class="twin-select" style="width:auto;padding:6px 12px;font-size:13px;">
            <option value="">Không có cảm xúc</option>
            <option value="hạnh phúc 😊">Hạnh phúc 😊</option>
            <option value="hào hứng 🤩">Hào hứng 🤩</option>
            <option value="thư giãn 😌">Thư giãn 😌</option>
            <option value="tự hào 💪">Tự hào 💪</option>
            <option value="buồn nhẹ 😔">Buồn nhẹ 😔</option>
          </select>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
          <button type="button" id="ep-cancel-btn" class="twin-btn twin-btn-secondary">Hủy</button>
          <button type="submit" id="ep-save-btn" class="twin-btn twin-btn-primary">Lưu thay đổi</button>
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
  };
  backdrop.querySelector("#ep-close-btn").onclick = close;
  backdrop.querySelector("#ep-cancel-btn").onclick = close;

  const contentEl = backdrop.querySelector("#ep-content");
  const modeTextBtn = backdrop.querySelector("#ep-mode-text");
  const modeHtmlBtn = backdrop.querySelector("#ep-mode-html");
  const prevToggleBtn = backdrop.querySelector("#ep-toggle-preview");
  const prevBox = backdrop.querySelector("#ep-html-preview-box");
  const prevBody = backdrop.querySelector("#ep-html-preview-body");

  const syncModeUi = () => {
    modeTextBtn.classList.toggle("active", !editIsHtml);
    modeHtmlBtn.classList.toggle("active", editIsHtml);
    contentEl.classList.toggle("code-mode", editIsHtml);
    contentEl.placeholder = editIsHtml
      ? "Nhập mã HTML (VD: <h3>Tiêu đề</h3><p>Nội dung <b>in đậm</b>...</p>)"
      : "Nội dung bài viết...";
    prevToggleBtn.style.display = editIsHtml ? "inline-flex" : "none";
    if (!editIsHtml) prevBox.style.display = "none";
  };

  modeTextBtn.onclick = () => { editIsHtml = false; syncModeUi(); };
  modeHtmlBtn.onclick = () => { editIsHtml = true; syncModeUi(); };
  prevToggleBtn.onclick = () => {
    const show = prevBox.style.display === "none";
    prevBox.style.display = show ? "block" : "none";
    if (show) prevBody.innerHTML = sanitizeHtml(contentEl.value);
  };
  contentEl.addEventListener("input", () => {
    if (editIsHtml && prevBox.style.display !== "none") {
      prevBody.innerHTML = sanitizeHtml(contentEl.value);
    }
  });

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

  backdrop.querySelector("#ep-img-remove").onclick = () => {
    editNewFile = null;
    editRemoveImage = true;
    fileInput.value = "";
    imgPrev.src = "";
    imgBox.style.display = "none";
  };

  backdrop.querySelector("#ep-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    const content = contentEl.value.trim();
    const feeling = backdrop.querySelector("#ep-feeling").value;
    const hasImageAfter = Boolean(editNewFile || (!editRemoveImage && editingPost.imageUrl));
    if (!content && !hasImageAfter) {
      return showToast("Bài viết cần có nội dung hoặc hình ảnh.");
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

      await updateDoc(doc(db, "posts", editingPost.id), {
        content,
        isHtml: editIsHtml,
        feeling,
        imageUrl: nextImageUrl,
        editedAt: Date.now()
      });
      close();
      showToast("Đã cập nhật bài viết!");
    } catch (err) {
      showToast(friendlyError(err));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu thay đổi";
    }
  };

  backdrop._syncModeUi = syncModeUi;
  return backdrop;
}

export function openEditPostModal(post) {
  const backdrop = ensureEditModal();
  editingPost = post;
  editNewFile = null;
  editRemoveImage = false;
  editIsHtml = Boolean(post.isHtml);

  backdrop.querySelector("#ep-content").value = post.content || "";
  backdrop.querySelector("#ep-feeling").value = post.feeling || "";
  backdrop.querySelector("#ep-file-input").value = "";
  backdrop.querySelector("#ep-html-preview-box").style.display = "none";
  backdrop._syncModeUi();

  const imgBox = backdrop.querySelector("#ep-img-box");
  const imgPrev = backdrop.querySelector("#ep-img-preview");
  if (post.imageUrl) {
    imgPrev.src = post.imageUrl;
    imgBox.style.display = "block";
  } else {
    imgPrev.src = "";
    imgBox.style.display = "none";
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
  const myReactionKey = currentUser ? reactions[currentUser.uid] : null;
  const myReactionObj = REACTIONS.find((r) => r.key === myReactionKey);
  const comments = post.comments || [];
  const isOwner = Boolean(currentUser && currentUser.uid === post.authorUid);
  const canManage = Boolean(isOwner || isUserAdmin(currentUser));
  let isSaved = !!(currentUser && (currentUser.savedPosts || []).includes(post.id));
  const isPinned = Boolean(post.pinned);

  const uniqueReactionBadges = [...new Set(reactionValues)]
    .slice(0, 3)
    .map((k) => renderReactionIcon(k, "twin-rx-badge"))
    .join("");

  const displayName = post.pageName ? post.pageName : post.authorName;
  const displayAvatar = post.pageAvatar || post.authorAvatar || DEFAULT_AVATAR;

  const bodyHtml = post.content
    ? post.isHtml
      ? `<div class="twin-post-body twin-post-html">${sanitizeHtml(post.content)}</div>`
      : `<div class="twin-post-body">${escapeHtml(post.content)}</div>`
    : "";

  card.innerHTML = `
    ${isPinned ? `<div class="twin-pin-banner">${SVG.pin}<span>Bài viết đã ghim</span></div>` : ""}

    <div class="twin-post-header">
      <a href="./profile.html?uid=${encodeURIComponent(post.authorUid)}" class="twin-post-author">
        <img class="twin-avatar" src="${escapeHtml(displayAvatar)}" alt="" />
        <div style="min-width:0;">
          <div class="twin-post-author-name">
            ${escapeHtml(displayName)}
            ${post.pageName ? `<span class="twin-pill-tag" style="margin-left:4px;">Trang</span>` : ""}
            ${post.isHtml ? `<span class="twin-pill-tag" style="margin-left:4px;font-family:monospace;">HTML</span>` : ""}
            ${post.feeling ? `<span style="font-weight:400;color:var(--text-3)"> đang cảm thấy ${escapeHtml(post.feeling)}</span>` : ""}
            ${post.groupName ? `<span style="font-weight:400;color:var(--text-3)"> trong <strong>${escapeHtml(post.groupName)}</strong></span>` : ""}
          </div>
          <div class="twin-post-meta">
            ${post.pageName ? `Đăng bởi ${escapeHtml(post.authorName)} · ` : ""}${formatTime(post.createdAt)}${post.editedAt ? " · Đã chỉnh sửa" : ""} · Công khai
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
    ${post.imageUrl ? `<img class="twin-post-image" src="${escapeHtml(post.imageUrl)}" alt="Ảnh bài viết" loading="lazy" />` : ""}

    <div class="twin-post-stats">
      <div class="twin-stats-reacts">${reactionValues.length > 0 ? `<span class="twin-rx-stack">${uniqueReactionBadges}</span><span>${reactionValues.length}</span>` : "Chưa có cảm xúc"}</div>
      <div>${comments.length} bình luận</div>
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
            <img class="twin-avatar twin-avatar-sm" src="${escapeHtml(c.authorAvatar || DEFAULT_AVATAR)}" alt="" />
            <div class="twin-comment-bubble">
              <div style="font-weight:700;font-size:13px;">${escapeHtml(c.authorName)}</div>
              <div>${escapeHtml(c.text)}</div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <form class="twin-comment-form">
        <input class="twin-input" type="text" placeholder="Viết bình luận..." required maxlength="1000" style="padding:8px 14px;" />
        <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit">Gửi</button>
      </form>
    </div>
  `;

  const postLink = `./index.html#post-${post.id}`;

  async function setReaction(key) {
    if (!currentUser) return showToast("Vui lòng đăng nhập để tương tác.");
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

  card.querySelector(".twin-comment-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return showToast("Vui lòng đăng nhập để bình luận.");
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
    if (post.authorUid && post.authorUid !== currentUser.uid) {
      pushNotification(post.authorUid, {
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar || DEFAULT_AVATAR,
        type: "comment",
        text: `đã bình luận bài viết của bạn: "${text.slice(0, 45)}"`,
        link: postLink
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
        text: `cũng đã bình luận: "${text.slice(0, 40)}"`,
        link: postLink
      }).catch((err) => console.warn("Thread comment notification:", err));
    });
  };

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
  };

  const saveBtn = card.querySelector(".btn-save-post");
  saveBtn.onclick = async () => {
    if (!currentUser) return showToast("Vui lòng đăng nhập.");
    const wasSaved = isSaved;
    const paint = () => {
      saveBtn.classList.toggle("reacted", isSaved);
      saveBtn.innerHTML = isSaved ? SVG.saveFilled : SVG.save;
      const tip = isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết";
      saveBtn.title = tip;
      saveBtn.setAttribute("aria-label", tip);
    };
    isSaved = !wasSaved;
    paint();
    const list = Array.isArray(currentUser.savedPosts) ? currentUser.savedPosts : (currentUser.savedPosts = []);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        savedPosts: wasSaved ? arrayRemove(post.id) : arrayUnion(post.id)
      });
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
    editBtn.onclick = () => openEditPostModal(post);
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
    p.content, Boolean(p.isHtml), p.imageUrl, p.feeling, p.groupName, p.pageName, p.authorName, p.authorAvatar,
    Boolean(p.pinned), p.pinnedAt || 0, p.editedAt || 0,
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
