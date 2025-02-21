import mongoose, { ObjectId, Schema } from "mongoose";
import * as yup from "yup";
import { ACTIVITY_LEVELS, GOALS } from "../utils/enum";

export const DAILYLOG_MODEL_NAME = "DailyLog";

export const dailyLogDTO = yup.object({
  userId: yup.string().required(),
  date: yup.date(),
  weight: yup.number().min(1, "Weight must be greater than 0").required(),
  height: yup.number().min(1, "Height must be greater than 0").required(),
  goal: yup.string().required(),
  activityLevel: yup.string().required(),
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
  totalCaloriesIn: yup.number(),
  totalCaloriesOut: yup.number(),
  bmr: yup.number(),
  tdee: yup.number(),
  report: yup.string(),
});

export type TypeDailyLog = yup.InferType<typeof dailyLogDTO>;

export interface DailyLog extends Omit<TypeDailyLog, "userId"> {
  userId: ObjectId;
}

const DailyLogSchema = new Schema<DailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Schema.Types.Date, required: true, default: new Date().toISOString().split("T")[0] },
    weight: { type: Schema.Types.Number, required: true },
    height: { type: Schema.Types.Number, required: true },
    goal: { type: Schema.Types.String, enum: [GOALS.LOSE, GOALS.MAINTAIN, GOALS.GAIN], required: true },
    activityLevel: {
      type: Schema.Types.String,
      enum: [
        ACTIVITY_LEVELS.SEDENTARY,
        ACTIVITY_LEVELS.LIGHTLY_ACTIVE,
        ACTIVITY_LEVELS.MODERATELY_ACTIVE,
        ACTIVITY_LEVELS.VERY_ACTIVE,
        ACTIVITY_LEVELS.SUPER_ACTIVE,
      ],
      required: true,
    },
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
    totalCaloriesIn: { type: Schema.Types.Number },
    totalCaloriesOut: { type: Schema.Types.Number },
    bmr: { type: Number, default: 0 },
    tdee: { type: Number, default: 0 },
    report: { type: Schema.Types.String },
  },

  { timestamps: true }
).index({ date: 1, userId: 1 }, { unique: true });

DailyLogSchema.pre("save", function (next) {
  this.totalCaloriesIn = this.food?.reduce((sum, item) => sum + item.calories, 0) ?? 0;
  this.totalCaloriesOut = this.activity?.reduce((sum, item) => sum + item.calories, 0) ?? 0;
  next();
});

DailyLogSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as Partial<TypeDailyLog>;
  if (update.food || update.activity) {
    const totalCaloriesIn = update.food ? update.food.reduce((sum, item) => sum + item.calories, 0) : this.get("totalCaloriesIn");
    const totalCaloriesOut = update.activity ? update.activity.reduce((sum, item) => sum + item.calories, 0) : this.get("totalCaloriesOut");
    update.totalCaloriesIn = totalCaloriesIn;
    update.totalCaloriesOut = totalCaloriesOut;
  }

  next();
});

const DailyLogModel = mongoose.model<DailyLog>(DAILYLOG_MODEL_NAME, DailyLogSchema);

export default DailyLogModel;
