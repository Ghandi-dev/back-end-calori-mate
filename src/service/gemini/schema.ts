import { SchemaType } from "@google/generative-ai";

const schemaRecipe = {
  description: "Informasi resep masakan beserta nilai gizi per porsi dalam dua bahasa (Indonesia & Inggris)",
  type: SchemaType.OBJECT,
  properties: {
    recipe: {
      type: SchemaType.OBJECT,
      properties: {
        metadata: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.OBJECT,
              properties: {
                en: { type: SchemaType.STRING },
                id: { type: SchemaType.STRING },
              },
              required: ["en", "id"],
            },
            description: {
              type: SchemaType.OBJECT,
              properties: {
                en: { type: SchemaType.STRING },
                id: { type: SchemaType.STRING },
              },
              required: ["en", "id"],
            },
          },
          required: ["title", "description"],
        },
        ingredients: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.OBJECT,
                properties: {
                  en: { type: SchemaType.STRING },
                  id: { type: SchemaType.STRING },
                },
                required: ["en", "id"],
              },
              quantity: { type: SchemaType.NUMBER },
              unit: {
                type: SchemaType.OBJECT,
                properties: {
                  en: { type: SchemaType.STRING },
                  id: { type: SchemaType.STRING },
                },
                required: ["en", "id"],
              },
            },
            required: ["name", "quantity", "unit"],
          },
        },
        instructions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              step: { type: SchemaType.NUMBER },
              description: {
                type: SchemaType.OBJECT,
                properties: {
                  en: { type: SchemaType.STRING },
                  id: { type: SchemaType.STRING },
                },
                required: ["en", "id"],
              },
            },
            required: ["step", "description"],
          },
        },
        nutrition_info_per_serving: {
          type: SchemaType.OBJECT,
          properties: {
            calories: { type: SchemaType.NUMBER },
            macronutrients: {
              type: SchemaType.OBJECT,
              properties: {
                protein_grams: { type: SchemaType.NUMBER },
                carbohydrates_grams: { type: SchemaType.NUMBER },
                fat_grams: { type: SchemaType.NUMBER },
              },
              required: ["protein_grams", "carbohydrates_grams", "fat_grams"],
            },
          },
          required: ["calories", "macronutrients"],
        },
      },
      required: ["metadata", "ingredients", "instructions", "nutrition_info_per_serving"],
    },
  },
  required: ["recipe"],
};

const schemaCalorie = {
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

const schemaReport = {
  description: "Laporan kesehatan berdasarkan data",
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.STRING },
    en: { type: SchemaType.STRING },
  },
  required: ["id", "en"],
};

export { schemaCalorie, schemaRecipe, schemaReport };
