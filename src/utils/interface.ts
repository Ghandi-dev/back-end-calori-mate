import { Request } from "express";
import { Types } from "mongoose";
import { User } from "../models/user.model";

export interface IReqUser extends Request {
  user?: IUserToken;
}

export interface IUserToken extends Omit<User, "password" | "activationCode" | "isActive" | "email" | "fullname" | "profilePicture" | "username"> {
  id?: Types.ObjectId;
}

export interface IPaginationQuery {
  page: number;
  limit: number;
  search?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface IHealthReport {
  bmr: number;
  tdee: number;
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  weight: number;
  height: number;
  goal: string;
}
