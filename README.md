# Borsa Paneli Auth & Akış (HTML + JS)

Bu proje, Firebase Authentication temelli borsa paneli için oluşturulmuş modern bir ön yüz sağlar. Tek sayfalık uygulama; e-posta/parola ve Google ile giriş akışlarını, parola sıfırlama ve e-posta doğrulamasını içerir. Oturum açan kullanıcılar, herkese açık piyasa akışına metin tabanlı gönderiler paylaşabilir, içeriklerine etiket ekleyebilir ve diğer gönderileri beğenerek etkileşime geçebilir.

## Özellikler

- Kayıt olma, giriş yapma, parola sıfırlama, e-posta doğrulama
- Google ile tek tıkla oturum açma
- Kalıcı oturum desteği (local persistence)
- Instagram/Threads benzeri arayüz: hikaye şeridi, ana akış, sağ panel özetleri
- Ana akış: topluluğa katılmadan etiket zorunlu metin gönderileri paylaşma
- Topluluk akışı: WhatsApp benzeri yönetim, yalnızca yöneticinin yazma izni verdiği üyeler paylaşım yapar
- Topluluk profil fotoğrafları: dairesel avatarlar, ana akış yan panelinde hızlı erişim
- Gönderiler üzerinde beğeni, yorum, yanıt ve kaydetme etkileşimleri
- Yorumlar gönderi altında sıralanır; kullanıcılar kendi yorumlarını veya gönderilerini silebilir
- Topluluk oluşturma: her topluluğun amacı, açıklaması ve üye listesi özelleştirilebilir
- Topluluk rolleri: katılan üyeler varsayılan olarak “üye” olur, yöneticiler yazma izni (yazar rolü) verebilir veya kaldırabilir
- Kullanıcı profilinde paylaşılan ve kaydedilen gönderilerin listesi
- Etiket tabanlı arama: üst arama alanından girilen etiketlerle global ve topluluk akışlarını filtreleme
- Modern, koyu temalı borsa paneli arayüzü

## İçerik

- `index.html`: Arayüz ve formlar
- `styles.css`: Modern görünüm için temel stiller
- `scripts/firebase-init.js`: Firebase uygulamasını başlatır
- `scripts/app.js`: Kimlik doğrulama, gönderi paylaşımı ve gerçek zamanlı akışı yönetir

## Kurulum Adımları

1. **Bağımlılık yok**: Proje sadece CDN üzerinden Firebase modüllerini kullanır. Tek yapmanız gereken dosyaları bir HTTP sunucusunda (veya doğrudan dosya sistemi üzerinden) açmak.

