import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import aclMiddleware from "../middlewares/acl.middleware";
import { ROLES } from "../utils/constant";
import mediaMiddleware from "../middlewares/media.middleware";
import userDetailController from "../controllers/userDetail.controller";
// import mediaController from "../controllers/media.controller";

const router = express.Router();
// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);
router.post("/auth/activation", authController.activation);
router.put("/auth/update-profile", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updateProfile);
router.put("/auth/update-password", [authMiddleware, aclMiddleware([ROLES.MEMBER])], authController.updatePassword);

// User Detail
router.post("/user-detail", [authMiddleware, aclMiddleware([ROLES.MEMBER])], userDetailController.create);
router.get("/user-detail/me", [authMiddleware, aclMiddleware([ROLES.MEMBER])], userDetailController.me);
router.get("/user-detail/:id", [authMiddleware, aclMiddleware([ROLES.ADMIN])], userDetailController.findOne);
router.get("/user-detail", [authMiddleware, aclMiddleware([ROLES.ADMIN])], userDetailController.findAll);
router.put("/user-detail", [authMiddleware, aclMiddleware([ROLES.MEMBER])], userDetailController.update);
router.delete("/user-detail/:id", [authMiddleware, aclMiddleware([ROLES.ADMIN])], userDetailController.delete);

// Media
// router.post("/media/upload-single", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.single("file")], mediaController.single);
// router.post(
//   "/media/upload-multiple",
//   [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER]), mediaMiddleware.multiple("files")],
//   mediaController.multiple
// );
// router.delete("/media/remove", [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER])], mediaController.remove);

export default router;
