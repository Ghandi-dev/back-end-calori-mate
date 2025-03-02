import { Response } from "express";
import { IHealthReport, IPaginationQuery, IReqUser } from "../utils/interface";
import { FilterQuery, isValidObjectId } from "mongoose";
import response from "../utils/response";
import DailyLogModel, { dailyLogDTO, TypeDailyLog } from "../models/dailyLog.model";
import { bmrCalculate } from "../utils/bmr";
import { tdeeCalculate } from "../utils/tdee";
import { calorieCalculate, generateRecipeSuggestion, healthReport } from "../service/gemini/gemini";

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
      const payload = { ...req.body, date, userId: req.user?.id, bmr, tdee, food: calorieData.food, activity: calorieData.activity };
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
        .sort({ createdAt: 1 }) // Urutkan dari terbaru
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
      if (dailyLog.totalCaloriesIn === 0 && dailyLog.totalCaloriesOut === 0) return response.notFound(res, "Your food and activity data is empty");

      const payload: IHealthReport = {
        bmr: dailyLog.bmr!!,
        tdee: dailyLog.tdee!!,
        totalCaloriesIn: dailyLog.totalCaloriesIn!!,
        totalCaloriesOut: dailyLog.totalCaloriesOut!!,
        weight: dailyLog.weight,
        height: dailyLog.height,
        goal: dailyLog.goal,
      };

      const report = await healthReport(payload, req.query.language as string);
      await DailyLogModel.findByIdAndUpdate(dailyLog._id, { report: report });
      response.success(res, report, "success get report");
    } catch (error) {
      response.error(res, error, "failed get report");
    }
  },
  async getRecipe(req: IReqUser, res: Response) {
    try {
      const date = new Date().toISOString().split("T")[0];
      const dailyLog = (await DailyLogModel.findOne({ userId: req.user?.id, date })) as TypeDailyLog;
      if (!dailyLog) return response.notFound(res, "daily log not found ");
      const recipe = await generateRecipeSuggestion(dailyLog.tdee as number, dailyLog.goal, req.query.language as string);
      response.success(res, recipe, "success get report");
    } catch (error) {
      response.error(res, error, "failed get report");
    }
  },
  async updatePersonalData(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      if (!isValidObjectId(dailyLogId)) {
        return response.notFound(res, "Daily log not found");
      }

      // Cek apakah Daily Log untuk hari ini ada
      const today = new Date().toISOString().split("T")[0];
      const dailyLog = await DailyLogModel.findOne({ _id: dailyLogId, date: today });
      if (!dailyLog) {
        return response.error(res, null, "Daily log not found");
      }

      // Hitung ulang BMR & TDEE berdasarkan data baru (jika ada)
      const birthYear = new Date(req.user?.birthDate!!).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      const weight = req.body.weight ?? dailyLog.weight;
      const height = req.body.height ?? dailyLog.height;
      const activityLevel = req.body.activityLevel ?? dailyLog.activityLevel;
      const bmr = bmrCalculate(weight, height, age, req.user?.gender!!);
      const tdee = tdeeCalculate(bmr, activityLevel);

      // Perbarui hanya data pribadi
      const result = await DailyLogModel.findByIdAndUpdate(dailyLogId, { weight, height, activityLevel, bmr, tdee }, { new: true });

      if (!result) {
        return response.notFound(res, "Daily log not found");
      }

      response.success(res, result, "Personal data updated successfully");
    } catch (error) {
      console.error("Error updating personal data:", error);
      response.error(res, error, "Failed to update personal data");
    }
  },
  async updateFoodActivity(req: IReqUser, res: Response) {
    try {
      const dailyLogId = req.params.id;
      if (!isValidObjectId(dailyLogId)) {
        return response.notFound(res, "Daily log not found");
      }

      // Cek apakah Daily Log untuk hari ini ada
      const today = new Date().toISOString().split("T")[0];
      const dailyLog = await DailyLogModel.findOne({ _id: dailyLogId, date: today });
      if (!dailyLog) {
        return response.error(res, null, "Daily log not found");
      }

      // Ambil data lama
      const oldFood = dailyLog.food || [];
      const oldActivity = dailyLog.activity || [];

      // Ambil data baru dari request
      const { food = [], activity = [] } = req.body as TypeDailyLog;

      // Fungsi untuk memperbarui data baru dengan nilai kalori dari data lama
      const updateWithOldCalories = (newItems: any[], oldItems: any[]) => {
        return newItems.map((newItem) => {
          const oldItem = oldItems.find((item) => item.name === newItem.name);
          if (oldItem) {
            // Jika ada item lama dengan nama yang sama, gunakan kalori dari data lama
            return { ...newItem, calories: oldItem.calories };
          }
          // Jika tidak ada item lama, kembalikan item baru tanpa kalori
          return newItem;
        });
      };

      // Perbarui data baru dengan kalori dari data lama
      const updatedFood = updateWithOldCalories(food, oldFood);
      const updatedActivity = updateWithOldCalories(activity, oldActivity);

      // Hitung kalori hanya untuk data baru yang belum memiliki kalori
      const newFoodWithoutCalories = updatedFood.filter((item) => !item.calories);
      const newActivityWithoutCalories = updatedActivity.filter((item) => !item.calories);

      let newCalories = { food: [], activity: [] };
      if (newFoodWithoutCalories.length || newActivityWithoutCalories.length) {
        newCalories = await calorieCalculate(
          newFoodWithoutCalories.map((f) => f.name),
          newActivityWithoutCalories.map((a) => a.name),
          dailyLog.weight, // Gunakan data berat dari dailyLog yang sudah ada
          dailyLog.height
        );
      }

      /// Gabungkan data lama dengan data baru yang telah diperbarui
      const finalFood = [
        ...oldFood, // Data lama
        ...newCalories.food, // Data baru yang telah dihitung kalorinya
        ...updatedFood.filter((item) => item.calories > 0), // Data baru yang sudah memiliki kalori
      ];

      const finalActivity = [
        ...oldActivity, // Data lama
        ...newCalories.activity, // Data baru yang telah dihitung kalorinya
        ...updatedActivity.filter((item) => item.calories > 0), // Data baru yang sudah memiliki kalori
      ];

      // Update hanya bagian food & activity
      const result = await DailyLogModel.findByIdAndUpdate(
        dailyLogId,
        {
          food: finalFood,
          activity: finalActivity,
          $unset: { report: "" }, // Menghapus field 'report' dari dokumen
        },
        { new: true }
      );

      if (!result) {
        return response.notFound(res, "Daily log not found");
      }

      response.success(res, result, "Food & Activity updated successfully");
    } catch (error) {
      console.error("Error updating food & activity:", error);
      response.error(res, error, "Failed to update food & activity");
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
