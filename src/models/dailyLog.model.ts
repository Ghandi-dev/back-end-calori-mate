import mongoose, { ObjectId, Schema } from "mongoose";
import * as yup from "yup";

export const DAILYLOG_MODEL_NAME = "DailyLog";

export const dailyLogDTO = yup.object({
  userId: yup.string().required(),
  date: yup.date().required(),
  food: yup.array().of(
    yup.object({
      name: yup.string().required(),
      calories: yup.number().required(),
    })
  ),
  activity: yup.array().of(
    yup.object({
      name: yup.string().required(),
      calories: yup.number().required(),
    })
  ),
  totalCaloriesIn: yup.number().required(),
  totalCaloriesOut: yup.number().required(),
  calorieBalance: yup.number().required(),
});

export type TypeDailyLog = yup.InferType<typeof dailyLogDTO>;

export interface DailyLog extends Omit<TypeDailyLog, "userId"> {
  userId: ObjectId;
}

const DailyLogSchema = new Schema<DailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Schema.Types.Date, required: true },
    food: [
      {
        name: { type: Schema.Types.String },
        calories: { type: Schema.Types.Number },
      },
    ],
    activity: [
      {
        name: { type: Schema.Types.String },
        calories: { type: Schema.Types.Number },
      },
    ],
    totalCaloriesIn: { type: Schema.Types.Number, required: true },
    totalCaloriesOut: { type: Schema.Types.Number, required: true },
    calorieBalance: { type: Schema.Types.Number, required: true },
  },
  { timestamps: true }
);

DailyLogSchema.pre("save", function (next) {
  this.totalCaloriesIn = this.food?.reduce((sum, item) => sum + item.calories, 0) ?? 0;
  this.totalCaloriesOut = this.activity?.reduce((sum, item) => sum + item.calories, 0) ?? 0;
  this.calorieBalance = this.totalCaloriesIn - this.totalCaloriesOut;
  next();
});

const DailyLogModel = mongoose.model<DailyLog>(DAILYLOG_MODEL_NAME, DailyLogSchema);

export default DailyLogModel;
