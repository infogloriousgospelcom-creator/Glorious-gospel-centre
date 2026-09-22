import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(200),
  redirect_to: z.string().optional().or(z.literal("")),
});

export const RegisterSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(120, "Name is too long."),
    email: z.string().trim().email("Enter a valid email.").max(254),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(200, "Password is too long."),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
});

export const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(200),
    confirm_password: z.string(),
    audience: z.enum(["admin", "member"]).optional().or(z.literal("")),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export const ProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Name is too long."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long.")
    .refine((v) => v === "" || /^[\d\s+\-().]*$/.test(v), {
      message: "Enter a valid phone number.",
    }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
