import { NextFunction,Request, Response } from "express";
import { getUserData } from "../utils/jwt";
import { IReqUser, IUserToken } from "../utils/interface";
import response from "../utils/response";


export default (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers?.authorization;
  
    if (!authorization || typeof authorization !== "string") {
      return response.unauthorized(res);
    }
  
    const [prefix, accessToken] = authorization.split(" ");
  
    // Ensure the token is in the expected "Bearer <token>" format
    if (!(prefix === "Bearer" && accessToken)) {
      return response.unauthorized(res);
    }

    try {
      const user = getUserData(accessToken) as IUserToken;
      if (!user) {
        return response.unauthorized(res);
      }
  
      (req as IReqUser).user = user;
      next();
    } catch (error) {
      const err = error as Error;
      return response.unauthorized(res, err.message);
    }
  
  };