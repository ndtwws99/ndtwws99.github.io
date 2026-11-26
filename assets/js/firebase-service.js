/* ==========================================================================
   Twin Liquid Glass — Firebase, Cloudinary & HTML Sanitizer Service
========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics, isSupported as isAnalyticsSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  linkWithCredential
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  firebaseConfig,
  cloudinaryConfig,
  isFirebaseConfigured,
  isCloudinaryConfigured
} from "./config.js";

let app = null;
let analytics = null;
let auth = null;
let db = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isAnalyticsSupported()
    .then((ok) => { if (ok) analytics = getAnalytics(app); })
    .catch(() => {});
}

const GUEST_SESSION_KEY = "twin_guest_session_v1";

export function isGuestSessionActive() {
  try {
    return sessionStorage.getItem(GUEST_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearGuestSessionFlag() {
  try {
    sessionStorage.removeItem(GUEST_SESSION_KEY);
  } catch {}
}

export function isGuestUser(user) {
  if (!user) return false;
  if (typeof user === "string") return user === "guest_local";
  return Boolean(user.isGuest || user.role === "guest" || user.isAnonymous);
}

export function createGuestProfile(uid = "") {
  return {
    uid: uid || "guest_local",
    name: "Khách",
    email: "",
    role: "guest",
    isGuest: true,
    isAnonymous: Boolean(uid && uid !== "guest_local"),
    avatar: DEFAULT_AVATAR,
    cover: "",
    bio: "Tài khoản Khách (chỉ xem)",
    friends: [],
    friendRequests: [],
    savedPosts: [],
    showActivity: false,
    isOnline: false
  };
}

export async function signInAsGuest() {
  try {
    sessionStorage.setItem(GUEST_SESSION_KEY, "1");
  } catch {}
  if (!auth) {
    return { user: createGuestProfile("guest_local"), anonymousAuth: false };
  }
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    try { await signOut(auth); } catch {}
  }
  try {
    const cred = await signInAnonymously(auth);
    return { user: createGuestProfile(cred.user.uid), anonymousAuth: true };
  } catch (err) {
    // Fallback local guest session if Anonymous Auth is disabled in Firebase Console
    console.warn("Guest anonymous auth fallback:", err?.code || err?.message);
    return { user: createGuestProfile("guest_local"), anonymousAuth: false };
  }
}

export async function exitGuestSession() {
  clearGuestSessionFlag();
  if (auth?.currentUser?.isAnonymous) {
    try { await signOut(auth); } catch {}
  }
}

export function requireMemberAction(user, actionLabel = "thực hiện thao tác này") {
  if (!user || isGuestUser(user)) {
    showToast(`Chế độ Khách bị hạn chế quyền. Đăng nhập tài khoản để ${actionLabel}.`);
    return false;
  }
  return true;
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Chưa cấu hình Firebase.");
  clearGuestSessionFlag();
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function resetPassword(email) {
  if (!auth) throw new Error("Chưa cấu hình Firebase.");
  const cleanEmail = String(email || "").trim();
  if (!cleanEmail) {
    const err = new Error("Vui lòng nhập địa chỉ email.");
    err.code = "auth/missing-email";
    throw err;
  }
  await sendPasswordResetEmail(auth, cleanEmail);
}

export function hasPasswordProvider(fbUser = auth?.currentUser) {
  if (!fbUser || !Array.isArray(fbUser.providerData)) return false;
  return fbUser.providerData.some((p) => p && p.providerId === "password");
}

export async function setOrChangePassword({ currentPassword = "", newPassword = "" } = {}) {
  if (!auth || !auth.currentUser) throw new Error("Bạn cần đăng nhập trước.");
  const user = auth.currentUser;
  const nextPass = String(newPassword || "");
  if (nextPass.length < 6) {
    const err = new Error("Mật khẩu mới cần ít nhất 6 ký tự.");
    err.code = "auth/weak-password";
    throw err;
  }
  const hasPass = hasPasswordProvider(user);
  if (hasPass) {
    if (currentPassword && user.email) {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    }
    await updatePassword(user, nextPass);
    return "updated";
  }
  if (!user.email) {
    throw new Error("Tài khoản chưa có địa chỉ email để đặt mật khẩu.");
  }
  const cred = EmailAuthProvider.credential(user.email, nextPass);
  await linkWithCredential(user, cred);
  return "linked";
}

export {
  app,
  analytics,
  auth,
  db,
  isFirebaseConfigured,
  isCloudinaryConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  increment
};

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23dbeafe'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%230a84ff'/%3E%3Cpath d='M16 72c2-17 14-23 24-23s22 6 24 23' fill='%230a84ff'/%3E%3C/svg%3E";

// Bảng màu nền tin văn bản phong cách hiện đại
export const STORY_BACKGROUNDS = [
  { id: "blue", label: "Xanh dương", css: "linear-gradient(135deg, #1877f2 0%, #0ea5e9 100%)" },
  { id: "purple", label: "Tím hồng", css: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" },
  { id: "sunset", label: "Hoàng hôn", css: "linear-gradient(135deg, #f97316 0%, #ef4444 55%, #db2777 100%)" },
  { id: "emerald", label: "Ngọc lục bảo", css: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)" },
  { id: "gold", label: "Vàng cam", css: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)" },
  { id: "indigo", label: "Đêm sâu", css: "linear-gradient(135deg, #1e1b4b 0%, #3b82f6 100%)" },
  { id: "rose", label: "Hồng phấn", css: "linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)" },
  { id: "dark", label: "Tối giản", css: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }
];

export function getStoryBgCss(bgIdOrCss) {
  const found = STORY_BACKGROUNDS.find((b) => b.id === bgIdOrCss);
  if (found) return found.css;
  if (typeof bgIdOrCss === "string" && bgIdOrCss.startsWith("linear-gradient(")) return bgIdOrCss;
  return STORY_BACKGROUNDS[0].css;
}

export function friendlyError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu không đúng.",
    "auth/user-not-found": "Email hoặc mật khẩu không đúng.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/missing-email": "Vui lòng nhập địa chỉ email.",
    "auth/email-already-in-use": "Email này đã được đăng ký.",
    "auth/weak-password": "Mật khẩu quá yếu (tối thiểu 6 ký tự).",
    "auth/too-many-requests": "Thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.",
    "auth/network-request-failed": "Lỗi mạng. Kiểm tra kết nối Internet.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/cancelled-popup-request": "Bạn đã đóng cửa sổ đăng nhập.",
    "auth/popup-blocked": "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.",
    "auth/unauthorized-domain": "Tên miền này chưa được thêm vào Firebase (Authentication → Settings → Authorized domains).",
    "auth/requires-recent-login": "Vì lý do bảo mật, hãy nhập đúng mật khẩu hiện tại hoặc đăng nhập lại rồi thử lại.",
    "auth/provider-already-linked": "Tài khoản này đã được đặt mật khẩu trước đó.",
    "auth/credential-already-in-use": "Email này đã được liên kết với phương thức mật khẩu khác.",
    "permission-denied": "Bạn không có quyền thực hiện thao tác này (kiểm tra Firestore Rules).",
    "unavailable": "Không kết nối được máy chủ. Vui lòng thử lại."
  };
  const key = code.replace(/^firestore\//, "");
  return map[code] || map[key] || (err && err.message) || "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export function safeLink(link, fallback = "./index.html") {
  const s = String(link || "").trim();
  if (/^\.\/[A-Za-z0-9_\-]+\.html([?#][^\s"'<>]*)?$/.test(s)) return s;
  if (/^\/?[A-Za-z0-9_\-]+\.html([?#][^\s"'<>]*)?$/.test(s)) {
    return `./${s.replace(/^\/+/, "")}`;
  }
  return fallback;
}

/**
 * Làm sạch HTML cho phép người dùng đăng bài bằng HTML phong phú
 * mà vẫn chặn script / sự kiện XSS nguy hiểm.
 */
