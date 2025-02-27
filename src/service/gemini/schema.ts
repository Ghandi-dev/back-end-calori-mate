import { SchemaType } from "@google/generative-ai";

const schemaRecipe = {
  description: "Informasi resep masakan beserta nilai gizi per porsi",
  type: SchemaType.OBJECT,
  properties: {
    recipe: {
      type: SchemaType.OBJECT,
      properties: {
        metadata: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
          },
          required: ["title", "description"],
        },
        ingredients: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              quantity: { type: SchemaType.NUMBER },
              unit: { type: SchemaType.STRING },
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
              description: { type: SchemaType.STRING },
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

export { schemaCalorie, schemaRecipe };
