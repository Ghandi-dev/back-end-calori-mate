import mongoose, { Schema } from "mongoose";
import * as yup from "yup";

export const RECIPE_MODEL_NAME = "Recipe";

export const recipeDTO = yup.object({
  title: yup.string().required(),
  image: yup.string().required(),
  portion: yup.number().required(),
  ingredients: yup.array().of(
    yup.object({
      quantity: yup.string().required(),
      ingredient: yup.string().required(),
    })
  ),
  instructions: yup.array().of(
    yup.object({
      step: yup.string().required(),
      description: yup.string().required(),
      thumbnail: yup.string().required(),
    })
  ),
  nutrition: yup.object({
    calories: yup.number().required(),
    protein: yup.number().required(),
    carbohydrates: yup.number().required(),
    fat: yup.number().required(),
  }),
});

export type TypeRecipe = yup.InferType<typeof recipeDTO>;

export interface IRecipe extends TypeRecipe {}

export const recipeSchema = new Schema<IRecipe>({
  title: { type: String, required: true },
  image: { type: String, required: true },
  portion: { type: Number, required: true },
  ingredients: [
    {
      quantity: { type: String, required: true },
      ingredient: { type: String, required: true },
    },
  ],
  instructions: [
    {
      step: { type: Number, required: true },
      description: { type: String, required: true },
      thumbnail: { type: String, required: true },
    },
  ],
  nutrition: { type: Object, required: true },
}).index({ title: "text" });

export const RecipeModel = mongoose.model<TypeRecipe>(RECIPE_MODEL_NAME, recipeSchema);

export default RecipeModel;