const ALLOWED_HTML_TAGS = new Set([
  "DIV", "SPAN", "P", "BR", "HR", "CENTER", "SECTION", "ARTICLE", "HEADER", "FOOTER",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "B", "STRONG", "I", "EM", "U", "S", "DEL", "INS", "MARK", "SMALL", "SUB", "SUP",
  "BLOCKQUOTE", "PRE", "CODE", "UL", "OL", "LI", "DL", "DT", "DD",
  "A", "IMG", "FIGURE", "FIGCAPTION", "BUTTON",
  "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD",
  "DETAILS", "SUMMARY", "VIDEO", "AUDIO", "SOURCE", "IFRAME"
]);

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.facebook.com",
  "web.facebook.com",
  "facebook.com"
];

const HTML_DETECT_REGEX = /<\/?(?:div|span|p|br|hr|center|section|article|header|footer|h[1-6]|b|strong|i|em|u|s|del|ins|mark|small|sub|sup|blockquote|pre|code|ul|ol|li|dl|dt|dd|a|img|figure|figcaption|button|table|thead|tbody|tfoot|tr|th|td|details|summary|video|audio|source|iframe)(?:\s+[^<>]*)?\/?>/i;
export function containsHtmlMarkup(text = "") {
  const s = String(text || "");
  if (!s.includes("<") || !s.includes(">")) return false;
  return HTML_DETECT_REGEX.test(s);
}