2. **Firebase projesi oluşturun**:
   - [Firebase Konsolu](https://console.firebase.google.com/) → Yeni proje.
   - Authentication servisinde **Email/Password** ve **Google** sağlayıcılarını etkinleştirin.

3. **Web uygulaması ekleyin**:
   - Firebase projenize bir Web App ekleyin.
   - Verilen konfigürasyon objesini `scripts/firebase-init.js` dosyasındaki `firebaseConfig` içine yapıştırın.

4. **Firestore ve Storage yapılarını hazırlayın**:
   - Firestore → `communities` koleksiyonunu ve her topluluk için `members` alt koleksiyonu oluşturmayı planlayın (uygulama ilk topluluğu oluşturduğunda bu dokümanları oluşturur).
   - Firestore → Gönderiler `posts` koleksiyonunda tutulur ve her belge `communityId` alanını içerir.
   - Storage → Topluluk avatarları `community-avatars/<communityId>/...` klasöründe saklanır (kurallar aşağıda).

5. **Gerekli Firestore indeksleri**:
   - `posts` koleksiyonu `where("communityId", "==", ...)` ve `orderBy("createdAt")` kombinasyonunu kullandığından, ilk sorguda Firestore sizden bir bileşik indeks oluşturmanızı isteyecektir. Konsoldaki uyarıdaki bağlantıyı takip ederek indeksi oluşturun.

6. **Yerel sunucu ile çalıştırın** (önerilir):
   - Örneğin Node.js kuruluysa: `npx serve` komutu ile dizini yayınlayın.
   - Alternatif olarak VS Code Live Server, Python `python -m http.server`, veya istediğiniz herhangi bir statik sunucu kullanılabilir.

7. **Oturum kalıcılığı**:
   - Kod, varsayılan olarak `browserLocalPersistence` kullanır; böylece sekme kapansa bile oturum açık kalır.

## Örnek Güvenlik Kuralları

Geliştirme aşamasında herkesin gönderi görmesini, sadece giriş yapan kullanıcıların paylaşım yapmasını sağlayan basit kuralları aşağıdaki gibi tanımlayabilirsiniz. Üretim senaryosunda kuralları ihtiyaçlarınıza göre sıkılaştırmayı unutmayın.

**Firestore (`posts`, `communities` ve alt koleksiyonları):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function globalCommunityId() {
      return "__global__";
    }

    function membershipDoc(communityId, uid) {
      return get(/databases/$(database)/documents/communities/$(communityId)/members/$(uid));
    }

    function hasMembership(communityId) {
      return membershipDoc(communityId, request.auth.uid).exists;
    }

    function membershipRole(communityId) {
      return membershipDoc(communityId, request.auth.uid).data.role;
    }

    function isCommunityAdmin(communityId) {
      return hasMembership(communityId) && membershipRole(communityId) == "admin";
    }

    function canWritePost(communityId) {
      return hasMembership(communityId) &&
        (membershipRole(communityId) == "admin" || membershipRole(communityId) == "writer");
    }

    function canWriteComment(postId) {
      let post = get(/databases/$(database)/documents/posts/$(postId));
      return post.exists &&
        (post.data.communityId == globalCommunityId() ||
         hasMembership(post.data.communityId));
    }

    match /communities/{communityId} {
      allow read: if true;

      allow create: if isSignedIn()
        && request.resource.data.createdBy == request.auth.uid;

      allow update, delete: if isSignedIn() && isCommunityAdmin(communityId);

      match /members/{memberId} {
        allow read: if true;

        allow create: if isSignedIn()
          && request.auth.uid == memberId
          && request.resource.data.role in ["member", "writer", "admin"];

        allow update: if isSignedIn() && (
            (request.auth.uid == memberId &&
              request.resource.data.role == resource.data.role) ||
            isCommunityAdmin(communityId)
          )
          && request.resource.data.role in ["member", "writer", "admin"];

        allow delete: if isSignedIn() && (
            request.auth.uid == memberId ||
            (isCommunityAdmin(communityId) && resource.data.role != "admin")
          );
      }
    }

    match /posts/{postId} {
      allow read: if true;

      allow create: if isSignedIn() && (
        request.resource.data.communityId == globalCommunityId() ||
        (request.resource.data.communityId is string &&
          canWritePost(request.resource.data.communityId))
      );

      // Beğeni/kaydet gibi alanlar için genel güncelleme izni (giriş şart)
      allow update: if isSignedIn();

      allow delete: if isSignedIn()
        && request.auth.uid == resource.data.authorUid;

      match /comments/{commentId} {
        allow read: if true;

        allow create: if isSignedIn() && canWriteComment(postId);

        allow delete: if isSignedIn()
          && request.auth.uid == resource.data.authorUid;
      }
    }
  }
}
```

**Storage (topluluk avatar görselleri):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /community-avatars/{communityId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Opsiyonel: Emulator Desteği

Geliştirme sırasında gerçek kullanıcıları etkilemeden test etmek için Firebase Authentication Emulator'ı kullanabilirsiniz. Bunun için:

```javascript
import { connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth } from "./firebase-init.js";

connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
```

Bu kod bloğunu yalnızca geliştirme ortamında çalışacak şekilde koşullandırmanız yeterlidir.

## Güvenlik Notları

- Firebase API anahtarınız gizli değildir, ancak `authDomain` gibi alan adlarını kontrol altında tutun.
- E-posta doğrulaması yapmadan hassas işlemleri gerçekleştirmeyin. Örnek uygulama, doğrulama durumunu arayüzde gösterir.
- Üretim ortamında HTTPS kullanmayı unutmayın.
- Gönderiler herkese açık olarak listelenir. Kural veya filtrelemeyi ihtiyaçlarınıza göre güncelleyin.
- Yorum belgeleri `parentId` alanıyla (üst yorum referansı) saklanır. Yanıt ve silme işlemlerine göre kuralları gözden geçirin.
- Topluluk yöneticileri (`role: "admin"`) dışında kimse topluluk üyelik dokümanlarını güncelleyemez (temel kuralları yukarıda örnekledik; üretim için kısıtları genişletin).
- `communities` ve `communities/{communityId}/members` yazma kurallarını kendi gereksinimlerinize göre tanımlayın. Tipik olarak yalnızca yöneticilerin topluluk profilini ve üyelerin rollerini değiştirmesine izin vermek isteyeceksiniz; üyelerin katılımı için uygun kontrollü kurallar yazın.

## Topluluk Yapısı ve Roller

- `communities` koleksiyonu: her belge `name`, `purpose`, `description`, `createdBy`, `createdAt`, `memberCount`, `writerCount`, `postCount` alanlarını içerir.
- Topluluk profil görselleri için `avatarUrl` alanı kullanılır; görseller Firebase Storage'da `community-avatars/{communityId}/` altında saklanır.
- `communities/{communityId}/members/{uid}` dokümanları: `role` (`admin`, `writer`, `member`), `joinedAt`, `displayName`, `email`.
- `posts` koleksiyonu: her gönderi `communityId` alanıyla hangi akışa ait olduğunu belirtir. Ana akış gönderileri için bu alan `__global__` değerini alır; topluluk gönderileri Firestore belge kimliği ile eşleşir. `tags` alanı zorunludur ve gönderiye ait etiketleri küçük harf olarak saklar.
- Roller:
  - `admin`: topluluğu kuran kişi; üyeleri yönetebilir, yazma izni verebilir/kaldırabilir, topluluk detaylarını güncelleyebilir.
  - `writer`: gönderi paylaşma yetkisi olan üyeler. Yönetici istediği üyeye yazma izni verebilir.
  - `member`: topluluğa katılan, gönderileri ve yorumları görebilen kullanıcılar.
- Yorumlar herkese açıktır; gönderiyi veya yorumunu yalnızca sahibi silebilir.
- Topluluğa katılmayan kullanıcılar topluluk akışındaki gönderileri göremez. Ana akış tüm giriş yapan kullanıcılar için açıktır. Katılım ve yazma izinleri WhatsApp tarzı bir deneyim sağlayacak şekilde yönetilir.
- Yorumlar `posts/{postId}/comments` alt koleksiyonunda tutulur; isterseniz düzenleme/silme yetkilerini ek kurallarla sınırlandırabilirsiniz.

## Ekran Görünümü

Proje, Instagram benzeri bir üst bar ve akış düzenine sahiptir. Sol sütunda gezinme, orta sütunda hikayeler + gönderi akışı, sağ sütunda yorum paneli ve profil özetleri yer alır. Giriş/kayıt gibi diğer görünümler aynı sayfa içinde modül olarak açılır.

---

Sorularınız veya geliştirmek istediğiniz ek akışlar olursa katkı sağlamaya hazırım!


**Firestore ve Storage hizmetlerini açın**:
   - **Firestore** → bir veritabanı oluşturun (Production ya da Test modu).
   - **Storage** → varsayılan bucket'ı etkinleştirin.

5. **Yetkili alanları güncelleyin**:
   - Authentication → Settings → Authorized domains bölümünde, test edeceğiniz domainleri (ör. `localhost`) ekleyin.