import { Response } from "express";
import response from "../utils/response";
import { IPaginationQuery, IReqUser } from "../utils/interface";
import { FilterQuery } from "mongoose";
import RecipeModel, { TypeRecipe } from "../models/recipe.model";

export default {
  async findAll(req: IReqUser, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;

      const query: FilterQuery<TypeRecipe> = {};
      if (search) {
        query.$text = { $search: `"${search}"*` };
      }

      const result = await RecipeModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const count = await RecipeModel.countDocuments(query);

      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "success get all recipe"
      );
    } catch (error) {
      response.error(res, error, "failed get recipe");
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const id = req.params.id;
      const result = await RecipeModel.findById(id);
      if (!result) return response.notFound(res, "recipe not found");
      response.success(res, result, "success get recipe");
    } catch (error) {
      response.error(res, error, "failed get recipe");
    }
  },
};
