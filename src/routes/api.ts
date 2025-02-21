import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import aclMiddleware from "../middlewares/acl.middleware";
import { ROLES } from "../utils/constant";
// import mediaMiddleware from "../middlewares/media.middleware";
import dailyLogController from "../controllers/dailyLog.controller";

const router = express.Router();
// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);
router.post("/auth/activation", authController.activation);
router.put("/auth/update-profile", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updateProfile);
router.put("/auth/update-password", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updatePassword);

// Daily Log
router.post("/daily-log", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.create);
router.get("/daily-log", [authMiddleware, aclMiddleware([ROLES.ADMIN])], dailyLogController.findAll);
router.get("/daily-log/:id", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.findOne);
router.get("/daily-log-member", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.findAllByMember);
router.get("/daily-log-report", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.getReport);
router.put("/daily-log/:id", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.update);
router.delete("/daily-log/:id", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.delete);
router.delete("/daily-log/:id/food/:foodId", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.deleteFoodById);
router.delete("/daily-log/:id/activity/:activityId", [authMiddleware, aclMiddleware([ROLES.MEMBER])], dailyLogController.deleteActivityById);

// Media
// router.post("/media/upload-single", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.single("file")], mediaController.single);
// router.post(
//   "/media/upload-multiple",
//   [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.multiple("files")],
//   mediaController.multiple
// );
// router.delete("/media/remove", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER])], mediaController.remove);

export default router;
