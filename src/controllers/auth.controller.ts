import { Request, Response } from "express";
import UserModel, { userDTO, userLoginDTO, userUpdatePasswordDTO } from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { IReqUser } from "../utils/interface";
import response from "../utils/response";

export default {
  async updateProfile(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.security = [{ 
     "bearerAuth": [] 
     }]
     #swagger.requestBody = {
        required: true,
        schema: {
          $ref:"#/components/schemas/UpdateProfileRequest"
        }
     }
     */
    try {
      const userId = req.user?.id;
      const { fullname, profilePicture } = req.body;
      const result = await UserModel.findByIdAndUpdate(userId, { fullname, profilePicture }, { new: true });
      if (!result) {
        return response.notFound(res, "user not found");
      }
      response.success(res, result, "success update profile user");
    } catch (error) {
      response.error(res, error, "failed update profile user");
    }
  },
  async updatePassword(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.security = [{ 
     "bearerAuth": [] 
     }]
     #swagger.requestBody = {
        required: true,
        schema: {
          $ref:"#/components/schemas/UpdatePasswordRequest"
        }
     }
     */
    try {
      const userId = req.user?.id;
      const { oldPassword, password, confirmPassword } = req.body;
      await userUpdatePasswordDTO.validate({ oldPassword, password, confirmPassword });
      const user = await UserModel.findById(userId);
      if (!user || user.password !== encrypt(oldPassword)) {
        return response.notFound(res, "user not found");
      }
      const result = await UserModel.findByIdAndUpdate(userId, { password: encrypt(password) }, { new: true });
      response.success(res, result, "success update password user");
    } catch (error) {
      response.error(res, error, "failed update profile user");
    }
  },

  async register(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
        required: true,
        schema: {
          $ref:"#/components/schemas/RegisterRequest"
        }
     }
     */
    const { fullname, username, email, gender, birthDate, password, confirmPassword } = req.body;
    try {
      await userDTO.validate({
        fullname,
        username,
        email,
        gender,
        birthDate,
        password,
        confirmPassword,
      });
      const result = await UserModel.create({
        fullname,
        username,
        email,
        gender,
        birthDate,
        password,
      });
      response.success(res, result, "success register user");
    } catch (error) {
      response.error(res, error, "failed register user");
    }
  },

  async login(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
        required: true,
        schema: {
          $ref:"#/components/schemas/LoginRequest"
        }
     }
     */
    try {
      const { identifier, password } = req.body;
      await userLoginDTO.validate({ identifier, password });
      // ambil data user berdasarkan "identifier" -> email / username
      const userByIdentifier = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
        isActive: true,
      });

      if (!userByIdentifier) {
        return response.unauthorized(res, "user not found");
      }

      // validasi password
      const validatePassword: boolean = encrypt(password) === userByIdentifier?.password;

      if (!validatePassword) {
        return response.unauthorized(res, "password not match");
      }

      const token = generateToken({
        id: userByIdentifier._id,
        role: userByIdentifier.role,
        birthDate: userByIdentifier.birthDate,
        gender: userByIdentifier.gender,
      });

      response.success(res, token, "success login");
    } catch (error) {
      console.error("Error during login:", error);
      response.error(res, error, "failed login");
    }
  },

  async me(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.security = [{ 
     "bearerAuth": [] 
     }]
     */
    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);
      response.success(res, result, "success get user data");
    } catch (error) {
      response.error(res, error, "failed get user data");
    }
  },

  async activation(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
        required: true,
        schema: {
          $ref:"#/components/schemas/ActivationRequest"
        }
     }
     */
    try {
      const { code } = req.body as { code: string };
      const user = await UserModel.findOneAndUpdate(
        {
          activationCode: code,
        },
        {
          isActive: true,
        },
        {
          new: true,
        }
      );

      response.success(res, user, "success activation user");
    } catch (error) {
      response.error(res, error, "failed activation user");
    }
  },
};
