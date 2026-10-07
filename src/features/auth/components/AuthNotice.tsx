import { CircleAlertIcon } from "lucide-react";

export function AuthNotice({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[0.85rem] bg-[#FBF1EE] px-3.5 py-3 text-[0.8rem] leading-relaxed text-[#8E3B33] ring-1 ring-[#B4443A]/15"
    >
      <CircleAlertIcon strokeWidth={1.25} className="mt-px size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
