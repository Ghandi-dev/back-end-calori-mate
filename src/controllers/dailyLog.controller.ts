import { Response } from "express";
import { IHealthReport, IPaginationQuery, IReqUser } from "../utils/interface";
import { FilterQuery, isValidObjectId } from "mongoose";
import response from "../utils/response";
import DailyLogModel, { dailyLogDTO, TypeDailyLog } from "../models/dailyLog.model";
import { bmrCalculate } from "../utils/bmr";
import { tdeeCalculate } from "../utils/tdee";
import { calorieCalculate, healthReport } from "../service/gemini";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const userId = req.user?.id;
      const { food = [], activity = [], weight, height, activityLevel, date = new Date().toISOString().split("T")[0] } = { ...req.body } as TypeDailyLog;

      const existingLog = await DailyLogModel.findOne({ userId, date });
      if (existingLog) return response.error(res, null, "Daily log already exists");

      const birthYear = new Date(req.user?.birthDate!!).getFullYear();
      const age = new Date().getFullYear() - birthYear!!;
      const bmr = bmrCalculate(weight, height, age, req.user?.gender!!);
      const tdee = tdeeCalculate(bmr, activityLevel);

      // menghitung kalori
      const calorieData = await calorieCalculate(
        food.map((item) => item.name), // Kirim hanya nama makanan
        activity.map((item) => item.name), // Kirim hanya nama aktivitas
        weight,
        height
      );

      //   Create Daily Log
      const payload = { ...req.body, userId: req.user?.id, bmr, tdee, food: calorieData.food, activity: calorieData.activity };
      await dailyLogDTO.validate(payload);
      const result = await DailyLogModel.create(payload);
      response.success(res, result, "success create daily log");
    } catch (error) {
      console.error("Error creating daily log:", error);
      response.error(res, error, "failed create daily log");
    }
  },
  async findAll(req: IReqUser, res: Response) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = req.query as unknown as IPaginationQuery;

      // Membuat filter query berdasarkan tanggal jika diberikan
      const filter: any = {};
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate), // >= startDate
          $lte: new Date(endDate), // <= endDate
        };
      } else if (startDate) {
        filter.createdAt = { $gte: new Date(startDate) };
      } else if (endDate) {
        filter.createdAt = { $lte: new Date(endDate) };
      }

      // Query dengan filter tanggal
      const result = await DailyLogModel.find(filter)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      if (!result || result.length === 0) {
        return response.notFound(res, "daily log not found");
      }

      const count = await DailyLogModel.countDocuments(filter);
      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "success get all daily log"
      );
    } catch (error) {
      response.error(res, error, "failed get all daily log");
    }
  },
  async findAllByMember(req: IReqUser, res: Response) {
    try {
      const { page = 1, limit = 10, date, startDate, endDate } = req.query as unknown as IPaginationQuery;

      // Filter berdasarkan user ID
      const query: FilterQuery<TypeDailyLog> = { userId: req.user?.id };

      // Filter berdasarkan tanggal tertentu
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query.date = { $gte: startOfDay, $lte: endOfDay };
      }

      // Filter berdasarkan rentang tanggal
      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      // Query data sesuai filter
      const result = await DailyLogModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }) // Urutkan dari terbaru
        .exec();

      if (!result || result.length === 0) {
        return response.notFound(res, "daily log not found");
      }

      // Menghitung total data berdasarkan query yang digunakan
      const count = await DailyLogModel.countDocuments(query);

      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "success get all daily log by member"
      );
    } catch (error) {
      response.error(res, error, "failed get all daily log by member");
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      if (!isValidObjectId(dailyLogId)) {
        return response.notFound(res, "daily log not found");
      }
      const result = await DailyLogModel.findById(dailyLogId);
      if (!result) {
        return response.notFound(res, "daily log not found");
      }
      response.success(res, result, "success get daily log");
    } catch (error) {
      response.error(res, error, "failed get daily log");
    }
  },
  async getReport(req: IReqUser, res: Response) {
    try {
      const date = new Date().toISOString().split("T")[0];
      const dailyLog = await DailyLogModel.findOne({ userId: req.user?.id, date });
      if (!dailyLog) return response.notFound(res, "daily log not found ");

      if (dailyLog.report) return response.success(res, dailyLog.report, "success get report");
      const payload: IHealthReport = {
        bmr: dailyLog.bmr!!,
        tdee: dailyLog.tdee!!,
        totalCaloriesIn: dailyLog.totalCaloriesIn!!,
        totalCaloriesOut: dailyLog.totalCaloriesOut!!,
        weight: dailyLog.weight,
        height: dailyLog.height,
        goal: dailyLog.goal,
      };
      const report = await healthReport(payload);
      await DailyLogModel.findByIdAndUpdate(dailyLog._id, { report: report });
      response.success(res, report, "success get report");
    } catch (error) {
      response.error(res, error, "failed get report");
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      if (!isValidObjectId(dailyLogId)) {
        return response.notFound(res, "daily log not found");
      }

      // Cek apakah Daily Log untuk hari ini sudah ada
      let dailyLog = await DailyLogModel.findOne({ _id: dailyLogId, date: new Date().toISOString().split("T")[0] });
      if (!dailyLog) {
        return response.error(res, null, "Daily log not found");
      }

      const birthYear = new Date(req.user?.birthDate!!).getFullYear();
      const age = new Date().getFullYear() - birthYear!!;
      const weight = req.body.weight ?? dailyLog.weight;
      const height = req.body.height ?? dailyLog.height;
      const activityLevel = req.body.activityLevel ?? dailyLog.activityLevel;
      const bmr = bmrCalculate(weight, height, age, req.user?.gender!!);
      const tdee = tdeeCalculate(bmr, activityLevel);

      // **Ambil Data Lama** untuk mencegah perubahan total sebelumnya
      const oldFood = dailyLog.food || [];
      const oldActivity = dailyLog.activity || [];

      // **Cek Data Baru** (makanan & aktivitas yang baru ditambahkan)
      const { food, activity } = req.body as TypeDailyLog;
      const newFood = food?.filter((item) => !oldFood.some((old) => old.name === item.name)) || [];
      const newActivity = activity?.filter((item) => !oldActivity.some((old) => old.name === item.name)) || [];

      // **Hitung Hanya Data Baru**
      const newCalories = await calorieCalculate(
        newFood.map((f) => f.name),
        newActivity.map((a) => a.name),
        weight,
        height
      );

      // **Gabungkan Data Lama + Baru**
      const updatedFood = [...oldFood, ...newCalories.food];
      const updatedActivity = [...oldActivity, ...newCalories.activity];

      const payload = { ...req.body, userId: req.user?.id, bmr, tdee, food: updatedFood, activity: updatedActivity, report: null };

      const result = await DailyLogModel.findOneAndUpdate({ _id: dailyLogId }, payload, { new: true });
      if (!result) {
        return response.notFound(res, "daily log not found");
      }
      response.success(res, result, "success update daily log");
    } catch (error) {
      console.error("Error creating daily log:", error);
      response.error(res, error, "failed update daily log");
    }
  },
  async delete(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      if (!isValidObjectId(dailyLogId)) {
        return response.notFound(res, "daily log not found");
      }
      const result = await DailyLogModel.findOneAndDelete({ _id: dailyLogId });
      if (!result) {
        return response.notFound(res, "daily log not found");
      }
      response.success(res, result, "success delete daily log");
    } catch (error) {
      response.error(res, error, "failed delete daily log");
    }
  },
  async deleteFoodById(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      const foodId = req.params.foodId;
      if (!isValidObjectId(dailyLogId) || !isValidObjectId(foodId)) {
        return response.notFound(res, "daily log not found");
      }
      const result = await DailyLogModel.findOneAndUpdate(
        { _id: dailyLogId, "food._id": foodId },
        { $pull: { food: { _id: foodId } }, $unset: { report: "" } },
        { new: true }
      );
      if (!result) {
        return response.notFound(res, "daily log not found");
      }
      const updatedTotalCalories = result.food!!.reduce((sum, item) => sum + item.calories, 0);
      result.totalCaloriesIn = updatedTotalCalories;
      await result.save();
      response.success(res, result, "success delete food by id");
    } catch (error) {
      response.error(res, error, "failed delete food by id");
    }
  },
  async deleteActivityById(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      const activityId = req.params.activityId;

      if (!isValidObjectId(dailyLogId) || !isValidObjectId(activityId)) {
        return response.notFound(res, "daily log not found");
      }

      // Hapus aktivitas terlebih dahulu
      const result = await DailyLogModel.findOneAndUpdate(
        { _id: dailyLogId, "activity._id": activityId },
        { $pull: { activity: { _id: activityId } }, $unset: { report: "" } },
        { new: true }
      );

      if (!result) {
        return response.notFound(res, "daily log not found");
      }

      // Hitung ulang total kalori keluar setelah aktivitas dihapus
      const updatedTotalCaloriesOut = result.activity!!.reduce((sum, item) => sum + item.calories, 0);

      // Perbarui total kalori keluar ke database
      result.totalCaloriesOut = updatedTotalCaloriesOut;
      await result.save();

      response.success(res, result, "success delete activity by id");
    } catch (error) {
      response.error(res, error, "failed delete activity by id");
    }
  },
};
