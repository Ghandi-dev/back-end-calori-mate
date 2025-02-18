import crypto from "crypto";
import { SECRET } from "./env";

export const encrypt = (password: string):string =>{
    const encrypted = crypto
    .pbkdf2Sync(password,SECRET,1000,54,"sha512")
    .toString("hex");
    return encrypted
}