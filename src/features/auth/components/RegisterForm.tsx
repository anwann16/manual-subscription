"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register } from "@/features/auth/actions/auth.actions";
import type { FormState } from "@/features/auth/form-state.type";
import { FieldGroup } from "@/components/ui/field";
import { AuthCard } from "./AuthCard";
import { AuthField, AuthInput } from "./AuthField";
import { AuthNotice } from "./AuthNotice";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { PasswordInput } from "./PasswordInput";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(register, initialState);

  return (
    <AuthCard
      eyebrow="Daftar"
      title="Buat akun baru"
      description="Satu akun untuk memilih paket, mengirim bukti transfer, dan memantau status langganan."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-[#1C1917] underline decoration-[#C9C3B9] underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:decoration-[#1C1917]"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-7">
        <FieldGroup className="gap-6">
          <AuthNotice message={state.error} />

          <AuthField
            id="register-email"
            label="Email"
            error={state.fieldErrors?.email}
          >
            <AuthInput
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@perusahaan.com"
              aria-invalid={Boolean(state.fieldErrors?.email)}
              required
            />
          </AuthField>

          <AuthField
            id="register-password"
            label="Password"
            hint="Minimal 8 karakter."
            error={state.fieldErrors?.password}
          >
            <PasswordInput
              id="register-password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              aria-invalid={Boolean(state.fieldErrors?.password)}
              required
            />
          </AuthField>

          <AuthField
            id="register-confirm-password"
            label="Konfirmasi Password"
            hint="Ulangi password yang sama."
            error={state.fieldErrors?.confirmPassword}
          >
            <PasswordInput
              id="register-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
              required
            />
          </AuthField>

          <AuthSubmitButton label="Daftar" />
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
