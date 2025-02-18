import mongoose, { ObjectId, Schema } from "mongoose";
import * as yup from "yup";
import { USER_MODEL_NAME } from "./User.model";

export const USERDETAIL_MODEL_NAME = "UserDetail";

export enum GENDERS {
  MALE = "male",
  FEMALE = "female",
}

export enum GOALS {
  LOSE = "lose",
  MAINTAIN = "maintain",
  GAIN = "gain",
}

export enum ACTIVITY_LEVELS {
  SEDENTARY = "sedentary",
  LIGHTLY_ACTIVE = "lightly active",
  MODERATELY_ACTIVE = "moderately active",
  VERY_ACTIVE = "very active",
  SUPER_ACTIVE = "super active",
}

export const userDetailDTO = yup.object({
  userId: yup.string().required(),
  weight: yup.number().min(1, "Weight must be greater than 0").required(),
  height: yup.number().min(1, "Height must be greater than 0").required(),
  goal: yup.string().required(),
  activityLevel: yup.string().required(),
  bmr: yup.number().required(),
  tdee: yup.number().required(),
});

export type TypeUserDetail = yup.InferType<typeof userDetailDTO>;

export interface UserDetail extends Omit<TypeUserDetail, "userId"> {
  userId: ObjectId;
}

const UserDetailSchema = new mongoose.Schema<UserDetail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
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
    bmr: { type: Number, default: 0 },
    tdee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const UserDetailModel = mongoose.model<UserDetail>(USERDETAIL_MODEL_NAME, UserDetailSchema);

export default UserDetailModel;
