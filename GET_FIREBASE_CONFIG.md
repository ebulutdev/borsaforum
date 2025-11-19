# Firebase Yapılandırmasını Alma

## Yöntem 1: Firebase Console'dan
1. https://console.firebase.google.com adresine gidin
2. Proje: `site-17361` seçin
3. ⚙️ Project Settings > Your apps > Web app
4. `firebaseConfig` objesini kopyalayın

## Yöntem 2: Canlı Siteden (borsamforum.com)
1. borsamforum.com'u açın
2. F12 > Console sekmesi
3. Şu komutu çalıştırın:
```javascript
// Eğer Firebase global olarak erişilebilirse:
firebase.app().options

// Veya tarayıcı konsolunda şunu deneyin:
window.__FIREBASE_DEFAULTS__

// Veya Network sekmesinde firebase-init.js dosyasını bulun
```

## Yöntem 3: Network Sekmesinden
1. F12 > Network sekmesi
2. Sayfayı yenileyin
3. `firebase-init.js` dosyasını bulun
4. Response sekmesinde yapılandırmayı görün

