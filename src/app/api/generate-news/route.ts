import { NextResponse } from 'next/server';
import { genAI } from '../../../lib/gemini';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'src', 'db', 'news.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'f1story_news.json');
let memoryNewsCache: NewsItem[] | null = null;

function saveNewsSafe(news: NewsItem[]) {
  memoryNewsCache = news;
  try {
    const dbDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(news, null, 2), 'utf8');
  } catch {
    try {
      fs.writeFileSync(TMP_DB_PATH, JSON.stringify(news, null, 2), 'utf8');
    } catch {
    }
  }
}

function readNewsSafe(): NewsItem[] {
  if (memoryNewsCache !== null) {
    return memoryNewsCache;
  }
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const tmpData = fs.readFileSync(TMP_DB_PATH, 'utf8');
      const parsed = JSON.parse(tmpData);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    }
  } catch {
  }
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    }
  } catch {
  }
  return [];
}

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
        const name = typeof item === 'string' ? item : (item.name || 'Bilinmiyor');
        return `P${idx + 1}: ${name}`;
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

    const modelsToTry = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash"
    ];

    let responseText = '';
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini API] Deneniyor: ${modelName}...`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (4s) on ${modelName}`)), 4000)
        );

        const aiResult = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise
        ]);

        responseText = aiResult.response.text();

        if (responseText) {
          console.log(`[Gemini API] ${modelName} başarıyla ve hızla yanıt verdi.`);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini API] ${modelName} yanıt vermedi (${errorMsg}), sıradaki modele geçiliyor...`);
        await new Promise((res) => setTimeout(res, 500));
      }
    }

    let newsData: NewsItem[] = [];
    if (responseText) {
      try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        newsData = JSON.parse(cleanedText) as NewsItem[];
      } catch (parseErr) {
        console.error("JSON parse hatası:", parseErr);
      }
    }

    if (!newsData || newsData.length === 0) {
      if (lastError) {
        console.warn("[Gemini API] AI modellerinden yanıt alınamadı, yarış sıralamasına göre dinamik haber oluşturuluyor. Hata detayı:", lastError);
      }
      const p1 = Array.isArray(result) && result[0] ? (typeof result[0] === 'string' ? result[0] : (result[0].name || 'Yarış Galibi')) : (winner || 'Yarış Galibi');
      const p2 = Array.isArray(result) && result[1] ? (typeof result[1] === 'string' ? result[1] : (result[1].name || 'İkinci Pilot')) : 'İkinci Pilot';
      const p3 = Array.isArray(result) && result[2] ? (typeof result[2] === 'string' ? result[2] : (result[2].name || 'Üçüncü Pilot')) : 'Üçüncü Pilot';

      newsData = [
        {
          id: 1,
          title: `${track} Grand Prix'sinde Zafer ${p1}'in!`,
          content: `${track} pistinde koşulan heyecan dolu yarışta damalı bayrağı ilk sırada geçen ${p1} kusursuz bir zafere imza attı. Podyumun diğer basamaklarını ${p2} ve ${p3} doldururken galibiyet kutlamaları geceye damga vurdu.`,
          date: dateToday,
          category: "FLAŞ HABER",
          readTime: "2 dk okuma"
        },
        {
          id: 2,
          title: `Orta Sırada Büyük Rekabet: Podyum Savaşı Kızışıyor!`,
          content: `${track} mücadelesinde orta sıralardaki kıran kırana mücadele ve pit stratejileri yarışın kaderini belirledi. ${p2} ve ${p3} son tura kadar nefes kesen bir savunma sergiledi.`,
          date: dateToday,
          category: "YARIŞ ANALİZİ",
          readTime: "2 dk okuma"
        },
        {
          id: 3,
          title: `Puan Tablosunda Kartlar Yeniden Dağıtıldı!`,
          content: `${p1}'in ${track} zaferiyle birlikte şampiyonluk yarışındaki puan farkı yeniden şekillendi. Pilotlar ve mühendisler şimdiden bir sonraki yarış hafta sonunun stratejilerini kurmaya başladı.`,
          date: dateToday,
          category: "SEZON ANALİZİ",
          readTime: "3 dk okuma"
        }
      ];
    }

    const finalNews = Array.isArray(newsData) ? newsData.slice(0, 3) : [newsData];
    saveNewsSafe(finalNews);

    return NextResponse.json({
      status: "success",
      message: "Haberler başarıyla güncellendi!",
      data: finalNews
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

export async function GET() {
  try {
    const news = readNewsSafe();
    return NextResponse.json({
      status: "success",
      news
    });
  } catch {
    return NextResponse.json({ status: "error", news: [] });
  }
}

export async function DELETE() {
  try {
    saveNewsSafe([]);
    return NextResponse.json({
      status: "success",
      message: "Haberler ve olaylar sıfırlandı."
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Haberler sıfırlanamadı." }, { status: 500 });
  }
}