/**
 * ==========================================================
 * CẤU HÌNH TẬP TRUNG CHO TWIN (FIREBASE & CLOUDINARY)
 * Chỉ cần điền thông tin thật của bạn tại tệp này duy nhất!
 * ==========================================================
 */

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const cloudinaryConfig = {
  cloudName: "YOUR_CLOUDINARY_CLOUD_NAME",
  uploadPreset: "YOUR_UNSIGNED_UPLOAD_PRESET"
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_"));

export const isCloudinaryConfigured = () =>
  Boolean(cloudinaryConfig.cloudName && !cloudinaryConfig.cloudName.startsWith("YOUR_"));
