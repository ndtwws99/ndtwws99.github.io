import {
  db,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  pushNotification,
  DEFAULT_AVATAR,
  escapeHtml,
  formatTime,
  showToast
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
  like: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
  comment: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  share: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  save: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`
};

export function renderPostCard(post, currentUser) {
  const card = document.createElement("article");
  card.className = "twin-card";
  const reactions = post.reactions || {};
  const reactionValues = Object.values(reactions);
  const myReactionKey = currentUser ? reactions[currentUser.uid] : null;
  const myReactionObj = REACTIONS.find((r) => r.key === myReactionKey);
  const comments = post.comments || [];
  const isOwner = currentUser && currentUser.uid === post.authorUid;
  const isSaved = currentUser && (currentUser.savedPosts || []).includes(post.id);

  const uniqueEmojis = [...new Set(reactionValues)]
    .slice(0, 3)
    .map((k) => REACTIONS.find((r) => r.key === k)?.emoji || "👍")
    .join("");

  card.innerHTML = `
    <div class="twin-post-header">
      <a href="./profile.html?uid=${encodeURIComponent(post.authorUid)}" class="twin-post-author">
        <img class="twin-avatar" src="${escapeHtml(post.authorAvatar || DEFAULT_AVATAR)}" alt="" />
        <div>
          <div class="twin-post-author-name">
            ${escapeHtml(post.authorName)}
            ${post.feeling ? `<span style="font-weight:400;color:var(--text-3)"> đang cảm thấy ${escapeHtml(post.feeling)}</span>` : ""}
            ${post.groupName ? `<span style="font-weight:400;color:var(--text-3)"> trong <strong>${escapeHtml(post.groupName)}</strong></span>` : ""}
          </div>
          <div class="twin-post-meta">${formatTime(post.createdAt)} · Công khai</div>
        </div>
      </a>
      ${isOwner ? `<button class="twin-icon-btn btn-del-post" style="width:34px;height:34px;color:var(--text-3);" title="Xóa bài viết">${SVG.trash}</button>` : ""}
    </div>

    ${post.content ? `<div class="twin-post-body">${escapeHtml(post.content)}</div>` : ""}
    ${post.imageUrl ? `<img class="twin-post-image" src="${escapeHtml(post.imageUrl)}" alt="Ảnh bài viết" loading="lazy" />` : ""}

    <div class="twin-post-stats">
      <div>${reactionValues.length > 0 ? `${uniqueEmojis} ${reactionValues.length}` : "Chưa có cảm xúc"}</div>
      <div>${comments.length} bình luận</div>
    </div>

    <div class="twin-post-actions">
      <div class="twin-react-wrap">
        <div class="twin-react-picker">
          ${REACTIONS.map((r) => `<button class="twin-react-emoji" data-react="${r.key}" title="${r.label}">${r.emoji}</button>`).join("")}
        </div>
        <button class="twin-action-btn btn-main-react ${myReactionObj ? "reacted" : ""}" style="width:100%;">
          ${myReactionObj ? `<span>${myReactionObj.emoji}</span>` : SVG.like}
          <span>${myReactionObj ? myReactionObj.label : "Thích"}</span>
        </button>
      </div>
      <button class="twin-action-btn btn-toggle-cmt">${SVG.comment}<span>Bình luận</span></button>
      <button class="twin-action-btn btn-share-post">${SVG.share}<span>Chia sẻ</span></button>
      <button class="twin-action-btn btn-save-post ${isSaved ? "reacted" : ""}">${SVG.save}<span>${isSaved ? "Đã lưu" : "Lưu"}</span></button>
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
        <input class="twin-input" type="text" placeholder="Viết bình luận..." required style="border-radius:999px;padding:8px 14px;" />
        <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit" style="border-radius:999px;">Gửi</button>
      </form>
    </div>
  `;

  async function setReaction(key) {
    if (!currentUser) return showToast("Vui lòng đăng nhập để tương tác.");
    const nextReactions = { ...reactions };
    if (nextReactions[currentUser.uid] === key) {
      delete nextReactions[currentUser.uid];
    } else {
      nextReactions[currentUser.uid] = key;
      pushNotification(post.authorUid, {
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromAvatar: currentUser.avatar,
        text: "đã bày tỏ cảm xúc về bài viết của bạn.",
        link: "./index.html"
      }).catch(() => {});
    }
    await updateDoc(doc(db, "posts", post.id), { reactions: nextReactions });
  }

  card.querySelector(".btn-main-react").onclick = () => setReaction(myReactionKey || "like");
  card.querySelectorAll(".twin-react-emoji").forEach((btn) => {
    btn.onclick = () => setReaction(btn.dataset.react);
  });

  card.querySelector(".btn-toggle-cmt").onclick = () => {
    const box = card.querySelector(".twin-comments");
    box.style.display = box.style.display === "none" ? "block" : "none";
    box.querySelector("input")?.focus();
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
    await updateDoc(doc(db, "posts", post.id), { comments: arrayUnion(newCmt) });
    pushNotification(post.authorUid, {
      fromUid: currentUser.uid,
      fromName: currentUser.name,
      fromAvatar: currentUser.avatar,
      text: `đã bình luận: "${text.slice(0, 40)}"`,
      link: "./index.html"
    }).catch(() => {});
  };

  card.querySelector(".btn-share-post").onclick = async () => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép liên kết bài viết!");
    } catch {
      showToast("Đã sao chép liên kết!");
    }
  };

  card.querySelector(".btn-save-post").onclick = async () => {
    if (!currentUser) return showToast("Vui lòng đăng nhập.");
    const userRef = doc(db, "users", currentUser.uid);
    if (isSaved) {
      await updateDoc(userRef, { savedPosts: arrayRemove(post.id) });
      showToast("Đã bỏ lưu bài viết.");
    } else {
      await updateDoc(userRef, { savedPosts: arrayUnion(post.id) });
      showToast("Đã lưu bài viết!");
    }
  };

  const delBtn = card.querySelector(".btn-del-post");
  if (delBtn) {
    delBtn.onclick = async () => {
      if (!confirm("Xóa bài viết này?")) return;
      await deleteDoc(doc(db, "posts", post.id));
      showToast("Đã xóa bài viết.");
    };
  }

  return card;
}
