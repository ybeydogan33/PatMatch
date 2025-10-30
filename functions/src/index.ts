// functions/src/index.ts (SON VE DOĞRU HALİ - Basit API Anahtarı Metodu)

import { HttpsError, onCall } from "firebase-functions/v2/https";
// 1. DOĞRU KÜTÜPHANE:
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gizli anahtara 'process.env' ile erişeceğiz
const geminiApiKey = process.env.GEMINI_API_KEY;

// Fonksiyonumuzu 'secrets' (Gizli Anahtar) ile tanımlıyoruz
export const generatePetDescription = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    
    // Anahtarın yüklenip yüklenmediğini kontrol et
    if (!geminiApiKey) {
      throw new HttpsError(
        "internal",
        "GEMINI_API_KEY sunucuda tanımlanmamış."
      );
    }
    
    // Mobil uygulamadan gelen 'petInfo' verisini al
    const petInfo = request.data.petInfo;
    if (!petInfo) {
      throw new HttpsError(
        "invalid-argument",
        "Fonksiyon 'petInfo' adında bir veri bekliyordu."
      );
    }

    try {
      // 2. YENİLİK: 'genAI' artık kullanılıyor
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // 3. YENİLİK: 'model' artık bir obje, 'string' değil
      // 'gemini-pro' modelini kullanıyoruz (Generative Language API için doğru olan bu)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Gemini için komut (Prompt) (Aynı)
      const prompt = `
        Bir evcil hayvan sahiplendirme ilanı için 'Açıklama' paragrafı yaz.
        Hayvanın bilgileri: "${petInfo}".
        Açıklama, sıcak, davetkar ve samimi olsun. 
        Evcil hayvanın özelliklerini vurgula.
        Sadece ve sadece oluşturduğun ilanın açıklama paragrafını döndür. 
        Başka hiçbir ek metin, başlık veya tırnak işareti ekleme.
      `;

      // 4. YENİLİK: 'model.generateContent' artık doğru obje üzerinde çalışıyor
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const description = response.text();

      // Oluşturulan açıklamayı mobil uygulamaya geri döndür
      return { description: description.trim() };

    } catch (error) {
      console.error("Gemini API hatası:", error);
      throw new HttpsError(
        "internal",
        "Yapay zeka açıklamayı oluşturamadı.",
        error
      );
    }
  }
);