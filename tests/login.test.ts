import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { app, clearDatabase, createTestUser } from "./helpers";

describe("POST /api/users/login (Login User)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Positif", () => {
    it("login berhasil dengan email & password yang cocok mengembalikan status 200 OK dan token UUID", async () => {
      await createTestUser({
        name: "User Login",
        email: "login@example.com",
        password: "correctpassword",
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "correctpassword",
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = (await response.json()) as { data: string };
      expect(json.data).toBeString();
      // Validasi UUID pattern
      expect(json.data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it("token session baru tersimpan di tabel sessions dan terhubung dengan user terkait", async () => {
      const createdUser = await createTestUser({
        email: "sessioncheck@example.com",
        password: "password123",
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "sessioncheck@example.com",
            password: "password123",
          }),
        })
      );

      const json = (await response.json()) as { data: string };
      const returnedToken = json.data;

      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, returnedToken))
        .limit(1);

      expect(session).toBeDefined();
      expect(session.userId).toBe(createdUser.id);
      expect(session.token).toBe(returnedToken);
    });

    it("kolom token pada tabel users ter-update dengan token yang baru dibuat", async () => {
      const createdUser = await createTestUser({
        email: "tokencheck@example.com",
        password: "password123",
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "tokencheck@example.com",
            password: "password123",
          }),
        })
      );

      const json = (await response.json()) as { data: string };
      const returnedToken = json.data;

      const [userInDb] = await db
        .select()
        .from(users)
        .where(eq(users.id, createdUser.id))
        .limit(1);

      expect(userInDb).toBeDefined();
      expect(userInDb.token).toBe(returnedToken);
    });
  });

  describe("Skenario Negatif / Validasi", () => {
    it("login gagal dengan status 401 Unauthorized jika email belum terdaftar", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notfound@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Email atau password salah" });
    });

    it("login gagal dengan status 401 Unauthorized jika email ada tetapi password salah", async () => {
      await createTestUser({
        email: "exist@example.com",
        password: "correctpassword",
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "exist@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Email atau password salah" });
    });

    it("login gagal dengan status 422 Unprocessable Entity jika field email atau password tidak dikirim", async () => {
      // Tanpa password
      const resNoPass = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@example.com" }),
        })
      );
      expect(resNoPass.status).toBe(422);

      // Tanpa email
      const resNoEmail = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "password123" }),
        })
      );
      expect(resNoEmail.status).toBe(422);
    });

    it("login gagal dengan status 422 Unprocessable Entity jika request body kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(422);
    });

    it("login gagal dengan status 422 Unprocessable Entity jika string kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "", password: "" }),
        })
      );
      expect(response.status).toBe(422);
    });

    it("login gagal dengan status 422 Unprocessable Entity jika email atau password melebihi 255 karakter", async () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: longEmail, password: "password123" }),
        })
      );
      expect(response.status).toBe(422);
    });
  });
});
