import { isAxiosError } from "axios";

import type { ApiError } from "../subscription.type";

/** Every subscription endpoint answers `{ error }`; fall back to a generic line. */
export function apiErrorMessage(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.error;
    if (typeof message === "string" && message) return message;
    if (error.code === "ERR_NETWORK") {
      return "Tidak dapat menghubungi server. Periksa koneksi Anda.";
    }
  }

  return "Terjadi kesalahan yang tidak terduga.";
}
