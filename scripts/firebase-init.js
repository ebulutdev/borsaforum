/**
 * Firebase başlangıç dosyası.
 * Firebase konsolundaki Web uygulaması konfigürasyon bilgilerinizi
 * `firebaseConfig` içine ekleyin.
 */

import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsfV-SDfapIJXtL4CCxqVTfBasR4Lv3Gs",
  authDomain: "site-17361.firebaseapp.com",
  projectId: "site-17361",
  storageBucket: "site-17361.firebasestorage.app",
  messagingSenderId: "864099543297",
  appId: "1:864099543297:web:c67b550379a788bf98d300",
  measurementId: "G-6PC0BYW0MG",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Oturum bilgisini tarayıcıda sakla (örn. sekme kapanınca bile giriş kalsın)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence ayarlanamadı:", error);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { firebaseApp, auth, googleProvider, db, storage };


