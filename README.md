# Manual Subscription — Auth

Fitur autentikasi saja (Next.js 16 App Router, Prisma 7, NextAuth v5 / Auth.js).
Fitur subscription belum ada di project ini.

## Setup

```bash
bun install
cp .env.example .env   # isi DATABASE_URL dan AUTH_SECRET
bunx prisma migrate deploy
bun dev
```

`AUTH_SECRET` dibuat dengan `openssl rand -base64 32`.

## Environment

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Prisma + driver adapter `pg`). |
| `AUTH_SECRET` | Kunci enkripsi JWT session NextAuth. Wajib di production. |

## Akun demo

Skema hanya memuat tabel `User`; belum ada seed, jadi buat akun pertama lewat `/register`
(role default `USER`). Untuk akun `ADMIN`, ubah kolom `role` baris tersebut di database.

## Authentication

NextAuth v5 dengan Credentials provider dan strategi session **JWT**.

- `src/auth.ts` — konfigurasi NextAuth: `authorize` memverifikasi password dengan bcrypt,
  callback `jwt`/`session` menyalin `id` dan `role` ke session.
- `src/app/api/auth/[...nextauth]/route.ts` — route handler NextAuth.
- `src/features/auth/actions/` — server action `login`, `register`, dan `logout`.
- `src/features/auth/dal.ts` — `getSession`, `requireUser`, `requireAdmin` untuk halaman server.
- `src/proxy.ts` — proteksi route (Next.js 16 memakai `proxy.ts`, bukan `middleware.ts`).
- `src/features/auth/components/` — UI autentikasi: `AuthShell` (frame editorial split),
  `AuthCard` (enclosure double-bezel), `LoginForm`, `RegisterForm`, `PasswordInput`,
  `AuthField`, `AuthSubmitButton`, `AuthNotice`.
- `src/features/auth/next-auth.d.ts` — augmentasi tipe `Session`, `User`, dan `JWT`.

Kenapa JWT, bukan database session: skema auth tidak mendefinisikan tabel `Account`, `Session`,
atau `VerificationToken`, jadi adapter database tidak dipakai dan identitas dibaca ulang dari
cookie yang ditandatangani pada setiap request.

Aturan akses:

- `/login` dan `/register` publik; keduanya mengalihkan sesi yang sudah login ke `/dashboard`.
- Route lain (termasuk `/dashboard`) membutuhkan sesi; pengunjung tanpa sesi diarahkan ke
  `/login` oleh `authorized` callback di `src/auth.ts`.
