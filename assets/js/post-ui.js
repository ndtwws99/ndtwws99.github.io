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
  friendlyError
} from "./firebase-service.js";

export const REACTIONS = [
  { key: "like", emoji: "👍", label: "Thích" },
  { key: "love", emoji: "❤️", label: "Yêu thích" },
  { key: "haha", emoji: "😆", label: "Haha" },
  { key: "wow", emoji: "😮", label: "Wow" },
  { key: "sad", emoji: "😢", label: "Buồn" },
  { key: "angry", emoji: "😡", label: "Phẫn nộ" }
];

const SVG = {
  like: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>`,
  comment: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>`,
  share: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  save: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>`,
  saveFilled: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>`,
  pin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
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
          <select id="ep-feeling" class="twin-select" style="width:auto;padding:6px 12px;border-radius:999px;font-size:13px;">
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
  const isOwner = currentUser && currentUser.uid === post.authorUid;
  let isSaved = !!(currentUser && (currentUser.savedPosts || []).includes(post.id));
  const isPinned = Boolean(post.pinned);

  const uniqueEmojis = [...new Set(reactionValues)]
    .slice(0, 3)
    .map((k) => REACTIONS.find((r) => r.key === k)?.emoji || "👍")
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
        isOwner
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
      <div>${reactionValues.length > 0 ? `${uniqueEmojis} ${reactionValues.length}` : "Chưa có cảm xúc"}</div>
      <div>${comments.length} bình luận</div>
    </div>

    <div class="twin-post-actions twin-icon-only-actions">
      <div class="twin-react-wrap">
        <div class="twin-react-picker">
          ${REACTIONS.map((r) => `<button class="twin-react-emoji" data-react="${r.key}" title="${r.label}" aria-label="${r.label}">${r.emoji}</button>`).join("")}
        </div>
        <button class="twin-action-btn btn-main-react ${myReactionObj ? "reacted" : ""}" style="width:100%;" title="${myReactionObj ? myReactionObj.label : "Cảm xúc"}" aria-label="${myReactionObj ? myReactionObj.label : "Cảm xúc"}">
          ${myReactionObj ? `<span class="twin-react-active-emoji">${myReactionObj.emoji}</span>` : SVG.like}
        </button>
      </div>
      <button class="twin-action-btn btn-toggle-cmt" title="Bình luận" aria-label="Bình luận">${SVG.comment}</button>
      <button class="twin-action-btn btn-share-post" title="Chia sẻ" aria-label="Chia sẻ">${SVG.share}</button>
      <button class="twin-action-btn btn-save-post ${isSaved ? "reacted" : ""}" title="${isSaved ? "Đã lưu" : "Lưu bài viết"}" aria-label="${isSaved ? "Đã lưu" : "Lưu bài viết"}">${isSaved ? SVG.saveFilled : SVG.save}</button>
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
        <input class="twin-input" type="text" placeholder="Viết bình luận..." required maxlength="1000" style="border-radius:999px;padding:8px 14px;" />
        <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit" style="border-radius:999px;">Gửi</button>
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
        pushNotification(post.authorUid, {
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          type: "reaction",
          text: "đã bày tỏ cảm xúc về bài viết của bạn.",
          link: postLink
        });
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
    const snippet = text.length > 50 ? `${text.slice(0, 50)}…` : text;
    const notifiedUids = new Set([currentUser.uid]);
    if (post.authorUid && !notifiedUids.has(post.authorUid)) {
      notifiedUids.add(post.authorUid);
      pushNotification(post.authorUid, {
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        type: "comment",
        text: `đã bình luận bài viết của bạn: "${snippet}"`,
        link: postLink
      });
    }
    (post.comments || []).forEach((c) => {
      if (c.authorUid && !notifiedUids.has(c.authorUid)) {
        notifiedUids.add(c.authorUid);
        pushNotification(c.authorUid, {
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromAvatar: currentUser.avatar,
          type: "comment",
          text: `cũng đã bình luận: "${snippet}"`,
          link: postLink
        });
      }
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
      saveBtn.title = isSaved ? "Đã lưu" : "Lưu bài viết";
      saveBtn.setAttribute("aria-label", saveBtn.title);
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
  return JSON.stringify([
    p.content, Boolean(p.isHtml), p.imageUrl, p.feeling, p.groupName, p.pageName, p.authorName, p.authorAvatar,
    Boolean(p.pinned), p.pinnedAt || 0, p.editedAt || 0,
    p.reactions || {}, (p.comments || []).map((c) => c.id), toMillis(p.createdAt), saved
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
