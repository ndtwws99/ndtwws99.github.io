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
            ${post.feeling ? `<span style="font-weight:400;color:var(--twin-text-muted)"> đang cảm thấy ${escapeHtml(post.feeling)}</span>` : ""}
            ${post.groupName ? `<span style="font-weight:400;color:var(--twin-text-muted)"> trong <strong>${escapeHtml(post.groupName)}</strong></span>` : ""}
          </div>
          <div class="twin-post-meta">${formatTime(post.createdAt)} · 🌐 Công khai</div>
        </div>
      </a>
      ${isOwner ? `<button class="twin-btn twin-btn-secondary twin-btn-sm btn-del-post" title="Xóa bài viết">🗑️</button>` : ""}
    </div>

    ${post.content ? `<div class="twin-post-body">${escapeHtml(post.content)}</div>` : ""}
    ${post.imageUrl ? `<img class="twin-post-image" src="${escapeHtml(post.imageUrl)}" alt="Ảnh bài viết Twin" loading="lazy" />` : ""}

    <div class="twin-post-stats">
      <div>${reactionValues.length > 0 ? `${uniqueEmojis} ${reactionValues.length}` : "Hãy là người đầu tiên bày tỏ cảm xúc"}</div>
      <div>${comments.length} bình luận</div>
    </div>

    <div class="twin-post-actions">
      <div class="twin-react-wrap">
        <div class="twin-react-picker">
          ${REACTIONS.map((r) => `<button class="twin-react-emoji" data-react="${r.key}" title="${r.label}">${r.emoji}</button>`).join("")}
        </div>
        <button class="twin-action-btn btn-main-react ${myReactionObj ? "reacted" : ""}" style="width:100%;">
          <span>${myReactionObj ? myReactionObj.emoji : "👍"}</span>
          <span>${myReactionObj ? myReactionObj.label : "Thích"}</span>
        </button>
      </div>
      <button class="twin-action-btn btn-toggle-cmt">💬 Bình luận</button>
      <button class="twin-action-btn btn-share-post">↗️ Chia sẻ</button>
      <button class="twin-action-btn btn-save-post ${isSaved ? "reacted" : ""}">🔖 ${isSaved ? "Đã lưu" : "Lưu"}</button>
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
        <button class="twin-btn twin-btn-primary twin-btn-sm" type="submit">Gửi</button>
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
      showToast("Đã sao chép liên kết bài viết Twin!");
    } catch {
      showToast("Đã sẵn sàng chia sẻ bài viết!");
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
      showToast("Đã lưu bài viết vào mục Đã lưu!");
    }
  };

  const delBtn = card.querySelector(".btn-del-post");
  if (delBtn) {
    delBtn.onclick = async () => {
      if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
      await deleteDoc(doc(db, "posts", post.id));
      showToast("Đã xóa bài viết.");
    };
  }

  return card;
}
