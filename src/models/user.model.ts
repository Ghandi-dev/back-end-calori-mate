import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";
import { sendMail, renderMailHtml } from "../utils/mail/mail";
import { CLIENT_HOST, EMAIL_SMTP_USER } from "../utils/env";
import { ROLES } from "../utils/constant";
import * as yup from "yup";
import { GENDERS } from "../utils/enum";

export const USER_MODEL_NAME = "User";

const validatePassword = yup
  .string()
  .required()
  .min(6, "Password must be at least 6 characters")
  .test("at-least-one-uppercase-letter", "Contains at least one uppercase letter", (value) => {
    if (!value) return false;
    const regex = /^(?=.*[A-Z])/;
    return regex.test(value);
  })
  .test("at-least-one-number", "Contains at least one number", (value) => {
    if (!value) return false;
    const regex = /^(?=.*\d)/;
    return regex.test(value);
  });
const validateConfirmPassword = yup
  .string()
  .required()
  .oneOf([yup.ref("password"), ""], "Passwords must match");

export const userLoginDTO = yup.object({
  identifier: yup.string().required(),
  password: validatePassword,
});

export const userUpdatePasswordDTO = yup.object({
  oldPassword: validatePassword,
  password: validatePassword,
  confirmPassword: validateConfirmPassword,
});

export const userDTO = yup.object({
  fullname: yup.string().required(),
  username: yup.string().required(),
  email: yup.string().required(),
  gender: yup.string().required(),
  birthDate: yup.date().required(),
  password: validatePassword,
  confirmPassword: validateConfirmPassword,
});

export type TypeUser = yup.InferType<typeof userDTO>;

// interface user
export interface User extends Omit<TypeUser, "confirmPassword"> {
  isActive: boolean;
  activationCode: string;
  createdAt?: string;
  role: string;
  profilePicture: string;
  gender: string;
  birthDate: Date;
}

// schema user
const Schema = mongoose.Schema;

// model user
const UserSchema = new Schema<User>(
  {
    fullname: { type: Schema.Types.String, required: true },
    username: { type: Schema.Types.String, required: true, unique: true },
    email: { type: Schema.Types.String, required: true, unique: true },
    gender: { type: Schema.Types.String, enum: [GENDERS.MALE, GENDERS.FEMALE], required: true },
    birthDate: { type: Schema.Types.Date, required: true },
    password: { type: Schema.Types.String, required: true },
    role: { type: Schema.Types.String, enum: [ROLES.ADMIN, ROLES.MEMBER], default: ROLES.MEMBER, required: true },
    profilePicture: { type: Schema.Types.String, default: "user.jpg" },
    isActive: { type: Schema.Types.Boolean, default: false },
    activationCode: { type: Schema.Types.String },
  },
  { timestamps: true }
);

// encrypt password sebelum disimpan
UserSchema.pre("save", function (next) {
  const user = this;
  user.password = encrypt(user.password);
  user.activationCode = encrypt(user.id);
  next();
});

UserSchema.post("save", async function (doc, next) {
  try {
    const user = doc;
    console.log("sending email to", user.email);

    // Kirim email ke user
    const contentMail = await renderMailHtml("registration-success.ejs", {
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      createdAt: user.createdAt,
      activationLink: `${CLIENT_HOST}/auth/activation/?code=${user.activationCode}`,
    });

    await sendMail({
      from: EMAIL_SMTP_USER,
      to: user.email,
      subject: "Welcome to CalorieMate",
      html: contentMail,
    });
  } catch (error) {
    console.log(error);
  } finally {
    next();
  }
});

// menghapus password dari response
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<User>(USER_MODEL_NAME, UserSchema);

export default UserModel;
