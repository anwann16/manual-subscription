"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/features/auth/form-state.type";

const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeRedirectPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function login(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeRedirectPath(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah" };
    }
    throw error;
  }

  return {};
}

export async function register(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readField(formData, "email").toLowerCase();
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Format email tidak valid";
  }
  if (password.length < 8) {
    fieldErrors.password = "Password minimal 8 karakter";
  }
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password tidak sama";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, SALT_ROUNDS) },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: "Email sudah terdaftar" } };
    }
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });

  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
