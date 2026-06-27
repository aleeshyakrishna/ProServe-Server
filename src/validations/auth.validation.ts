import { z } from "zod";

const UAE_PHONE_REGEX = /^(?:\+971|0)?5[024568]\d{7}$/;

export const RegisterValidationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(UAE_PHONE_REGEX, "Please enter a valid UAE mobile number (e.g. +971 50 123 4567 or 050 123 4567)"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters")
    .refine((val) => /[A-Z]/.test(val), { message: "Must contain at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Must contain at least one lowercase letter" })
    .refine((val) => /\d/.test(val), { message: "Must contain at least one number" })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: "Must contain at least one special character" }),
  role: z.enum(["CUSTOMER", "SERVICE_PROVIDER"]),
});

export const LoginValidationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const ForgotPasswordValidationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const ResetPasswordValidationSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters")
    .refine((val) => /[A-Z]/.test(val), { message: "Must contain at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Must contain at least one lowercase letter" })
    .refine((val) => /\d/.test(val), { message: "Must contain at least one number" })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: "Must contain at least one special character" }),
  token: z.string().min(1, "Reset token is required"),
});

export const UpdateProfileValidationSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(UAE_PHONE_REGEX, "Please enter a valid UAE phone number").optional(),
  avatar: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  city: z.string().min(2).max(50).optional(),
  country: z.string().min(2).max(50).optional(),
});

export const ChangePasswordValidationSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(50, "New password must not exceed 50 characters")
    .refine((val) => /[A-Z]/.test(val), { message: "Must contain at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Must contain at least one lowercase letter" })
    .refine((val) => /\d/.test(val), { message: "Must contain at least one number" })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: "Must contain at least one special character" }),
});
