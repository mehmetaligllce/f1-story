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
        return `P${item.position || idx + 1}: ${item.name} - Skor: ${item.points}`;
      }).join('\n');
    }

    const top3Text = Array.isArray(top3) ? top3.join(', ') : (top3 ? String(top3) : '');
    const dateToday = new Date().toLocaleDateString('tr-TR');

    const prompt = `
    F1 Story adında bir Formula 1 simülasyon oyunu geliştiriyoruz. Tamamlanan son yarışın TÜM SONUÇLARINA göre 3 adet heyecanlı, F1 spikeri ve F1 muhabiri tarzında Türkçe haber üretmeni istiyorum.
    
    Yarış Verileri:
    - Son Yarışılan Pist: ${track}
    - Tüm Yarış Sıralaması (P1 - P22):
    ${raceClassificationText || `Yarış Galibi: ${winner}\nPodyum: ${top3Text}`}
    
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

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const aiResult = await model.generateContent(prompt);
    const responseText = aiResult.response.text();
    
    // Parse to ensure it is valid JSON
    const newsData = JSON.parse(responseText);

    // Save to local src/db/news.json file
    const newsJsonPath = path.join(process.cwd(), 'src', 'db', 'news.json');
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

