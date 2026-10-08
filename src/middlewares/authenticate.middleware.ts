import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { UserRepository } from "../repositories/UserRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { AppError } from "../utils/AppError";

// ------ Augment Express Request type ----------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: {
        supabaseUserId: string;
        localUserId: string;
        email: string;
        name: string;
        roles: string[];
      };
    }
  }
}

// ------ authenticate --------------------------------------------------------
// Verifies the Bearer token issued by Supabase Auth, then enriches
// req.user with the local DB user + assigned roles so downstream
// controllers never have to repeat this lookup.

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.ps_access_token) {
      token = req.cookies.ps_access_token;
    }

    if (!token) {
      throw new AppError("Authentication token is missing or malformed.", 401);
    }

    // Validate token with Supabase Auth
    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData?.user) {
      throw new AppError("Invalid or expired authentication token.", 401);
    }

    const supabaseUserId = userData.user.id;

    // Fetch local user record
    const localUser = await UserRepository.findBySupabaseId(supabaseUserId);

    if (!localUser) {
      throw new AppError(
        "Local account not found. Please re-register or contact support.",
        404
      );
    }

    if (localUser.status !== "active") {
      throw new AppError(
        `Your account is currently ${localUser.status}. Access denied.`,
        403
      );
    }

    // Fetch assigned roles
    const assignedRoles = await RoleRepository.findRolesByUserId(localUser.id);

    // Attach to request for downstream use
    req.user = {
      supabaseUserId,
      localUserId: localUser.id,
      email: localUser.email,
      name: localUser.name,
      roles: assignedRoles.map((r) => r.name),
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ------ requireRoles --------------------------------------------------------
// Factory middleware that enforces one or more required roles.
// Usage: requireRoles("ADMIN") or requireRoles("CUSTOMER", "SERVICE_PROVIDER")

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Not authenticated.", 401));
    }

    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(", ")}.`,
          403
        )
      );
    }

    next();
  };
};
