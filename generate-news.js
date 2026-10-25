/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Manually load GEMINI_API_KEY from .env.local if not in process.env
const envPath = path.join(__dirname, '.env.local');
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("HATA: GEMINI_API_KEY bulunamadı. Lütfen .env.local dosyasını kontrol edin.");
  process.exit(1);
}

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(apiKey);

// Mock data to supply to Gemini (previous race, standings, track)
const raceData = {
  winner: "Lewis Hamilton (Scuderia Ferrari HP)",
  top3: [
    "1. Lewis Hamilton (Scuderia Ferrari HP) - 25 PTS",
    "2. Max Verstappen (Oracle Red Bull Racing) - 18 PTS",
    "3. Charles Leclerc (Scuderia Ferrari HP) - 15 PTS"
  ],
  track: "Australian Grand Prix (Albert Park Circuit)"
};

async function main() {
  console.log("Gemini API'sine istek gönderiliyor...");
  
  const prompt = `
  F1 Story adında bir Formula 1 simülasyon oyunu geliştiriyoruz. Son yarışta yaşanan gelişmelere göre 3 adet heyecanlı, F1 spikeri tarzında Türkçe haber üretmeni istiyorum.
  
  Yarış Verileri:
  - Son Yarışın Galibi: ${raceData.winner}
  - Puan Durumunda İlk 3 Sıradaki Pilot: ${raceData.top3.join(', ')}
  - Son Yarışılan Pist: ${raceData.track}
  
  İstediğim Çıktı Formatı:
  Mutlaka aşağıdaki şemaya uygun bir JSON dizisi döndür. Başka hiçbir açıklama, markdown işareti (örn: \`\`\`json) veya metin ekleme. Sadece saf JSON döndür.
  
  [
    {
      "id": 1,
      "title": "Haber başlığı (örneğin Hamilton'ın Ferrari ile ilk zaferi hakkında heyecanlı bir başlık)",
      "content": "Haber içeriği (yarışın detaylarını, pist koşullarını ve pilotların açıklamalarını içeren 2-3 cümlelik F1 muhabiri tarzında haber)",
      "date": "20.05.2026",
      "category": "FLAŞ HABER / SEZON ANALİZİ / SÖYLENTİ",
      "readTime": "2 dk okuma"
    },
    {
      "id": 2,
      "title": "Haber başlığı (örneğin Verstappen'in ikincilik mücadelesi veya Red Bull yorumları)",
      "content": "Haber içeriği...",
      "date": "20.05.2026",
      "category": "TAKIM ANALİZİ / SÖYLENTİ",
      "readTime": "1 dk okuma"
    },
    {
      "id": 3,
      "title": "Haber başlığı (örneğin Ferrari'nin podyum domine etmesi ve ilk 3 durumları)",
      "content": "Haber içeriği...",
      "date": "20.05.2026",
      "category": "SEZON ANALİZİ / SÖYLENTİ",
      "readTime": "3 dk okuma"
    }
  ]
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse to ensure it is valid JSON
    const newsData = JSON.parse(responseText);
    
    // Target news.json path
    const newsJsonPath = path.join(__dirname, 'src', 'db', 'news.json');
    
    // Write back to news.json
    fs.writeFileSync(newsJsonPath, JSON.stringify(newsData, null, 2), 'utf8');
    
    console.log("BAŞARILI: Haberler başarıyla üretildi ve src/db/news.json dosyasına yazıldı!");
    console.log("Üretilen Haberler:\n", JSON.stringify(newsData, null, 2));
  } catch (error) {
    console.error("Gemini çağrısı sırasında bir hata oluştu:", error);
    process.exit(1);
  }
}

main();