export function sanitizeHtml(rawHtml = "") {
  if (!rawHtml) return "";
  const parser = new DOMParser();
  const docHtml = parser.parseFromString(String(rawHtml), "text/html");

  const cleanNode = (node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const tag = child.tagName.toUpperCase();
      if (!ALLOWED_HTML_TAGS.has(tag)) {
if (["SCRIPT", "STYLE", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE", "SVG", "MATH"].includes(tag)) {
          child.remove();
        } else {
          cleanNode(child);
          const frag = docHtml.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
        }
          child.replaceWith(frag);
          cleanNode(node);
        }
        continue;
      }

      // Kiểm tra iframe chỉ cho phép nguồn video an toàn
      if (tag === "IFRAME") {
        const src = child.getAttribute("src") || "";
        let ok = false;
        try {
          const u = new URL(src);
          ok = u.protocol === "https:" && ALLOWED_IFRAME_HOSTS.includes(u.hostname);
        } catch {}
        if (!ok) {
          child.remove();
          continue;
        }
        child.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
        child.setAttribute("allowfullscreen", "true");
        child.style.width = "100%";
        child.style.aspectRatio = "16 / 9";
        child.style.border = "0";
        child.style.borderRadius = "12px";
      }

      // Lọc thuộc tính nguy hiểm
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase();
        const val = (attr.value || "").trim();
        if (name.startsWith("on") || name === "srcdoc" || name === "formaction") {
          child.removeAttribute(attr.name);
          continue;
        }
        if (name === "href" || name === "src") {
          const isSafeUrl =
            /^(https?:\/\/|mailto:|tel:|\/(?!\/)|\.\/|#)/i.test(val) ||
            (tag === "IMG" && name === "src" && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(val));
          if (!isSafeUrl) {
            child.removeAttribute(attr.name);
            continue;
          }
        }
        if (name === "style") {
          if (/expression\s*\(|javascript:|vbscript:|url\s*\(|behavior\s*:|-moz-binding/i.test(val)) {
            child.removeAttribute(attr.name);
            continue;
          }
        }
      }

      if (tag === "A" && child.hasAttribute("href")) {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }

      cleanNode(child);
    }
  };

  cleanNode(docHtml.body);
  return docHtml.body.innerHTML;
}

export function showToast(message) {
  let container = document.getElementById("twin-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "twin-toast-container";
    container.className = "twin-toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = "twin-toast";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return new Date(ts).getTime() || 0;
}

export function formatTime(ts) {
  const ms = ts ? toMillis(ts) : Date.now();
  if (!ms) return "Vừa xong";
  const d = new Date(ms);
  const now = new Date();
  const hhmm = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    const diff = Math.max(0, Math.floor((now.getTime() - ms) / 1000));
    let rel = "Vừa xong";
    if (diff >= 3600) {
      rel = `${Math.floor(diff / 3600)} giờ trước`;
    } else if (diff >= 60) {
      rel = `${Math.floor(diff / 60)} phút trước`;
    }
    return `${rel} · ${hhmm} Hôm nay`;
  }

  const dateStr = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  return `${hhmm} · ${dateStr}`;
}

export async function uploadToCloudinary(file) {
  if (!file) return "";
  if (!isCloudinaryConfigured()) {
    throw new Error("Chưa cấu hình Cloudinary trong assets/js/config.js");
  }
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Chỉ hỗ trợ tệp hình ảnh.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ảnh quá lớn (tối đa 10MB).");
  }
  const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("folder", "twin_uploads");

  let res;
  try {
    res = await fetch(url, { method: "POST", body: formData });
  } catch {
    throw new Error("Không kết nối được Cloudinary. Kiểm tra mạng.");
  }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch {}
    throw new Error("Tải ảnh lên Cloudinary thất bại" + (detail ? `: ${detail}` : ". Kiểm tra lại Upload Preset (Unsigned)."));
  }
  const data = await res.json();
  return data.secure_url;
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function getVideoPosterUrl(videoUrl = "") {
  const s = String(videoUrl || "").trim();
  if (!s || !s.includes("res.cloudinary.com") || !s.includes("/video/upload/")) return "";
  return s
    .replace("/video/upload/", "/video/upload/so_auto,f_jpg,q_auto/")
    .replace(/\.(mp4|mov|webm|m4v|ogv)(\?.*)?$/i, ".jpg");
}

