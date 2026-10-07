import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/dal";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;

  return (
    <AuthShell
      eyebrow="Manual Payment SaaS"
      headline={
        <>
          Langganan yang
          <br />
          <span className="italic text-[#8A9A8C]">terkendali</span> penuh.
        </>
      }
      blurb="Pilih paket, transfer manual, unggah bukti, lalu pantau verifikasi admin — semuanya dalam satu alur yang rapi."
      steps={[
        {
          label: "Masuk ke akun",
          detail: "Verifikasi kredensial dan sesi ditandatangani di server.",
        },
        {
          label: "Pilih paket langganan",
          detail: "Harga dan durasi selalu diambil dari database, bukan klien.",
        },
        {
          label: "Bayar & unggah bukti",
          detail: "Admin memverifikasi transfer sebelum langganan aktif.",
        },
      ]}
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}

export default LoginPage;
