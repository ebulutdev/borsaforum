# GitHub Pages'te Firestore Çalışmıyor - Çözüm

## Sorun
Localhost'ta Firebase bağlantısı çalışıyor ama GitHub Pages'te Firestore çalışmıyor.

## Çözüm Adımları

### 1. Firebase Console'da Authorized Domains Ekleme

1. **Firebase Console'a gidin**: https://console.firebase.google.com
2. **Projenizi seçin**: `site-17361`
3. **Authentication** > **Settings** > **Authorized domains** sekmesine gidin
4. **Add domain** butonuna tıklayın
5. GitHub Pages domain'inizi ekleyin:
   - Eğer GitHub Pages kullanıyorsanız: `kullaniciadi.github.io`
   - Veya custom domain kullanıyorsanız: `borsamforum.com` (veya hangi domain ise)
6. **Add** butonuna tıklayın

### 2. Firestore Rules'u Deploy Etme

Firestore rules'un doğru deploy edildiğinden emin olun:

```bash
firebase deploy --only firestore:rules
```

### 3. Tarayıcı Konsolunda Hata Kontrolü

GitHub Pages'te sitenizi açın ve F12 > Console sekmesinde hataları kontrol edin:

- CORS hatası görüyorsanız → Authorized domains sorunu
- Permission denied hatası görüyorsanız → Firestore rules sorunu
- Network hatası görüyorsanız → Domain yapılandırması sorunu

### 4. Firebase Yapılandırmasını Kontrol Etme

`scripts/firebase-init.js` dosyasında yapılandırmanın doğru olduğundan emin olun.

## Yaygın Hatalar ve Çözümleri

### Hata: "FirebaseError: Missing or insufficient permissions"
**Çözüm**: Firestore rules'u kontrol edin ve deploy edin.

### Hata: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Çözüm**: Firebase Console'da authorized domains'e domain'inizi ekleyin.

### Hata: "auth/unauthorized-domain"
**Çözüm**: Firebase Console > Authentication > Settings > Authorized domains'e domain'inizi ekleyin.

## Test Etme

1. GitHub Pages'te sitenizi açın
2. F12 > Console sekmesini açın
3. Firebase bağlantısını kontrol edin:
   ```javascript
   // Console'da çalıştırın
   console.log('Firebase connected:', window.firebase || 'Not available');
   ```
4. Firestore bağlantısını test edin:
   ```javascript
   // Eğer db export edilmişse
   import { db } from './scripts/firebase-init.js';
   console.log('Firestore:', db);
   ```

