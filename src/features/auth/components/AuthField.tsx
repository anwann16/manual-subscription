import type { ReactNode } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const authInputClassName = cn(
  "h-11 rounded-[0.85rem] border-b-transparent bg-[#F6F2EB]/70 px-3.5 text-[0.9rem]",
  "ring-1 ring-black/[0.05] transition-[background-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
  "placeholder:text-[#B8B1A6] focus-visible:border-b-transparent focus-visible:bg-[#FDFCFA] focus-visible:ring-[1.5px] focus-visible:ring-[#1C1917]/20",
  "aria-invalid:border-b-transparent aria-invalid:ring-[#B4443A]/35 dark:aria-invalid:border-b-transparent",
);

type AuthFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function AuthField({
  id,
  label,
  hint,
  error,
  aside,
  children,
}: AuthFieldProps) {
  const invalid = Boolean(error);

  return (
    <Field data-invalid={invalid}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel
          htmlFor={id}
          className="text-[0.62rem] text-[#8A8378] tracking-[0.18em]"
        >
          {label}
        </FieldLabel>
        {aside}
      </div>
      {children}
      {hint && !invalid ? (
        <p className="text-[0.72rem] text-[#A8A29A]">{hint}</p>
      ) : null}
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  );
}

export function AuthInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <Input {...props} className={cn(authInputClassName, className)} />;
}

export { authInputClassName };
