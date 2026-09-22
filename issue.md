# Fitur Logout User

Buatkan API untuk melakukan logout user yang saat ini sedang login.

## Spesifikasi API

- **Endpoint:** `DELETE /api/users/current`
- **Headers:** 
  - `Authorization: Bearer <token>` (token diambil dari Authorization header)

### Response Sukses (200 OK)
Jika sukses logout, maka data session dengan token tersebut harus dihapus dari tabel `sessions`.
```json
{
    "data": "OK"
}
```

### Response Error (401 Unauthorized)
Jika token tidak valid, tidak ditemukan di database, atau tidak disertakan pada header.
```json
{
    "error": "Unauthorized"
}
```

## Struktur File dan Folder
- **Routes (`src/routes`):** Berisi routing ElysiaJS. Gunakan format misal `users-route.ts`.
- **Services (`src/services`):** Berisi logic bisnis aplikasi. Gunakan format misal `users-service.ts`.

## Tahapan Implementasi

1. **Update Service (`src/services/users-service.ts`):**
   - Buat fungsi baru bernama `logoutUser(token: string)`.
   - Lakukan pengecekan apakah token tersebut ada di tabel `sessions`.
   - Jika ada, hapus record tersebut dari tabel `sessions` menggunakan Drizzle ORM.
   - Jika tidak ada, return error (misal throw exception yang akan di-catch menjadi `Unauthorized`).

2. **Update Route (`src/routes/users-route.ts`):**
   - Tambahkan endpoint `app.delete('/current', ...)` pada route users.
   - Ambil token dari header `Authorization: Bearer <token>`.
   - Jika format header salah atau kosong, kembalikan status `401` dengan body `{"error": "Unauthorized"}`.
   - Panggil `logoutUser(token)` dari `users-service.ts`.
   - Jika berhasil, kembalikan status `200` dengan body `{"data": "OK"}`.
   - Jika gagal/unauthorized, tangkap error dan kembalikan status `401` dengan body `{"error": "Unauthorized"}`.

3. **Update Test (Opsional namun dianjurkan):**
   - Tambahkan test case di `users-service.test.ts` untuk memvalidasi penghapusan session.
   - Tambahkan test case di `users-route.test.ts` untuk memvalidasi response berhasil dan error pada endpoint `DELETE /api/users/current`.
   - Pastikan semua test passing dengan menjalankan `bun test`.
