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
  updateProfile
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
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
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
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
};

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23dbeafe'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%232563eb'/%3E%3Cpath d='M16 72c2-17 14-23 24-23s22 6 24 23' fill='%232563eb'/%3E%3C/svg%3E";

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
  const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("folder", "twin_uploads");

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error("Tải ảnh lên Cloudinary thất bại. Kiểm tra lại Upload Preset (Unsigned).");
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
      avatar: user.photoURL || DEFAULT_AVATAR,
      cover: "",
      bio: "Xin chào, mình đang dùng Twin!",
      friends: [],
      friendRequests: [],
      savedPosts: [],
      createdAt: serverTimestamp()
    };
    await setDoc(ref, profile);
    return profile;
  }
  return snap.data();
}

export async function pushNotification(toUid, payload) {
  if (!db || !toUid || toUid === payload.fromUid) return;
  await addDoc(collection(db, "notifications"), {
    toUid,
    fromUid: payload.fromUid,
    fromName: payload.fromName,
    fromAvatar: payload.fromAvatar || DEFAULT_AVATAR,
    text: payload.text,
    link: payload.link || "./index.html",
    read: false,
    createdAt: serverTimestamp()
  });
}

export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}
