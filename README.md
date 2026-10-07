# Subscription & Manual Payment SaaS

Aplikasi SaaS subscription dengan pembayaran manual, dibangun dengan Next.js 16 (App Router),
Prisma 7, dan NextAuth v5 (Auth.js).

## Setup

```bash
bun install
cp .env.example .env   # isi DATABASE_URL dan AUTH_SECRET
bunx prisma migrate deploy
bun run db:seed
bun dev
```

`AUTH_SECRET` dibuat dengan `openssl rand -base64 32`. Dokumentasi `src/auth.ts` ada di
[`docs/auth.md`](docs/auth.md).

## Environment

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Prisma + driver adapter `pg`). |
| `AUTH_SECRET` | Kunci enkripsi JWT session NextAuth. Wajib di production. |
| `AWS_ENDPOINT_URL_S3` | Endpoint storage branch Neon (Connect → Storage → "Parameters only"). |
| `AWS_REGION` | Region object storage, mis. `ap-southeast-1`. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Kredensial storage Neon. Rahasia. |
| `NEON_STORAGE_BUCKET` | Nama bucket tujuan (privat). |

## Scripts Database

| Perintah | Efek |
|---|---|
| `bun run db:seed` | Mengisi/menyegarkan akun demo dan plan (idempoten). |
| `bun run db:reset` | Kosongkan tabel transaksional (reset id), lalu seed. |

## Testing Auth (login & register)

| Perintah | Efek |
|---|---|
| `bun run test` | Semua suite: invariant database, lalu end-to-end. |
| `bun run test:db` | `bun test` — invariant Prisma: role default, hash bcrypt, email unik (P2002). |
| `bun run test:e2e` | Playwright — alur login/register lewat UI sungguhan. |
| `bun run test:report` | Buka laporan HTML Playwright. |

Struktur:

- `test/e2e/login.spec.ts` — 19 test: 5 positif (USER/ADMIN, redirect sesi, callbackUrl,
  logout), 6 negatif (password salah, email tidak dikenal, email case-insensitive, field wajib),
  serta cookie httpOnly, proteksi rute, dan aturan role.
- `test/e2e/register.spec.ts` — 14 test: 4 positif (akun baru langsung dipakai login, email
  dinormalisasi, password 8 karakter), 10 negatif (format email, panjang password, konfirmasi
  tidak sama, semua field salah sekaligus, email duplikat).
- `test/e2e/helpers.ts` — util bersama; field diisi lewat native setter + `requestSubmit()`
  dengan `noValidate` agar aturan **server** yang diuji, bukan validasi bawaan browser.
- `test/db/auth.db.test.ts` — invariant level database (`bun test`, karena client Prisma 7
  ESM-only dan tidak bisa di-import loader CommonJS milik Playwright).
- `test/screenshots/{login,register}/` — bukti PNG tiap skenario, ditulis setelah assertion
  lulus.

Catatan:

- Test berjalan terhadap `DATABASE_URL` di `.env`, bukan database sekali-pakai. Setiap test
  membuat user ber-prefix `e2e-` sendiri dan `global-teardown` menghapusnya, sehingga suite
  aman diulang dan tidak menghapus data lain.
- `prisma/migrations` belum bisa membangun database kosong: `20261007120000_init_auth` dan
  `…_subscription_payment_schema` sama-sama membuat `UserRole`, jadi riwayat yang di-replay
  dari nol selalu bentrok. Test karena itu memakai database yang sudah ada.
- Server E2E dijalankan `next dev` di port `3100` (`E2E_PORT`) dengan `DATABASE_URL` sama,
  jadi alur form → server action → NextAuth → Prisma → cookie benar-benar dieksekusi.


## Akun demo

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@example.com` | `admin12345` |
| USER | `user@example.com` | `user12345` |

Seed juga membuat plan Basic (1 bulan, Rp50.000), Pro (3 bulan, Rp135.000), dan Business
(12 bulan, Rp480.000).

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
- `src/types/next-auth.d.ts` — augmentasi tipe `Session`, `User`, dan `JWT`.
- `src/features/auth/form-state.ts` — tipe `FormState` untuk hasil server action.

Kenapa JWT, bukan database session: skema auth tidak mendefinisikan tabel `Account`, `Session`,
atau `VerificationToken`, jadi adapter database tidak dipakai dan identitas dibaca ulang dari
cookie yang ditandatangani pada setiap request.

Aturan akses:

- `/login` dan `/register` publik; keduanya mengalihkan sesi yang sudah login ke `/dashboard`.
- Route lain (termasuk `/dashboard`) membutuhkan sesi; pengunjung tanpa sesi diarahkan ke
  `/login` oleh `authorized` callback di `src/auth.ts`.

## Subscription & Manual Payment

Seluruh UI subscription berada di `src/features/subscription/` dan dirender di dalam
`/dashboard` sebagai satu komposisi (`components/DashboardShell.tsx`) — sidebar hanya menukar
panel, tidak ada navigasi antar halaman. Hooks TanStack Query di `features/subscription/hooks/`
dipakai untuk aksi yang mengubah state lewat `src/lib/axios.ts` (`baseURL: "/api"`).

### Endpoint

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/api/plans` | login | Daftar plan aktif, diurutkan dari harga terendah. |
| `GET` | `/api/subscriptions` | login | Langganan milik user yang sedang login. |
| `POST` | `/api/subscriptions` | login | Body hanya `{ "planId": "..." }`; harga & durasi dari database. |
| `GET` | `/api/subscriptions/:id` | pemilik | Langganan milik user lain menghasilkan `404`. |
| `POST` | `/api/subscriptions/:id/payments` | pemilik | Upload bukti (`multipart/form-data`, field `proof`). |
| `POST` | `/api/subscriptions/:id/renew` | pemilik | Ajukan perpanjangan; status kembali ke `PENDING_PAYMENT`. |
| `GET` | `/api/admin/payments?status=` | ADMIN | Antrean verifikasi. |
| `GET` | `/api/payments/:id/proof` | pemilik/ADMIN | Alihkan ke presigned GET 15 menit. |
| `POST` | `/api/admin/payments/:id/approve` | ADMIN | Satu transaksi: payment `APPROVED` + langganan `ACTIVE` + periode. |
| `POST` | `/api/admin/payments/:id/reject` | ADMIN | Payment `REJECTED` + langganan `REJECTED`. |

Error selalu `{ "error": "...", "code": "..." }`: `400`, `401`, `403`, `404`, `409`, `413`,
`415`, `500`, `502`.

`src/proxy.ts` melewati `/api/**`, jadi setiap route handler memvalidasi sesi sendiri lewat
`requireApiUser()`/`requireApiAdmin()` di `src/features/subscription/http.ts`.

### Aturan bisnis

- Client hanya mengirim `planId`; `price`, `duration`, `status`, `startDate`, dan `endDate`
  selalu ditentukan backend.
- Bukti transfer: JPG, JPEG, PNG, atau PDF, maksimal 5 MB; jenis diverifikasi dari magic bytes,
  disimpan di Neon Object Storage, dan baris `Payment` hanya menyimpan `proofKey`.
- Satu subscription hanya boleh punya satu payment `PENDING`, dijaga partial unique index
  `Payment_subscriptionId_pending_key`; pelanggaran mengembalikan `409`.
- Approve/reject berjalan dalam satu `prisma.$transaction`.
- `startDate` = waktu approval, `endDate` = `startDate` + durasi plan; renewal saat masih aktif
  memulai periode baru setelah `endDate` berjalan.
- Langganan `ACTIVE` yang melewati `endDate` otomatis menjadi `EXPIRED` saat data dibaca.

