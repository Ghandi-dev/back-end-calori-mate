import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../../utils/env";
import { IHealthReport } from "../../utils/interface";
import { schemaCalorie, schemaRecipe } from "./schema";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const calorieCalculate = async (food: string[], activity: string[], weight: number, height: number) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schemaCalorie,
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

const healthReport = async (data: IHealthReport, lang: string) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.5,
      topK: 10,
      maxOutputTokens: 800,
    },
  });

  let prompt = "";

  if (lang === "id") {
    prompt = `
      Saya ingin mendapatkan analisis kesehatan berdasarkan data berikut:

      - BMR (Basal Metabolic Rate): ${data.bmr} cal  
      - TDEE (Total Daily Energy Expenditure): ${data.tdee} cal  
      - Total Kalori Masuk: ${data.totalCaloriesIn} cal  
      - Total Kalori Keluar: ${data.totalCaloriesOut} cal  
      - Berat Badan: ${data.weight} kg  
      - Tinggi Badan: ${data.height} cm  
      - Goal: ${data.goal} berat badan  

      Mohon berikan laporan yang mencakup:  
      1. Apakah pengguna berada dalam kondisi surplus, defisit, atau seimbang berdasarkan TDEE, dan jelaskan apakah masih dalam batas aman atau tidak.
      2. Kondisi BMI pengguna  
      3. Saran praktis yang dapat dilakukan sehari-hari untuk mencapai goal tersebut.  

      Catatan Penting:  
      - Hindari rekomendasi yang menyarankan konsultasi ke ahli gizi atau dokter.  
      - Jangan menyarankan penggunaan alat pelacak kebugaran.  
      - Fokuskan saran pada dan hanya pada pola makan, aktivitas fisik.  
      - Berikan laporan yang langsung ke inti masalah, tanpa pengantar atau kata tambahan yang tidak diperlukan.
      - Format jawaban hanya dan hanya dalam bentuk paragraf tanpa ada special character.
    `;
  } else {
    prompt = `
      I want to get a health analysis based on the following data:

      - BMR (Basal Metabolic Rate): ${data.bmr} cal  
      - TDEE (Total Daily Energy Expenditure): ${data.tdee} cal  
      - Total Calories In: ${data.totalCaloriesIn} cal  
      - Total Calories Out: ${data.totalCaloriesOut} cal  
      - Weight: ${data.weight} kg  
      - Height: ${data.height} cm  
      - Goal: ${data.goal} weight  

      Please provide a report that includes:  
      1. Whether the user is in a surplus, deficit, or balanced state based on TDEE, and explain whether it is still within a safe range or not.  
      2. The user's BMI condition.  
      3. Practical daily tips to achieve their goal.  

      Important Notes:  
      - Avoid recommendations suggesting consulting a nutritionist or doctor.  
      - Do not recommend using fitness tracking devices.  
      - Focus advice solely on diet and physical activity.  
      - Provide a concise and to-the-point report without unnecessary introductions or extra words.
      - The response should be formatted as a paragraph only, without any special characters.
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error parsing response from AI:", error);
    return null;
  }
};

const generateRecipeSuggestion = async (tdee: number, goal: string, lang: string) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schemaRecipe,
      temperature: 0.5,
      topP: 0.7,
      topK: 40,
      maxOutputTokens: 1000,
    },
  });

  const prompt = `
      Berikan rekomendasi resep makanan sehat berdasarkan data kesehatan saya berikut:

- Kebutuhan kalori harian (TDEE): ${tdee} kalori.
- Distribusi makronutrien: 
  - 50% karbohidrat
  - 20% protein
  - 30% lemak
  - Tujuan : ${goal} berat badan,

Mohon buatkan resep yang sesuai dengan kebutuhan kalori harian saya dan distribusi makronutrien yang telah ditentukan. Pastikan resep tersebut mencakup:
1. Daftar bahan lengkap beserta jumlahnya.
2. Langkah-langkah memasak yang jelas dan mudah diikuti.
3. Informasi nilai gizi per porsi, termasuk total kalori, protein, karbohidrat, lemak, serat, gula, dan sodium.
4. Deskripsi singkat tentang resep, seperti manfaat kesehatannya atau alasan mengapa resep ini cocok untuk saya.

Rekomendasi resep harus disesuaikan dengan tujuan saya. Gunakan bahasa ${lang} dalam menjawab.
    `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error parsing response from AI:", error);
    return null;
  }
};

export { calorieCalculate, healthReport, generateRecipeSuggestion };
