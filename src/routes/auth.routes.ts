import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  changePassword,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  RegisterValidationSchema,
  LoginValidationSchema,
  ForgotPasswordValidationSchema,
  ResetPasswordValidationSchema,
  UpdateProfileValidationSchema,
  ChangePasswordValidationSchema,
} from "../validations/auth.validation";

const router = Router();

// ------ Public routes (no auth required) ------------------------------------

// POST /api/auth/register
router.post("/register", validate(RegisterValidationSchema), register);

// POST /api/auth/login
router.post("/login", validate(LoginValidationSchema), login);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validate(ForgotPasswordValidationSchema),
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  validate(ResetPasswordValidationSchema),
  resetPassword
);

// POST /api/auth/refresh-token
router.post("/refresh-token", refreshToken);

// ------ Protected routes (valid Bearer token required) ----------------------

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  validate(ChangePasswordValidationSchema),
  changePassword
);

// PATCH /api/auth/profile
router.patch(
  "/profile",
  authenticate,
  validate(UpdateProfileValidationSchema),
  updateProfile
);

export default router;
