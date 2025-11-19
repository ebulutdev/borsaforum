// Firebase yapılandırma bilgilerini Firebase Console'dan alıp buraya ekle
// Project Settings > Your apps > Web app

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase yapılandırması - Firebase Console'dan al
const firebaseConfig = {
  apiKey: "AIzaSyCsfV-SDfapIJXtL4CCxqVTfBasR4Lv3Gs",
  authDomain: "site-17361.firebaseapp.com",
  projectId: "site-17361",
  storageBucket: "site-17361.firebasestorage.app",
  messagingSenderId: "864099543297",
  appId: "1:864099543297:web:c67b550379a788bf98d300",
  measurementId: "G-6PC0BYW0MG"
};

// Firebase'i başlat - hata yakalama ile
// Yapılandırmanın geçerli olup olmadığını kontrol et
const isValidConfig = firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== "YOUR_API_KEY" &&
                      firebaseConfig.authDomain && 
                      firebaseConfig.authDomain !== "YOUR_AUTH_DOMAIN";

// Değişkenleri başlangıçta tanımla
let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let storage = null;

try {
  if (isValidConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn("⚠️ Firebase yapılandırması eksik! Lütfen firebase-init.js dosyasını düzenleyin.");
  }
} catch (error) {
  console.error("❌ Firebase başlatılamadı:", error);
}

// Firebase servislerini export et
export { auth, googleProvider, db, storage };
