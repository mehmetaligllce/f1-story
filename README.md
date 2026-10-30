# 🏎️ F1 Story — Formula 1 Sezon & Kariyer Simülasyonu

Canlı Demo: **[f1-story-game.vercel.app](https://f1-story-game.vercel.app/)**

**F1 Story**, kendi pilotunu seçip yarış içi telsiz kararlarıyla kaderini belirleyebileceğin veya tüm sezonu hızlıca simüle edebileceğin interaktif bir Formula 1 web oyunudur.

---

## 🎮 Özellikler & Oyun Modları

* **Kariyer / Karar Modu :** Seçtiğin pilotla sıralama turlarına (Qualifying) çık, yarış boyunca yarış mühendisinden gelen telsiz mesajlarına göre kritik kararlar ver. Seçimlerin (`+` / `-` etki puanları) doğrudan yarış sonu sıralamanı değiştirir.
* **Hızlı Sezon Simülatörü:** Takvimdeki pistlerde sıralama ve yarış simülasyonlarını tek tıkla çalıştır, pilotlar ve takımlar şampiyonası puan durumunu takip et.
* **Dinamik Puan Tablosu:** Zustand ile tarayıcı hafızasında (`localStorage`) tutulan gerçek zamanlı Pilotlar ve Takımlar Şampiyonası.

---

## 🤖 Yapay Zeka (AI) Kullanımı

Projede yapay zeka iki temel alanda kullanılmıştır:

1. **Oyun İçi Dinamik F1 Haberleri (Google Gemini API):**
   * Her yarış sonunda oluşan P1–P22 tam yarış sıralaması arka planda `/api/generate-news` servisine gönderilir.
   * **Google Gemini** modelleri yarışın galibini, orta sıra sürprizlerini ve şampiyona analizini gerçek bir F1 muhabiri dilinde 3 sıcak başlık halinde üretir.
2. **Arayüz & CSS Tasarımı:**
   * Oyunun F1 yayın grafikleri (telemetri ekranları, kokpit telsiz arayüzü, podyum kartları ve karanlık tema CSS modülleri) yapay zeka desteğiyle tasarlanmış ve kodlanmıştır.

---

## 🚀 Kurulum ve Çalıştırma

Öncelikle ana dizinde bir `.env.local` dosyası oluşturup Gemini API anahtarınızı ekleyin:

```env
GEMINI_API_KEY=senin_api_anahtarin
```

### 🐳 Docker ile Çalıştırma (Önerilen)

Projede hazır `Dockerfile` ve `docker-compose.yml` bulunmaktadır. Tek komutla ayağa kaldırabilirsiniz:

```bash
# İlk kurulumda veya kod değiştiğinde:
docker compose up --build

# Sonraki çalıştırmalarda doğrudan:
docker compose up
```

### 💻 NPM ile Yerel Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıdan `http://localhost:3000` adresine giderek oynamaya başlayabilirsiniz.

---

## 🛠️ Kullanılan Teknolojiler

* **Next.js (App Router) & TypeScript**
* **Zustand** (State & Şampiyona Yönetimi)
* **Google Generative AI (`@google/generative-ai`)**
* **CSS Modules** (AI destekli özel F1 arayüz tasarımları)
* **Docker & Docker Compose**

