/**
 * CẤU HÌNH TẬP TRUNG CHO TWIN (FIREBASE & CLOUDINARY)
 */
export const firebaseConfig = {
  apiKey: "AIzaSyCfVk2pGzaEaALnwo3fRqe7rYNINxY4nrU",
  authDomain: "ndtwws99-1999.firebaseapp.com",
  projectId: "ndtwws99-1999",
  storageBucket: "ndtwws99-1999.firebasestorage.app",
  messagingSenderId: "750729468514",
  appId: "1:750729468514:web:306e0736ae2d473f138f3b",
  measurementId: "G-00ZRYF0Y8S"
};

export const cloudinaryConfig = {
  cloudName: "oaagraxi",
  uploadPreset: "ndtwws99"
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_"));

export const isCloudinaryConfigured = () =>
  Boolean(cloudinaryConfig.cloudName && !cloudinaryConfig.cloudName.startsWith("YOUR_"));
