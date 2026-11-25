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
  signOut,
  updateProfile,
  sendPasswordResetEmail
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
  deleteField
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

export async function signInWithGoogle() {
  if (!auth) throw new Error("Chưa cấu hình Firebase.");
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
  deleteField
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
    "permission-denied": "Bạn không có quyền thực hiện thao tác này (kiểm tra Firestore Rules).",
    "unavailable": "Không kết nối được máy chủ. Vui lòng thử lại."
  };
  const key = code.replace(/^firestore\//, "");
  return map[code] || map[key] || (err && err.message) || "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export function safeLink(link, fallback = "./index.html") {
  const s = String(link || "").trim();
  if (/^\.\/[A-Za-z0-9_\-]+\.html([?#][^\s"'<>]*)?$/.test(s)) return s;
  return fallback;
}

/**
 * Làm sạch HTML cho phép người dùng đăng bài bằng HTML phong phú
 * mà vẫn chặn script / sự kiện XSS nguy hiểm.
 */
const ALLOWED_HTML_TAGS = new Set([
  "DIV", "SPAN", "P", "BR", "HR", "CENTER",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "B", "STRONG", "I", "EM", "U", "S", "DEL", "INS", "MARK", "SMALL", "SUB", "SUP",
  "BLOCKQUOTE", "PRE", "CODE", "UL", "OL", "LI", "DL", "DT", "DD",
  "A", "IMG", "FIGURE", "FIGCAPTION",
  "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD",
  "DETAILS", "SUMMARY", "VIDEO", "AUDIO", "SOURCE", "IFRAME"
]);

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com"
];

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
          // Giữ lại nội dung bên trong nếu là thẻ không được hỗ trợ
          const frag = docHtml.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
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
          if (/^\s*(javascript|vbscript|data:text\/html)/i.test(val)) {
            child.removeAttribute(attr.name);
            continue;
          }
        }
        if (name === "style") {
          if (/expression\s*\(|javascript:|url\s*\(\s*['"]?\s*javascript:/i.test(val)) {
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
  if (!ts) return "Vừa xong";
  const ms = toMillis(ts);
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
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

export async function ensureUserDoc(user, extra = {}) {
  if (!db || !user) return null;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile = {
      uid: user.uid,
      name: extra.name || user.displayName || user.email?.split("@")[0] || "Thành viên Twin",
      email: user.email || "",
      showEmail: true,
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
      createdAt: serverTimestamp()
    };
    await setDoc(ref, profile);
    return profile;
  }
  const data = snap.data();
  if (user.email && !data.email) {
    data.email = user.email;
    updateDoc(ref, { email: user.email }).catch(() => {});
  }
  return data;
}

export async function pushNotification(toUid, payload) {
  if (!db || !toUid || toUid === payload.fromUid) return;
  await addDoc(collection(db, "notifications"), {
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
  });
}

export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}