export function readVideoMetadata(file) {
  return new Promise((resolve) => {
    if (!file) return resolve({ duration: 0, width: 0, height: 0 });
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    let done = false;
    const finish = (meta) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    const timer = setTimeout(() => finish({ duration: 0, width: 0, height: 0 }), 4000);
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      finish({
        duration: Number.isFinite(v.duration) ? Math.round(v.duration) : 0,
        width: v.videoWidth || 0,
        height: v.videoHeight || 0
      });
    };
    v.onerror = () => {
      clearTimeout(timer);
      finish({ duration: 0, width: 0, height: 0 });
    };
    v.src = url;
  });
}

export function uploadVideoToCloudinary(file, onProgress, { maxSizeMb = 100 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve({ url: "", duration: 0, width: 0, height: 0, poster: "" });
    if (!isCloudinaryConfigured()) {
      return reject(new Error("Chưa cấu hình Cloudinary trong assets/js/config.js"));
    }
    if (!file.type || !file.type.startsWith("video/")) {
      return reject(new Error("Chỉ hỗ trợ tệp video (MP4, MOV, WebM...)."));
    }
    const limitMb = Math.max(5, Math.min(100, Number(maxSizeMb) || 100));
    if (file.size > limitMb * 1024 * 1024) {
      return reject(new Error(`Video quá lớn (tối đa ${limitMb}MB).`));
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/video/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    formData.append("folder", "twin_videos");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        if (typeof onProgress === "function") onProgress(100);
        resolve({
          url: data.secure_url,
          duration: Math.round(Number(data.duration) || 0),
          width: Number(data.width) || 0,
          height: Number(data.height) || 0,
          poster: getVideoPosterUrl(data.secure_url)
        });
      } else {
        const detail = data?.error?.message || "";
        reject(new Error("Tải video lên Cloudinary thất bại" + (detail ? `: ${detail}` : ". Kiểm tra lại Upload Preset (Unsigned).")));
      }
    };
    xhr.onerror = () => reject(new Error("Không kết nối được Cloudinary. Kiểm tra mạng."));
    xhr.send(formData);
  });
}

export function formatFileSize(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function uploadChatAttachmentToCloudinary(file, onProgress, { maxSizeMb = 25 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Chưa chọn tệp để tải lên."));
    if (!isCloudinaryConfigured()) {
      return reject(new Error("Chưa cấu hình Cloudinary trong assets/js/config.js"));
    }
    const mime = String(file.type || "").toLowerCase();
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    const limitMb = isVideo ? Math.max(25, Number(maxSizeMb) || 50) : isImage ? 10 : Math.max(10, Number(maxSizeMb) || 25);
    if (file.size > limitMb * 1024 * 1024) {
      return reject(new Error(`Tệp quá lớn (tối đa ${limitMb}MB).`));
    }

    const doUpload = (resourceType, allowFallback = false) => {
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("folder", isVideo ? "twin_chat_videos" : isImage ? "twin_chat_images" : "twin_chat_files");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && typeof onProgress === "function") {
          onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
        }
      };
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText || "{}"); } catch {}
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          if (typeof onProgress === "function") onProgress(100);
          resolve({
            url: data.secure_url,
            kind: isImage ? "image" : isVideo ? "video" : "file",
            name: file.name || "tep-dinh-kem",
            size: file.size || Number(data.bytes) || 0,
            mime: file.type || "",
            duration: Math.round(Number(data.duration) || 0),
            poster: isVideo ? getVideoPosterUrl(data.secure_url) : ""
          });
        } else if (allowFallback && resourceType === "auto") {
          doUpload("raw", false);
        } else {
          const detail = data?.error?.message || "";
          reject(new Error("Tải tệp lên Cloudinary thất bại" + (detail ? `: ${detail}` : ".")));
        }
      };
      xhr.onerror = () => reject(new Error("Không kết nối được Cloudinary. Kiểm tra mạng."));
      xhr.send(formData);
    };

    if (isImage) doUpload("image", false);
    else if (isVideo) doUpload("video", false);
    else doUpload("auto", true);
  });
}

export function normalizeSafeHttpUrl(raw = "") {
  const s = String(raw || "").trim();
  if (!s) return "";
  const candidate = /^https?:\/\//i.test(s) ? s : (/^www\./i.test(s) ? `https://${s}` : (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s) ? `https://${s}` : ""));
  if (!candidate) return "";
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch {
    return "";
  }
}

