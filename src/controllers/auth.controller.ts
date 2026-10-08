import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";

// ------ POST /api/auth/register ---------------------------------------------

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.register(req.body);

    const statusMessage = result.emailConfirmationSent
      ? "Registration successful. Please check your email to confirm your account before logging in."
      : "Registration successful.";

    res.status(201).json(successResponse(result, statusMessage));
  }
);

// ------ POST /api/auth/login ------------------------------------------------

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.login(req.body);

    if (result?.session?.accessToken) {
      res.cookie("ps_access_token", result.session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json(successResponse(result, "Login successful."));
  }
);

// ------ POST /api/auth/logout -----------------------------------------------

export const logout = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    await AuthService.logout();
    res.clearCookie("ps_access_token");

    res.status(200).json(successResponse(null, "Logged out successfully."));
  }
);

// ------ GET /api/auth/me ----------------------------------------------------
// Protected: requires valid JWT via authenticate middleware

export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const supabaseUserId = req.user!.supabaseUserId;
    const result = await AuthService.getCurrentUser(supabaseUserId);

    res.status(200).json(successResponse(result, "Current user fetched."));
  }
);

// ------ POST /api/auth/forgot-password --------------------------------------

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);

    // Always return 200 to avoid user enumeration attacks
    res.status(200).json(
      successResponse(
        null,
        "If that email is registered, a password reset link has been sent."
      )
    );
  }
);

// ------ POST /api/auth/reset-password ---------------------------------------

export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { password, token } = req.body;
    await AuthService.resetPassword(password, token);

    res.status(200).json(successResponse(null, "Password has been reset successfully."));
  }
);

// ------ POST /api/auth/refresh-token ----------------------------------------

export const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshSession(refreshToken);

    res.status(200).json(successResponse(result, "Session refreshed."));
  }
);

// ------ POST /api/auth/change-password --------------------------------------
// Protected: requires valid JWT via authenticate middleware

export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const supabaseUserId = req.user!.supabaseUserId;
    const { newPassword } = req.body;
    await AuthService.changePassword(supabaseUserId, newPassword);

    res.status(200).json(successResponse(null, "Password changed successfully."));
  }
);

// ------ PATCH /api/auth/profile ---------------------------------------------
// Protected: requires valid JWT via authenticate middleware

export const updateProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const supabaseUserId = req.user!.supabaseUserId;
    const result = await AuthService.updateProfile(supabaseUserId, req.body);

    res.status(200).json(successResponse(result, "Profile updated successfully."));
  }
);
