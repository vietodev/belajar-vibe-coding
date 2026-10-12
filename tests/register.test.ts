import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { app, clearDatabase } from "./helpers";

describe("POST /api/register (Registrasi User)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Positif", () => {
    it("registrasi berhasil dengan data valid mengembalikan status 200 OK dan body { data: 'OK' }", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });

    it("password user berhasil di-hash dan data user tersimpan di database", async () => {
      const rawPassword = "secretPassword123";
      await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
            password: rawPassword,
          }),
        })
      );

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, "jane@example.com"))
        .limit(1);

      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe("Jane Doe");
      expect(savedUser.password).not.toBe(rawPassword);
      const isMatch = await Bun.password.verify(rawPassword, savedUser.password);
      expect(isMatch).toBe(true);
    });

    it("registrasi dengan panjang name, email, atau password tepat 255 karakter berhasil (200 OK)", async () => {
      const exactName = "a".repeat(255);
      const exactEmail = `${"a".repeat(243)}@example.com`; // total 255 chars
      const exactPassword = "p".repeat(255);

      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: exactName,
            email: exactEmail,
            password: exactPassword,
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });
  });

  describe("Skenario Negatif / Validasi", () => {
    it("registrasi gagal dengan status 400 Bad Request saat email sudah terdaftar", async () => {
      // Daftarkan user pertama
      await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Existing User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      // Coba daftar lagi dengan email sama
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Other Name",
            email: "duplicate@example.com",
            password: "newpassword456",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: "Email sudah terdaftar" });
    });

    it("registrasi gagal dengan status 422 jika salah satu field wajib tidak dikirim", async () => {
      // Tanpa name
      const resNoName = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@example.com", password: "password123" }),
        })
      );
      expect(resNoName.status).toBe(422);

      // Tanpa email
      const resNoEmail = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "User", password: "password123" }),
        })
      );
      expect(resNoEmail.status).toBe(422);

      // Tanpa password
      const resNoPass = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "User", email: "user@example.com" }),
        })
      );
      expect(resNoPass.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika request body kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika ada field string kosong (kurang dari minLength 1)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "user@example.com",
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika name melebihi 255 karakter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(256),
            email: "valid@example.com",
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika email melebihi 255 karakter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Valid Name",
            email: `${"a".repeat(250)}@example.com`,
            password: "password123",
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika password melebihi 255 karakter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Valid Name",
            email: "valid@example.com",
            password: "p".repeat(256),
          }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("registrasi gagal dengan status 422 jika tipe data payload salah", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: 12345,
            email: "user@example.com",
            password: true,
          }),
        })
      );
      expect(response.status).toBe(422);
    });
  });
});