export function linkifyTextToFragment(text = "") {
  const frag = document.createDocumentFragment();
  const str = String(text || "");
  const urlRe = /((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi;
  let lastIdx = 0;
  let firstUrl = "";
  let match;
  while ((match = urlRe.exec(str)) !== null) {
    const start = match.index;
    if (start > lastIdx) {
      frag.appendChild(document.createTextNode(str.slice(lastIdx, start)));
    }
    let rawUrl = match[0];
    let trailing = "";
    while (/[.,!?;:)\]}]$/.test(rawUrl)) {
      trailing = rawUrl.slice(-1) + trailing;
      rawUrl = rawUrl.slice(0, -1);
    }
    const safeUrl = normalizeSafeHttpUrl(rawUrl);
    if (safeUrl) {
      if (!firstUrl) firstUrl = safeUrl;
      const a = document.createElement("a");
      a.className = "twin-msg-link";
      a.href = safeUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = rawUrl;
      frag.appendChild(a);
    } else {
      frag.appendChild(document.createTextNode(rawUrl));
    }
    if (trailing) frag.appendChild(document.createTextNode(trailing));
    lastIdx = urlRe.lastIndex;
  }
  if (lastIdx < str.length) {
    frag.appendChild(document.createTextNode(str.slice(lastIdx)));
  }
  return { fragment: frag, firstUrl };
}

export function formatChatMessagePreview(m, myUid = "") {
  if (!m) return "Chưa có tin nhắn";
  const prefix = myUid && m.senderUid === myUid ? "Bạn: " : "";
  if (m.storyReply && m.text) return `${prefix}Trả lời tin ngắn: ${m.text}`;
  if (m.text) return `${prefix}${m.text}`;
  if (m.imageUrl) return `${prefix}Đã gửi một hình ảnh`;
  if (m.videoUrl) return `${prefix}Đã gửi một video`;
  if (m.fileUrl) return `${prefix}Đã gửi tệp: ${m.fileName || "Tệp đính kèm"}`;
  if (m.linkUrl) return `${prefix}Đã gửi liên kết: ${m.linkTitle || m.linkUrl}`;
  return "Chưa có tin nhắn";
}

export function createChatMessageElement(m, isMine = false) {
  const div = document.createElement("div");
  div.className = `twin-msg ${isMine ? "me" : "them"}`;

  if (m.storyReply) {
    const refEl = document.createElement("a");
    refEl.className = "twin-msg-story-ref";
    refEl.href = m.storyReply.storyId
      ? `./index.html?story=${encodeURIComponent(m.storyReply.storyId)}`
      : "./index.html";
    refEl.textContent = m.storyReply.previewText
      ? `Trả lời tin ngắn: "${m.storyReply.previewText}"`
      : "Đã trả lời tin ngắn";
    div.appendChild(refEl);
  }

  let detectedUrl = "";
  if (m.text) {
    const p = document.createElement("div");
    p.className = "twin-msg-text";
    const { fragment, firstUrl } = linkifyTextToFragment(m.text);
    detectedUrl = firstUrl;
    p.appendChild(fragment);
    div.appendChild(p);
  }

  const cardUrl = normalizeSafeHttpUrl(m.linkUrl || detectedUrl);
  if (cardUrl) {
    let host = cardUrl;
    try { host = new URL(cardUrl).hostname.replace(/^www\./, ""); } catch {}
    const linkCard = document.createElement("a");
    linkCard.className = "twin-msg-link-card";
    linkCard.href = cardUrl;
    linkCard.target = "_blank";
    linkCard.rel = "noopener noreferrer";
    linkCard.innerHTML = `
      <span class="twin-msg-link-ico" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </span>
      <span class="twin-msg-link-meta">
        <strong class="twin-msg-link-title">${escapeHtml(m.linkTitle || host)}</strong>
        <span class="twin-msg-link-url">${escapeHtml(host)}</span>
      </span>
    `;
    div.appendChild(linkCard);
  }

  if (m.imageUrl) {
    const a = document.createElement("a");
    a.href = m.imageUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "twin-msg-media-link";
    const img = document.createElement("img");
    img.src = m.imageUrl;
    img.alt = m.fileName || "Ảnh";
    img.loading = "lazy";
    a.appendChild(img);
    div.appendChild(a);
  }

  if (m.videoUrl) {
    const video = document.createElement("video");
    video.className = "twin-msg-video";
    video.src = m.videoUrl;
    const poster = m.videoPoster || getVideoPosterUrl(m.videoUrl);
    if (poster) video.poster = poster;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    div.appendChild(video);
  }

  if (m.fileUrl) {
    const ext = String(m.fileName || "")
      .split(".")
      .pop()
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase() || "FILE";
    const fileCard = document.createElement("a");
    fileCard.className = "twin-msg-file-card";
    fileCard.href = m.fileUrl;
    fileCard.target = "_blank";
    fileCard.rel = "noopener noreferrer";
    fileCard.setAttribute("download", m.fileName || "tep-dinh-kem");
    fileCard.innerHTML = `
      <span class="twin-msg-file-ext">${escapeHtml(ext)}</span>
      <span class="twin-msg-file-meta">
        <strong class="twin-msg-file-name">${escapeHtml(m.fileName || "Tệp đính kèm")}</strong>
        <span class="twin-msg-file-size">${m.fileSize ? escapeHtml(formatFileSize(m.fileSize)) : "Nhấn để tải xuống"}</span>
      </span>
      <span class="twin-msg-file-dl" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </span>
    `;
    div.appendChild(fileCard);
  }

  const timeEl = document.createElement("div");
  timeEl.className = "twin-msg-time";
  timeEl.textContent = formatTime(m.createdAt);
  div.appendChild(timeEl);
  return div;
}

