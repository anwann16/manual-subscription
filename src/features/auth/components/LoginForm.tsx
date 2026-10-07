"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/features/auth/actions/auth.actions";
import type { FormState } from "@/features/auth/form-state.type";
import { FieldGroup } from "@/components/ui/field";
import { AuthCard } from "./AuthCard";
import { AuthField, AuthInput } from "./AuthField";
import { AuthNotice } from "./AuthNotice";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { PasswordInput } from "./PasswordInput";

const initialState: FormState = {};

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <AuthCard
      eyebrow="Masuk"
      title="Selamat datang kembali"
      description="Gunakan akun yang sudah terdaftar untuk melanjutkan ke dashboard."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-[#1C1917] underline decoration-[#C9C3B9] underline-offset-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:decoration-[#1C1917]"
          >
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-7">
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}

        <FieldGroup className="gap-6">
          <AuthNotice message={state.error} />

          <AuthField id="login-email" label="Email">
            <AuthInput
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@perusahaan.com"
              required
            />
          </AuthField>

          <AuthField id="login-password" label="Password">
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </AuthField>

          <AuthSubmitButton label="Masuk" />
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
