# Belajar Vibe Coding - Bun + ElysiaJS + Drizzle + MySQL

Boilerplate backend menggunakan Bun, ElysiaJS, Drizzle ORM, dan MySQL.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Konfigurasi Database (.env)
Salin `.env.example` menjadi `.env` dan sesuaikan kredensial MySQL Anda:
```bash
cp .env.example .env
```

Isi default `.env`:
```env
DATABASE_URL=mysql://root:password@localhost:3306/belajar_vibe_coding
PORT=3000
```

### 3. Database Migration / Push
Untuk membuat dan menerapkan schema ke MySQL:
```bash
# Push schema langsung ke database
bun run db:push

# Atau generate file migrasi SQL
bun run db:generate

# Menjalankan migrasi
bun run db:migrate

# Membuka Drizzle Studio (Database GUI)
bun run db:studio
```

### 4. Menjalankan Server
```bash
# Mode development (hot reload)
bun run dev

# Mode production
bun run start
```

## 📁 Struktur Project
```text
.
├── drizzle/              # Folder migrasi SQL dari Drizzle Kit
├── src/
│   ├── db/
│   │   ├── index.ts      # Koneksi database MySQL & Drizzle instance
│   │   └── schema.ts     # Definisi schema tabel (Drizzle ORM)
│   ├── routes/
│   │   └── users.ts      # Endpoint / rute modular ElysiaJS
│   ├── index.ts          # Server entrypoint
│   └── index.test.ts     # Unit testing
├── .env.example          # Template konfigurasi environment
├── drizzle.config.ts     # Konfigurasi Drizzle Kit
├── package.json          # Dependencies dan script
└── tsconfig.json         # Konfigurasi TypeScript
```