export const ROOT_ADMIN_EMAILS = ["ndtwws99@gmail.com"];

const ADMIN_UIDS_STORAGE_KEY = "twin_admin_uids_v1";
const adminUidSet = new Set();

try {
  const cached = JSON.parse(localStorage.getItem(ADMIN_UIDS_STORAGE_KEY) || "[]");
  if (Array.isArray(cached)) {
    cached.forEach((uid) => {
      if (typeof uid === "string" && uid) adminUidSet.add(uid);
    });
  }
} catch {}

export function isAdminUid(uid) {
  return Boolean(uid && adminUidSet.has(String(uid)));
}

export function isUserAdmin(user) {
  if (!user) return false;
  if (typeof user === "string") return isAdminUid(user);
  if (user.role === "admin") return true;
  if (user.uid && adminUidSet.has(String(user.uid))) return true;
  const isSelf = Boolean(auth?.currentUser && user.uid && user.uid === auth.currentUser.uid);
  const email = String(user.email || (isSelf ? auth.currentUser.email : "") || "").trim().toLowerCase();
  return Boolean(email && ROOT_ADMIN_EMAILS.includes(email));
}

export function hydrateAdminBadges(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  root.querySelectorAll("[data-admin-badge-uid]").forEach((el) => {
    const uid = el.getAttribute("data-admin-badge-uid");
    el.classList.toggle("is-hidden", !isAdminUid(uid));
  });
}

export function syncAdminRegistry(users = []) {
  if (!Array.isArray(users)) return;
  const next = new Set();
  users.forEach((u) => {
    if (!u) return;
    const uid = u.uid || u.id;
    if (!uid) return;
    const email = String(u.email || "").trim().toLowerCase();
    if (u.role === "admin" || (email && ROOT_ADMIN_EMAILS.includes(email))) {
      next.add(String(uid));
    }
  });
  adminUidSet.clear();
  next.forEach((uid) => adminUidSet.add(uid));
  try {
    localStorage.setItem(ADMIN_UIDS_STORAGE_KEY, JSON.stringify([...adminUidSet]));
  } catch {}
  hydrateAdminBadges(document);
  try {
    window.dispatchEvent(new CustomEvent("twin-admin-registry-changed"));
  } catch {}
}

export function registerAdminUser(user) {
  if (!user) return;
  const uid = user.uid || user.id;
  if (!uid) return;
  const email = String(user.email || "").trim().toLowerCase();
  const isAdm = user.role === "admin" || (email && ROOT_ADMIN_EMAILS.includes(email));
  if (isAdm) {
    adminUidSet.add(String(uid));
  } else {
    adminUidSet.delete(String(uid));
  }
  try {
    localStorage.setItem(ADMIN_UIDS_STORAGE_KEY, JSON.stringify([...adminUidSet]));
  } catch {}
  hydrateAdminBadges(document);
}

const ADMIN_SHIELD_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2 4.5 5.4v5.7c0 5.1 3.2 9.7 7.5 10.9 4.3-1.2 7.5-5.8 7.5-10.9V5.4L12 2.2Zm-1.1 13.4-3.3-3.3 1.4-1.4 1.9 1.9 4.3-4.3 1.4 1.4-5.7 5.7Z"/></svg>`;

export function renderAdminIconHtml(userOrUid) {
  const uid = typeof userOrUid === "string" ? userOrUid : (userOrUid?.uid || userOrUid?.id || "");
  const isAdm = isUserAdmin(userOrUid) || isAdminUid(uid);
  const uidAttr = uid ? ` data-admin-badge-uid="${escapeHtml(uid)}"` : "";
  return `<span class="twin-admin-icon${isAdm ? "" : " is-hidden"}"${uidAttr} title="Quản trị viên" aria-label="Quản trị viên">${ADMIN_SHIELD_SVG}</span>`;
}

