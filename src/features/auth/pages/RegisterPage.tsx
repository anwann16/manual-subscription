import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/dal";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

async function RegisterPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Mulai dalam 3 langkah"
      headline={
        <>
          Akun baru,
          <br />
          <span className="italic text-[#8A9A8C]">alur</span> yang jelas.
        </>
      }
      blurb="Registrasi hanya butuh email dan password. Setelah itu pilih paket dan selesaikan pembayaran manual."
      steps={[
        {
          label: "Buat akun",
          detail:
            "Role selalu mengikuti default database; klien tidak dipercaya.",
        },
        {
          label: "Ajukan langganan",
          detail:
            "Satu langganan aktif per paket, duplikasi ditolak di backend.",
        },
        {
          label: "Aktif setelah verifikasi",
          detail: "Periode dihitung dari tanggal approval admin.",
        },
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}

export default RegisterPage;
