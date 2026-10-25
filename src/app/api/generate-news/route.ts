import { NextResponse } from 'next/server';
import { genAI } from '../../../lib/gemini';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { result, winner, top3, track } = body;

    if (!track || (!result && !winner)) {
      return NextResponse.json({
        status: "error",
        message: "Lütfen 'result' veya 'winner' ve 'track' parametrelerini gönderin."
      }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({
        status: "error",
        message: "Gemini istemcisi başlatılamadı. GEMINI_API_KEY ortam değişkenini kontrol edin."
      }, { status: 500 });
    }

    let raceClassificationText = '';
    if (Array.isArray(result)) {
      type RaceResultItem = string | { position?: number; name?: string; points?: number };
      raceClassificationText = (result as RaceResultItem[]).map((item, idx) => {
        if (typeof item === 'string') {
          return `P${idx + 1}: ${item}`;
        }
        return `P${item.position || idx + 1}: ${item.name || 'Bilinmiyor'} (Puan: ${item.points ?? 0})`;
      }).join('\n');
    }

    const top3Text = Array.isArray(top3) ? top3.join(', ') : (top3 ? String(top3) : '');
    const dateToday = new Date().toLocaleDateString('tr-TR');

    const prompt = `
F1 Story adında bir Formula 1 simülasyon oyunu geliştiriyoruz. Tamamlanan son yarışın TÜM SONUÇLARINA göre 3 adet heyecanlı, F1 spikeri ve F1 muhabiri tarzında Türkçe haber üretmeni istiyorum.

Yarış Verileri:
- Son Yarışılan Pist: ${track}
- Tüm Yarış Sıralaması (P1 - P22):
${raceClassificationText || `Yarış Galibi: ${winner}\nPodyum:${top3Text}`}

İstediğim 3 Haber Odağı:
1. Haber: Yarış galibiyeti, zafer yarışı ve podyum savaşını konu alan büyük manşet haberi.
2. Haber: Orta sıra sürprizleri, dikkat çeken tırmanışlar veya hayal kırıklığı yaratan takımlar hakkında detaylı yarış analizi.
3. Haber: Şampiyona puan durumuna etkisi, pilot açıklamaları veya gelecek yarış öncesi paddock söylentileri.

İstediğim Çıktı Formatı:
Mutlaka aşağıdaki şemaya uygun bir JSON dizisi döndür. Başka hiçbir açıklama, markdown işareti veya metin ekleme. Sadece saf JSON döndür. Tarih olarak "${dateToday}" kullan.

[
  {
    "id": 1,
    "title": "Haber başlığı",
    "content": "Haber içeriği (yarışın detaylarını ve pilotların açıklamalarını içeren 2-3 cümlelik F1 muhabiri tarzında heyecanlı paragraf)",
    "date": "${dateToday}",
    "category": "FLAŞ HABER",
    "readTime": "2 dk okuma"
  },
  {
    "id": 2,
    "title": "Haber başlığı",
    "content": "Haber içeriği...",
    "date": "${dateToday}",
    "category": "YARIŞ ANALİZİ",
    "readTime": "2 dk okuma"
  },
  {
    "id": 3,
    "title": "Haber başlığı",
    "content": "Haber içeriği...",
    "date": "${dateToday}",
    "category": "SEZON ANALİZİ",
    "readTime": "3 dk okuma"
  }
]
`;

    // Öncelik sırasına göre denenecek güncel modeller
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash"
    ];

    let responseText = '';
    let lastError: any = null;

    // Her model için bekleme (backoff) ile yeniden deneme döngüsü
    for (const modelName of modelsToTry) {
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Gemini API] Deneniyor: ${modelName} (Deneme ${attempt}/${maxRetries})...`);

          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
          });

          const aiResult = await model.generateContent(prompt);
          responseText = aiResult.response.text();

          if (responseText) {
            console.log(`[Gemini API] ${modelName} başarıyla yanıt verdi.`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const is503 = err?.status === 503 || err?.message?.includes('503');

          if (is503 && attempt < maxRetries) {
            const waitMs = attempt * 1500;
            console.warn(`[Gemini API] ${modelName} anlık 503 yoğunluk hatası verdi. ${waitMs}ms beklenip tekrar deneniyor...`);
            await new Promise((res) => setTimeout(res, waitMs));
            continue;
          }

          console.warn(`[Gemini API] ${modelName} başarısız oldu (${err?.status || 'Bilinmeyen Hata'}).`);
          break;
        }
      }

      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error("Hiçbir Gemini modelinden geçerli yanıt alınamadı.");
    }

    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const newsData = JSON.parse(cleanedText);

    const dbDir = path.join(process.cwd(), 'src', 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const newsJsonPath = path.join(dbDir, 'news.json');
    fs.writeFileSync(newsJsonPath, JSON.stringify(newsData, null, 2), 'utf8');

    return NextResponse.json({
      status: "success",
      message: "Haberler başarıyla güncellendi!",
      data: newsData
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Dinamik haber üretimi hatası:", error);
    return NextResponse.json({
      status: "error",
      message: "Gemini API ile haber üretilirken hata oluştu.",
      error: err.message || String(error)
    }, { status: 500 });
  }
}