export async function unfriendUser(myUid, targetUid) {
  if (!db || !myUid || !targetUid || myUid === targetUid) return;
  await Promise.all([
    updateDoc(doc(db, "users", myUid), {
      friends: arrayRemove(targetUid),
      friendRequests: arrayRemove(targetUid)
    }),
    updateDoc(doc(db, "users", targetUid), {
      friends: arrayRemove(myUid),
      friendRequests: arrayRemove(myUid)
    })
  ]);
}

async function shouldEmailBeAdmin(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return false;
  if (ROOT_ADMIN_EMAILS.includes(clean)) return true;
  if (!db) return false;
  try {
    const webSnap = await getDoc(doc(db, "settings", "web"));
    if (webSnap.exists()) {
      const list = webSnap.data()?.adminEmails;
      if (Array.isArray(list) && list.map((e) => String(e).trim().toLowerCase()).includes(clean)) {
        return true;
      }
    }
  } catch {}
  return false;
}

export async function ensureUserDoc(user, extra = {}) {
  if (!user) return null;
  if (user.isAnonymous) return createGuestProfile(user.uid);
  if (!db) return null;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const autoAdmin = await shouldEmailBeAdmin(user.email);

  if (!snap.exists()) {
    const profile = {
      uid: user.uid,
      name: extra.name || user.displayName || user.email?.split("@")[0] || "Thành viên Twin",
      email: user.email || "",
      role: autoAdmin ? "admin" : "member",
      showEmail: true,
      showPersonalInfo: true,
      allowMessagesFrom: "everyone",
      allowFriendRequests: true,
      showActivity: true,
      avatar: user.photoURL || DEFAULT_AVATAR,
      cover: "",
      bio: "Xin chào, mình đang dùng Twin!",
      birthday: "",
      hometown: "",
      location: "",
      work: "",
      education: "",
      gender: "",
      relationship: "",
      phone: "",
      website: "",
      friends: [],
      friendRequests: [],
      savedPosts: [],
      isOnline: true,
      lastActiveAt: Date.now(),
      createdAt: serverTimestamp()
    };
    await setDoc(ref, profile);
    registerAdminUser(profile);
    return profile;
  }
  const data = snap.data();
  const patch = {};
  if (user.email && data.email !== user.email) {
    data.email = user.email;
    patch.email = user.email;
  }
  if (autoAdmin && data.role !== "admin") {
    data.role = "admin";
    patch.role = "admin";
  }
  if (Object.keys(patch).length) {
    updateDoc(ref, patch).catch(() => {});
  }
  registerAdminUser(data);
  return data;
}

export async function pushNotification(toUid, payload) {
  if (!db || !toUid || toUid === payload.fromUid) return;
  const docData = {
    toUid,
    fromUid: payload.fromUid,
    fromName: payload.fromName || "Ai đó",
    fromAvatar: payload.fromAvatar || DEFAULT_AVATAR,
    type: payload.type || "general",
    text: payload.text,
    link: safeLink(payload.link),
    read: false,
    createdAtMs: Date.now(),
    createdAt: serverTimestamp()
  };
  if (payload.postId) docData.postId = payload.postId;
  if (payload.storyId) docData.storyId = payload.storyId;
  if (payload.groupId) docData.groupId = payload.groupId;
  if (payload.pageId) docData.pageId = payload.pageId;
  await addDoc(collection(db, "notifications"), docData);
}

export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// ==========================================================================
// Real-time Online Presence & Last Active
// ==========================================================================
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function getUserPresence(user) {
  if (!user) return { online: false, hidden: true, label: "", agoText: "", shortLabel: "", lastActiveMs: 0 };
  if (user.showActivity === false) {
    return { online: false, hidden: true, label: "", agoText: "", shortLabel: "", lastActiveMs: 0 };
  }
  const lastActiveMs =
    typeof user.lastActiveAt === "number"
      ? user.lastActiveAt
      : toMillis(user.lastActiveAt);

  if (!lastActiveMs) {
    return { online: false, hidden: false, label: "", agoText: "", shortLabel: "", lastActiveMs: 0 };
  }

  const diffMs = Math.max(0, Date.now() - lastActiveMs);
  if (user.isOnline !== false && diffMs <= ONLINE_WINDOW_MS) {
    return {
      online: true,
      hidden: false,
      label: "",
      agoText: "",
      shortLabel: "",
      lastActiveMs
    };
  }

  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) {
    const ago = `${mins} phút trước`;
    return {
      online: false,
      hidden: false,
      label: ago,
      agoText: ago,
      shortLabel: `${mins}p`,
      lastActiveMs
    };
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const ago = `${hours} giờ trước`;
    return {
      online: false,
      hidden: false,
      label: ago,
      agoText: ago,
      shortLabel: `${hours}g`,
      lastActiveMs
    };
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    const ago = `${days} ngày trước`;
    return {
      online: false,
      hidden: false,
      label: ago,
      agoText: ago,
      shortLabel: `${days}n`,
      lastActiveMs
    };
  }
  const d = new Date(lastActiveMs);
  const ago = d.toLocaleDateString("vi-VN");
  return {
    online: false,
    hidden: false,
    label: ago,
    agoText: ago,
    shortLabel: "",
    lastActiveMs
  };
}

