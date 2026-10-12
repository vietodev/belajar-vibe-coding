# Belajar Vibe Coding - RESTful API Backend

Aplikasi backend RESTful API modern dan berkinerja tinggi yang dibangun menggunakan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**. Proyek ini menerapkan arsitektur modular berlapis (*Layered Architecture*) dengan pemisahan tanggung jawab antara rute HTTP, logika bisnis layanan (*service*), dan akses basis data (*ORM/schema*).

---

## 📌 Daftar Isi
- [Tentang Aplikasi](#-tentang-aplikasi)
- [Technology Stack & Library](#-technology-stack--library)
- [Arsitektur & Struktur Folder](#-arsitektur--struktur-folder)
- [Skema Database](#-skema-database)
- [Dokumentasi API](#-dokumentasi-api)
- [Cara Setup Project](#-cara-setup-project)
- [Cara Menjalankan Aplikasi](#-cara-menjalankan-aplikasi)
- [Cara Menjalankan Test](#-cara-menjalankan-test)

---

## 📖 Tentang Aplikasi

Aplikasi ini menyediakan sistem autentikasi dan manajemen pengguna (*user management*) yang cepat, aman, dan siap pakai. Fitur utama yang didukung meliputi:

1. **Registrasi Pengguna (`/api/register`)**: Pendaftaran akun dengan validasi input berbasis skema TypeBox dan *one-way password hashing* yang aman menggunakan algoritma bawaan Bun.
2. **Autentikasi & Login (`/api/users/login`)**: Verifikasi kredensial pengguna, pembuatan token sesi unik berbasis UUID v4 (`crypto.randomUUID()`), dan penyimpanan sesi aktif.
3. **Profil Pengguna Berdasarkan Sesi (`/api/users/current`)**: Pengecekan data pengguna yang sedang login melalui autentikasi *Bearer Token* di *header*.
4. **Logout Sesi (`DELETE /api/users/current`)**: Pengakhiran sesi dengan penghapusan token dari basis data dalam transaksi basis data (*database transaction*).
5. **Rute CRUD Pengguna Sederhana (`/users`)**: Demonstrasi integrasi cepat antara ElysiaJS dan Drizzle ORM.

---

## 🛠 Technology Stack & Library

### Core Stack
| Teknologi | Versi | Peran |
| :--- | :--- | :--- |
| **[Bun](https://bun.sh/)** | Latest (v1.x+) | JavaScript/TypeScript all-in-one runtime, package manager, bundler, dan native test runner |
| **[TypeScript](https://www.typescriptlang.org/)** | ^5 / ^7 | Bahasa pemrograman berbasis tipe statis untuk *type-safety* ujung-ke-ujung |
| **[ElysiaJS](https://elysiajs.com/)** | `^1.4.30` | Web framework ergonomis dan ultra-cepat yang dirancang khusus untuk Bun |
| **[Drizzle ORM](https://orm.drizzle.team/)** | `^0.45.2` | TypeScript ORM ringan dengan performa tinggi dan *type safety* tanpa overhead |
| **[Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)** | `^0.31.10` | CLI toolkit untuk migrasi database, introspeksi, dan Drizzle Studio |
| **[MySQL2](https://github.com/sidorares/node-mysql2)** | `^3.24.4` | Driver MySQL dengan *connection pooling* dan dukungan *promise* |
| **MySQL** | 8.x+ / MariaDB | Relational Database Management System (RDBMS) |

### Library & Fitur Pendukung
- **`dotenv` (`^17.4.2`)**: Memuat variabel lingkungan (*environment variables*) dari file `.env`.
- **`Bun.password`**: Native API Bun untuk hashing dan verifikasi kata sandi (menggunakan algoritma Argon2id / bcrypt secara default).
- **`crypto.randomUUID`**: Web Standard Crypto API untuk pembuatan token sesi acak yang aman.
- **`@types/bun`**: Definisi tipe TypeScript untuk Bun runtime.
- **`bun:test`**: Runner bawaan Bun untuk unit testing dan integration testing.

---

## 🏛 Arsitektur & Struktur Folder

Aplikasi menggunakan pola **Layered Architecture (Routes -> Services -> Data/ORM)**:
1. **HTTP / Routing Layer (`src/routes/`)**: Menerima request HTTP, memvalidasi skema payload dan parameter menggunakan TypeBox (`t.Object`, `t.String`), menetapkan HTTP status code, serta meneruskan data ke layer *service*.
2. **Business Logic / Service Layer (`src/services/`)**: Mengatur alur logika bisnis, hashing password, pembuatan sesi UUID, validasi entitas, dan *database transaction*.
3. **Data Access / Persistence Layer (`src/db/`)**: Mengelola koneksi *database pool* serta mendefinisikan tabel dan relasi skema Drizzle ORM.
4. **Testing Layer (`tests/` & `src/*.test.ts`)**: Berisi skenario uji menyeluruh (positif, negatif, validasi batas panjang karakter, transaksi, dsb).

### Konvensi Penamaan File & Folder
- Folder dan file menggunakan format **kebab-case** (misalnya `users-route.ts`, `users-service.ts`, `current-user.test.ts`).
- File unit/integration test dinamai dengan sufiks `*.test.ts`.
- File skema dan konfigurasi basis data diletakkan di direktori `src/db/`.

### Struktur File Lengkap
```text
belajar-vibe-coding/
├── .env                  # Variabel lingkungan lokal (diabaikan oleh git)
├── .env.example          # Template konfigurasi variabel lingkungan
├── .gitignore            # Daftar file/folder yang diabaikan git
├── bun.lock              # Lockfile dependensi Bun
├── drizzle.config.ts     # Konfigurasi Drizzle Kit (dialect, schema, out folder)
├── package.json          # Manifest dependensi dan scripts npm/bun
├── tsconfig.json         # Konfigurasi compiler TypeScript
├── drizzle/              # Berkas migrasi SQL hasil generate Drizzle Kit
│   ├── 0000_tidy_fat_cobra.sql
│   ├── 0001_peaceful_xorn.sql
│   ├── 0002_vengeful_pandemic.sql
│   ├── 0003_blue_black_tarantula.sql
│   └── meta/             # Metadata riwayat migrasi Drizzle
├── src/
│   ├── index.ts          # Server entry point (Elysia app listener)
│   ├── index.test.ts     # Smoke test untuk root endpoint
│   ├── db/
│   │   ├── index.ts      # Inisialisasi koneksi MySQL pool & instance db Drizzle
│   │   └── schema.ts     # Definisi skema tabel users & sessions
│   ├── routes/
│   │   ├── users-route.ts        # Endpoint autentikasi (/api/register, /api/users/*)
│   │   ├── users-route.test.ts   # Test untuk layer route users
│   │   └── users.ts              # Endpoint dasar CRUD (/users)
│   └── services/
│       ├── users-service.ts      # Business logic autentikasi & session
│       └── users-service.test.ts # Test untuk layer service users
└── tests/
    ├── helpers.ts        # Utilitas test (in-memory app, mock data, clearDatabase)
    ├── index.test.ts     # Test untuk endpoint GET /
    ├── register.test.ts  # Test lengkap registrasi user
    ├── login.test.ts     # Test lengkap login user
    ├── current-user.test.ts # Test mengambil profil user saat ini
    ├── logout.test.ts    # Test proses logout user
    └── users.test.ts     # Test rute /users sederhana
```

---

## 🗄 Skema Database

Definisi tabel berada pada file [`src/db/schema.ts`](src/db/schema.ts).

### Relasi Antar Tabel
```text
┌─────────────────────────┐               ┌─────────────────────────┐
│          users          │               │        sessions         │
├─────────────────────────┤               ├─────────────────────────┤
│ id (PK, AI)             │ ◄──────────┐  │ id (PK, AI)             │
│ email (UNIQUE)          │            │  │ token (UNIQUE)          │
│ password (HASH)         │            └──┼ user_id (FK -> users.id)│
│ name                    │               │ created_at              │
│ token                   │               └─────────────────────────┘
│ created_at              │
│ updated_at              │
└─────────────────────────┘
```

### 1. Tabel `users`
Menyimpan data akun pengguna.

| Kolom | Tipe Data | Constraint / Keterangan |
| :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto Increment |
| `email` | `VARCHAR(255)` | Not Null, Unique, Format email pengguna |
| `password` | `VARCHAR(255)` | Not Null, Hash password (Argon2 / bcrypt) |
| `name` | `VARCHAR(255)` | Not Null, Nama lengkap pengguna |
| `token` | `VARCHAR(255)` | Nullable, Token sesi aktif terakhir |
| `created_at` | `TIMESTAMP` | Not Null, Default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | Not Null, Default `CURRENT_TIMESTAMP`, On Update `CURRENT_TIMESTAMP` |

### 2. Tabel `sessions`
Menyimpan riwayat token sesi aktif untuk autentikasi Bearer token.

| Kolom | Tipe Data | Constraint / Keterangan |
| :--- | :--- | :--- |
| `id` | `INT` | Primary Key, Auto Increment |
| `token` | `VARCHAR(255)` | Not Null, Unique, UUID v4 string |
| `user_id` | `INT` | Not Null, Foreign Key referensi ke `users(id)` |
| `created_at` | `TIMESTAMP` | Not Null, Default `CURRENT_TIMESTAMP` |

---

## 📡 Dokumentasi API

Base URL lokal: `http://localhost:3000`

### Ringkasan Endpoint
| Method | Endpoint | Autentikasi | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | Tidak | Health check / root endpoint |
| `POST` | `/api/register` | Tidak | Registrasi akun baru |
| `POST` | `/api/users/login` | Tidak | Login dan mendapatkan session token |
| `POST` | `/api/users/current` | Ya (Bearer) | Mendapatkan profil user yang sedang login |
| `DELETE` | `/api/users/current` | Ya (Bearer) | Logout dan menghapus session aktif |
| `GET` | `/users` | Tidak | Mendapatkan daftar seluruh user (sederhana) |
| `POST` | `/users` | Tidak | Menambahkan user baru (sederhana) |

---

### Rincian Endpoint

#### 1. Root Endpoint
- **Method**: `GET`
- **URL**: `/`
- **Response `200 OK`**:
  ```text
  Hello World
  ```

---

#### 2. Registrasi User
- **Method**: `POST`
- **URL**: `/api/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "PasswordRahasia123"
  }
  ```
- **Validasi**:
  - `name`: string, min 1 karakter, max 255 karakter.
  - `email`: string, min 1 karakter, max 255 karakter.
  - `password`: string, min 1 karakter, max 255 karakter.
- **Response Berhasil (`200 OK`)**:
  ```json
  {
    "data": "OK"
  }
  ```
- **Response Gagal**:
  - `400 Bad Request` (Email sudah terdaftar):
    ```json
    { "error": "Email sudah terdaftar" }
    ```
  - `422 Unprocessable Entity` (Validasi skema payload gagal atau field kosong):
    ```json
    { "type": "validation", "message": "..." }
    ```

---

#### 3. Login User
- **Method**: `POST`
- **URL**: `/api/users/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "budi@example.com",
    "password": "PasswordRahasia123"
  }
  ```
- **Response Berhasil (`200 OK`)**:
  ```json
  {
    "data": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```
- **Response Gagal**:
  - `401 Unauthorized` (Email tidak ditemukan atau password salah):
    ```json
    { "error": "Email atau password salah" }
    ```
  - `422 Unprocessable Entity` (Payload tidak lengkap):
    ```json
    { "type": "validation", "message": "..." }
    ```

---

#### 4. Mendapatkan User Saat Ini (Current User)
- **Method**: `POST`
- **URL**: `/api/users/current`
- **Headers**:
  - `Authorization: Bearer <TOKEN_SESSION_ANDA>`
- **Response Berhasil (`200 OK`)**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "created_at": "2026-10-13T00:00:00.000Z"
    }
  }
  ```
- **Response Gagal**:
  - `401 Unauthorized` (Header missing, format salah, atau token tidak valid):
    ```json
    { "error": "Unauthorized" }
    ```

---

#### 5. Logout User
- **Method**: `DELETE`
- **URL**: `/api/users/current`
- **Headers**:
  - `Authorization: Bearer <TOKEN_SESSION_ANDA>`
- **Response Berhasil (`200 OK`)**:
  ```json
  {
    "data": "OK"
  }
  ```
- **Response Gagal**:
  - `401 Unauthorized` (Token sesi tidak ditemukan):
    ```json
    { "error": "Unauthorized" }
    ```

---

#### 6. List Users (Sederhana)
- **Method**: `GET`
- **URL**: `/users`
- **Response Berhasil (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "email": "budi@example.com",
      "password": "...",
      "name": "Budi Santoso",
      "token": "...",
      "createdAt": "2026-10-13T00:00:00.000Z",
      "updatedAt": "2026-10-13T00:00:00.000Z"
    }
  ]
  ```

---

#### 7. Create User (Sederhana)
- **Method**: `POST`
- **URL**: `/users`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "User Baru"
  }
  ```
- **Response Berhasil (`200 OK`)**:
  ```json
  {
    "success": true,
    "insertId": 2
  }
  ```

---

## ⚙️ Cara Setup Project

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **[Bun](https://bun.sh/)** versi 1.0 atau lebih baru.
- **MySQL Server** (versi 8.x ke atas atau MariaDB) yang sedang berjalan di komputer lokal atau server remote.

### 2. Clone Repository & Masuk Direktori
```bash
git clone https://github.com/username/belajar-vibe-coding.git
cd belajar-vibe-coding
```

### 3. Install Dependensi
Jalankan perintah berikut untuk menginstal seluruh pustaka yang dibutuhkan:
```bash
bun install
```

### 4. Konfigurasi Environment (`.env`)
Salin file template `.env.example` ke `.env`:

**Linux / macOS / Git Bash:**
```bash
cp .env.example .env
```

**Windows PowerShell / CMD:**
```powershell
copy .env.example .env
```

Buka file `.env` dan sesuaikan koneksi database MySQL Anda:
```env
# URL Koneksi Database
DATABASE_URL=mysql://root:password@localhost:3306/belajar_vibe_coding

# Granular Database Credentials (opsional)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=belajar_vibe_coding

# Port Aplikasi
PORT=3000
```

> **Catatan**: Pastikan database telah dibuat di MySQL terlebih dahulu:
> ```sql
> CREATE DATABASE belajar_vibe_coding;
> ```

### 5. Setup & Migrasi Database
Pilih salah satu metode berikut untuk menyiapkan tabel ke database MySQL:

#### Opsi A: Push Skema Langsung (Cepat untuk Development)
```bash
bun run db:push
```

#### Opsi B: Generate & Jalankan Migrasi SQL
```bash
# 1. Generate berkas migrasi SQL ke folder ./drizzle
bun run db:generate

# 2. Jalankan migrasi ke database
bun run db:migrate
```

#### Opsi Tambahan: Buka Drizzle Studio (Database GUI)
Drizzle Studio adalah web-based GUI untuk menginspeksi dan memanipulasi data:
```bash
bun run db:studio
```

---

## 🚀 Cara Menjalankan Aplikasi

Tersedia skrip pada `package.json` untuk menjalankan server:

### Mode Development (Hot Reload)
Mengaktifkan mode pantau perubahan kode secara otomatis (*watch mode*):
```bash
bun run dev
```

### Mode Production
Menjalankan server langsung:
```bash
bun run start
```

Setelah server aktif, terminal akan menampilkan:
```text
🦊 Elysia is running at localhost:3000
```
Server dapat diakses melalui browser atau API client (Postman/Insomnia/cURL) pada alamat: `http://localhost:3000`.

---

## 🧪 Cara Test Aplikasi

Proyek ini dilengkapi dengan *integration test* dan *unit test* komprehensif menggunakan test runner bawaan Bun (`bun:test`).

### 1. Menjalankan Seluruh Test Suite
```bash
bun test
```

### 2. Menjalankan Test Pada File Tertentu
```bash
# Menjalankan test registrasi saja
bun test tests/register.test.ts

# Menjalankan test login saja
bun test tests/login.test.ts

# Menjalankan test current user saja
bun test tests/current-user.test.ts

# Menjalankan test logout saja
bun test tests/logout.test.ts

# Menjalankan seluruh test di folder tests/
bun test tests/
```

### 3. Menjalankan Test dengan Watch Mode
Otomatis menjalankan ulang test saat ada perubahan file:
```bash
bun test --watch
```

### Cakupan Pengujian (Test Coverage Scenarios):
- **Skenario Positif**: Pendaftaran berhasil, verifikasi hashing password, login menghasilkan token session UUID, pengambilan profil dengan Bearer token, pembersihan token saat logout dalam transaksi SQL.
- **Skenario Negatif**: Percobaan registrasi dengan email duplikat (`400 Bad Request`), kredensial login keliru (`401 Unauthorized`), token Bearer tidak valid/kadaluarsa (`401 Unauthorized`).
- **Validasi Input**: Validasi panjang minimum dan maksimum (1 - 255 karakter), penanganan payload kosong atau tipe data tidak valid (`422 Unprocessable Entity`).
- **Pembersihan Database Otomatis**: Utilitas `clearDatabase()` dijalankan pada setiap `beforeEach()` untuk menjaga isolasi antar kasus uji.
