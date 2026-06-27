import { supabase } from "../config/supabase";
import { UserRepository } from "../repositories/UserRepository";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { AppError } from "../utils/AppError";
import crypto from "crypto";
import { profiles } from "../db/schema";

export interface RegisterDTO {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "SERVICE_PROVIDER";
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterDTO) {
    // 1. Check if email is already registered locally
    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError("Email is already registered.", 400);
    }

    // 2. Sign up user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError || !signUpData.user) {
      throw new AppError(signUpError?.message || "Registration failed via Supabase Auth.", 400);
    }

    const supabaseUserId = signUpData.user.id;

    // 3. Create local user record
    const localRole: "USER" | "PROVIDER" = data.role === "SERVICE_PROVIDER" ? "PROVIDER" : "USER";
    const idPrefix = localRole === "PROVIDER" ? "prov_" : "usr_";
    const localUserId = `${idPrefix}${crypto.randomUUID().substring(0, 8)}`;

    const newUser = await UserRepository.create({
      id: localUserId,
      supabaseUserId,
      email: data.email,
      name: data.fullName,
      role: localRole === "PROVIDER" ? "PROVIDER" : "USER",
      status: "active",
    });

    // 4. Create local profile record
    const newProfile = await ProfileRepository.create({
      id: `prof_${crypto.randomUUID().substring(0, 8)}`,
      userId: localUserId,
      fullName: data.fullName,
      phone: data.phone,
    });

    // 5. Assign default application roles in Postgres
    let roleRecord = await RoleRepository.findByName(data.role);
    if (!roleRecord) {
      // Autocreate the role if not seeded yet
      roleRecord = await RoleRepository.createRole(
        `role_${data.role.toLowerCase()}`,
        data.role,
        `${data.role} default system role`
      );
    }

    await RoleRepository.assignRoleToUser(localUserId, roleRecord.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: roleRecord.name,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
      profile: {
        fullName: newProfile.fullName,
        phone: newProfile.phone,
      },
      emailConfirmationSent: !signUpData.session,
    };
  }

  static async login(data: LoginDTO) {
    // 1. Sign in via Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError || !signInData.user || !signInData.session) {
      throw new AppError(signInError?.message || "Invalid email or password", 401);
    }

    const supabaseUserId = signInData.user.id;

    // 2. Fetch local user mapping
    const localUser = await UserRepository.findBySupabaseId(supabaseUserId);
    if (!localUser) {
      throw new AppError("Local account mapping not found. Please contact support.", 404);
    }

    if (localUser.status !== "active") {
      throw new AppError(`Your account is currently ${localUser.status}. Access denied.`, 403);
    }

    // 3. Fetch profile and role associations
    const profile = await ProfileRepository.findByUserId(localUser.id);
    const assignedRoles = await RoleRepository.findRolesByUserId(localUser.id);

    return {
      session: {
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        expiresIn: signInData.session.expires_in,
        expiresAt: signInData.session.expires_at,
      },
      user: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        status: localUser.status,
        createdAt: localUser.createdAt,
      },
      profile: profile ? {
        fullName: profile.fullName,
        phone: profile.phone,
        avatar: profile.avatar,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
      } : null,
      roles: assignedRoles.map(r => r.name),
    };
  }

  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppError(error.message, 400);
    }
    return true;
  }

  static async getCurrentUser(supabaseUserId: string) {
    const localUser = await UserRepository.findBySupabaseId(supabaseUserId);
    if (!localUser) {
      throw new AppError("User account mapping not found.", 404);
    }

    const profile = await ProfileRepository.findByUserId(localUser.id);
    const assignedRoles = await RoleRepository.findRolesByUserId(localUser.id);

    return {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      status: localUser.status,
      createdAt: localUser.createdAt,
      profile: profile ? {
        fullName: profile.fullName,
        phone: profile.phone,
        avatar: profile.avatar,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
      } : null,
      roles: assignedRoles.map(r => r.name),
    };
  }

  static async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password", // Next.js fallback reset page
    });

    if (error) {
      throw new AppError(error.message, 400);
    }
    return true;
  }

  static async resetPassword(password: string, token: string) {
    // 1. Establish session using the recovery token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    });

    if (sessionError) {
      throw new AppError("Invalid or expired password reset token.", 400);
    }

    // 2. Update current session user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      throw new AppError(updateError.message, 400);
    }
    return true;
  }

  static async refreshSession(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new AppError(error?.message || "Session refresh failed.", 401);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      expiresAt: data.session.expires_at,
    };
  }

  static async changePassword(supabaseUserId: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AppError(error.message, 400);
    }
    return true;
  }

  static async updateProfile(supabaseUserId: string, profileData: Partial<typeof profiles.$inferInsert>) {
    const localUser = await UserRepository.findBySupabaseId(supabaseUserId);
    if (!localUser) {
      throw new AppError("User account mapping not found.", 404);
    }

    const updatedProfile = await ProfileRepository.updateByUserId(localUser.id, profileData);
    
    // Sync users.name column if fullName changes to keep compatibility
    if (profileData.fullName) {
      await UserRepository.update(localUser.id, { name: profileData.fullName });
    }

    return updatedProfile;
  }
}