export function renderPresenceBadgeHtml(user) {
  const p = getUserPresence(user);
  if (p.hidden) return "";
  if (p.online) {
    return `<span class="twin-presence-dot online" title="Đang trực tuyến" aria-label="Đang trực tuyến"></span>`;
  }
  const tip = p.agoText ? `Truy cập ${p.agoText}` : "Ngoại tuyến";
  return `<span class="twin-presence-dot offline" title="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}"></span>`;
}

// ==========================================================================
// Story Privacy Modes (public / friends / private)
// ==========================================================================
export const STORY_PRIVACY_OPTIONS = [
  { id: "public", label: "Công khai", desc: "Mọi người trên Twin" },
  { id: "friends", label: "Bạn bè", desc: "Chỉ bạn bè của bạn" },
  { id: "private", label: "Riêng tư", desc: "Chỉ mình tôi" }
];

export function getStoryPrivacyMeta(privacy = "public") {
  const key = privacy === "friends" || privacy === "private" ? privacy : "public";
  return STORY_PRIVACY_OPTIONS.find((x) => x.id === key) || STORY_PRIVACY_OPTIONS[0];
}

export function canViewStory(story, viewer) {
  if (!story) return false;
  const mode = story.privacy || "public";
  if (mode === "public") return true;
  if (!viewer || !viewer.uid) return false;
  if (story.authorUid === viewer.uid) return true;
  if (mode === "private") return false;
  if (mode === "friends") {
    const viewerFriends = Array.isArray(viewer.friends) ? viewer.friends : [];
    const allowedFriends = Array.isArray(story.allowedFriendUids) ? story.allowedFriendUids : [];
    return viewerFriends.includes(story.authorUid) || allowedFriends.includes(viewer.uid);
  }
  return true;
}

export function canViewPost(post, viewer) {
  if (!post) return false;
  const mode = post.privacy || "public";
  if (mode === "public") return true;
  if (!viewer || !viewer.uid) return false;
  if (post.authorUid === viewer.uid) return true;
  if (mode === "private") return false;
  if (mode === "friends") {
    const viewerFriends = Array.isArray(viewer.friends) ? viewer.friends : [];
    const allowedFriends = Array.isArray(post.allowedFriendUids) ? post.allowedFriendUids : [];
    return viewerFriends.includes(post.authorUid) || allowedFriends.includes(viewer.uid);
  }
  return true;
}

// ==========================================================================
// In-App Confirm Modal (Iframe-Safe Replacement for window.confirm)
// ==========================================================================
export function twinConfirm(optionsOrMessage) {
  const opts =
    typeof optionsOrMessage === "string"
      ? { message: optionsOrMessage }
      : (optionsOrMessage || {});
  const title = opts.title || "Xác nhận";
  const message = opts.message || "Bạn có chắc muốn thực hiện thao tác này?";
  const confirmText = opts.confirmText || "Xác nhận";
  const cancelText = opts.cancelText || "Hủy";
  const danger = opts.danger !== false;

  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "twin-modal-backdrop open twin-confirm-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.innerHTML = `
      <div class="twin-modal twin-confirm-modal">
        <h3 class="twin-confirm-title">${escapeHtml(title)}</h3>
        <p class="twin-confirm-msg">${escapeHtml(message)}</p>
        <div class="twin-confirm-actions">
          <button type="button" class="twin-btn twin-btn-secondary twin-btn-sm twin-confirm-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="twin-btn ${danger ? "twin-btn-danger" : "twin-btn-primary"} twin-btn-sm twin-confirm-ok">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === "Escape") finish(false);
    };
    document.addEventListener("keydown", onKey);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) finish(false);
    });
    backdrop.querySelector(".twin-confirm-cancel").onclick = () => finish(false);
    const okBtn = backdrop.querySelector(".twin-confirm-ok");
    okBtn.onclick = () => finish(true);
    setTimeout(() => okBtn.focus(), 20);
  });
}


