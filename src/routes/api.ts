import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import aclMiddleware from "../middlewares/acl.middleware";
import { ROLES } from "../utils/constant";
import mediaMiddleware from "../middlewares/media.middleware";
// import mediaController from "../controllers/media.controller";

const router = express.Router();
// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);
router.post("/auth/activation", authController.activation);
router.put("/auth/update-profile", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updateProfile);
router.put("/auth/update-password", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updatePassword);
// Media
// router.post("/media/upload-single", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.single("file")], mediaController.single);
// router.post(
//   "/media/upload-multiple",
//   [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.multiple("files")],
//   mediaController.multiple
// );
// router.delete("/media/remove", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER])], mediaController.remove);

export default router;
