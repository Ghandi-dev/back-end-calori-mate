import jwt from "jsonwebtoken";
import { SECRET } from "./env";
import { IUserToken } from "./interface";

// generate token jwt
export const generateToken = (user: IUserToken): string => {
  const token = jwt.sign(user, SECRET, { expiresIn: "1d" });
  return token;
};

export const getUserData = (token: string): IUserToken | null => {
  try {
    const user = jwt.verify(token, SECRET) as IUserToken;
    return user;
  } catch (error) {
    const err = error as unknown as Error;
    throw new Error(err.message);
  }
};
