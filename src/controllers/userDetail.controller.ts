import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interface";
import response from "../utils/response";
import UserDetailModel, { userDetailDTO } from "../models/userDetail.model";
import { bmrCalculate } from "../utils/bmr";
import { tdeeCalculate } from "../utils/tdee";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      if (!req.user?.birthDate || !req.user?.gender) {
        return res.status(400).json({ error: "Birth date and gender are required" });
      }
      // Menghitung umur secara lebih aman
      const birthDate = new Date(req.user.birthDate);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ error: "Invalid birth date format" });
      }
      //   BMR & TDEE Calculation
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const gender = req.user.gender;
      const bmr = bmrCalculate(req.body.weight, req.body.height, age, gender);
      const tdee = tdeeCalculate(bmr, req.body.activityLevel);
      //   Validate Payload
      const payload = { ...req.body, userId, bmr, tdee };
      await userDetailDTO.validate(payload);
      //   Create User Detail
      const result = await UserDetailModel.create(payload);
      response.success(res, result, "success create user detail");
    } catch (error) {
      response.error(res, error, "failed create user detail");
    }
  },
  async findAll(req: IReqUser, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query as unknown as IPaginationQuery;
      const result = await UserDetailModel.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();
      if (!result) {
        return response.notFound(res, "user detail not found");
      }

      const count = await UserDetailModel.countDocuments();
      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "success get all user detail"
      );
    } catch (error) {
      response.error(res, error, "failed get all user detail");
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const userId = req.params.id;
      const result = await UserDetailModel.findOne({ userId });
      if (!result) {
        return response.notFound(res, "user detail not found");
      }
      response.success(res, result, "success get user detail");
    } catch (error) {
      response.error(res, error, "failed get user detail");
    }
  },
  async me(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await UserDetailModel.findOne({ userId });
      if (!result) {
        return response.notFound(res, "user detail not found");
      }
      response.success(res, result, "success get user detail");
    } catch (error) {
      response.error(res, error, "failed get user detail");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      if (!req.user?.birthDate || !req.user?.gender) {
        return res.status(400).json({ error: "Birth date and gender are required" });
      }
      // Menghitung umur secara lebih aman
      const birthDate = new Date(req.user.birthDate);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ error: "Invalid birth date format" });
      }
      //   BMR & TDEE Calculation
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const gender = req.user.gender;
      const bmr = bmrCalculate(req.body.weight, req.body.height, age, gender);
      const tdee = tdeeCalculate(bmr, req.body.activityLevel);
      //   Validate Payload
      const payload = { ...req.body, userId, bmr, tdee };
      await userDetailDTO.validate(payload);
      const result = await UserDetailModel.findOneAndUpdate({ userId }, payload, { new: true });
      response.success(res, result, "success update user detail");
    } catch (error) {
      response.error(res, error, "failed update user detail");
    }
  },
  async delete(req: IReqUser, res: Response) {
    try {
      const userId = req.params.id;
      const result = await UserDetailModel.findOneAndDelete({ userId });
      if (!result) {
        return response.notFound(res, "user detail not found");
      }
      response.success(res, result, "success delete user detail");
    } catch (error) {
      response.error(res, error, "failed delete user detail");
    }
  },
};
