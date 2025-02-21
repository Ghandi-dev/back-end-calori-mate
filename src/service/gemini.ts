import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../utils/env";
import { IHealthReport } from "../utils/interface";

const schema = {
  description: "Jumlah kalori makanan dan aktivitas",
  type: SchemaType.OBJECT,
  properties: {
    food: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          calories: { type: SchemaType.NUMBER },
        },
        required: ["name", "calories"],
      },
    },
    activity: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          calories: { type: SchemaType.NUMBER },
        },
        required: ["name", "calories"],
      },
    },
  },
  required: ["food", "activity"],
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const calorieCalculate = async (food: string[], activity: string[], weight: number, height: number) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1,
      topP: 0.8,
      topK: 10,
    },
  });

  if (!food?.length && !activity?.length) {
    return {
      food: [],
      activity: [],
    };
  }

  const foodList = food.join(", ");
  const activityList = activity.join(", ");

  const prompt = `
        Saya ingin memperoleh estimasi jumlah kalori dari daftar makanan dan aktivitas berikut:

        Makanan: ${foodList}  
        Aktivitas: ${activityList}  

        Dengan berat badan ${weight} kg dan tinggi badan ${height} cm.

        Mohon hitung estimasi total kalori yang dikonsumsi dari makanan serta total kalori yang dibakar dari aktivitas yang telah disebutkan.  
        Pastikan setiap nilai yang diberikan menggunakan angka yang realistis berdasarkan referensi umum tentang kandungan kalori.  

        Berikan hasil dalam format JSON sesuai dengan skema yang telah ditentukan, tanpa mengubah atau menambahkan apapun pada nama makanan maupun aktivitas.
    `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error parsing response from AI:", error);
    return {
      food: [],
      activity: [],
    };
  }
};

const healthReport = async (data: IHealthReport) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3, // Menurunkan variabilitas jawaban agar lebih akurat
      topP: 0.5, // Meningkatkan variasi tanpa terlalu acak
      topK: 10,
      maxOutputTokens: 800,
    },
  });

  const prompt = `
        Saya ingin mendapatkan analisis kesehatan berdasarkan data berikut:

        - BMR (Basal Metabolic Rate): ${data.bmr} kcal  
        - TDEE (Total Daily Energy Expenditure): ${data.tdee} kcal  
        - Total Kalori Masuk: ${data.totalCaloriesIn} kcal  
        - Total Kalori Keluar: ${data.totalCaloriesOut} kcal  
        - Berat Badan: ${data.weight} kg  
        - Tinggi Badan: ${data.height} cm  
        - Goal: ${data.goal} berat badan  

        Mohon berikan laporan yang mencakup:  
        1. Apakah pengguna berada dalam kondisi surplus, defisit, atau seimbang berdasarkan TDEE, dan jelaskan apakah masih dalam batas aman atau tidak.
        2. Kondisi BMI pengguna  
        2. Saran praktis yang dapat dilakukan sehari-hari untuk mencapai goal tersebut.  

        Catatan Penting:  
        - Hindari rekomendasi yang menyarankan konsultasi ke ahli gizi atau dokter.  
        - Jangan menyarankan penggunaan alat pelacak kebugaran.  
        - Fokuskan saran pada dan hanya pada pola makan, aktivitas fisik.  
        - Berikan laporan yang langsung ke inti masalah, tanpa pengantar atau kata tambahan yang tidak diperlukan.  
        `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error parsing response from AI:", error);
    return null;
  }
};

export { calorieCalculate, healthReport };
