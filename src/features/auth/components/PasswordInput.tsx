"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { authInputClassName } from "./AuthField";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <span className="group/password relative block w-full">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(authInputClassName, "pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/4 text-[#8A8378] outline-none transition-[background-color,color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.07] hover:text-[#1C1917] focus-visible:ring-2 focus-visible:ring-[#1C1917]/20 active:scale-95"
      >
        {visible ? (
          <EyeOffIcon strokeWidth={1.25} className="size-4" />
        ) : (
          <EyeIcon strokeWidth={1.25} className="size-4" />
        )}
      </button>
    </span>
  );
}
