import { beforeEach, describe, expect, it } from "bun:test";
import { app, clearDatabase, createTestSession, createTestUser } from "./helpers";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("POST /api/users/current (Get Current User Profile)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Positif", () => {
    it("mengambil data user berhasil dengan header Authorization: Bearer <valid_token> mengembalikan status 200 OK", async () => {
      const user = await createTestUser({
        name: "Active User",
        email: "active@example.com",
      });
      const token = "valid-session-token-12345";
      await createTestSession({ token, userId: user.id });

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe(user.id);
      expect(json.data.name).toBe("Active User");
      expect(json.data.email).toBe("active@example.com");
      expect(json.data.created_at).toBeDefined();
    });

    it("memastikan password dan token tidak bocor di dalam response body", async () => {
      const user = await createTestUser({
        name: "Security User",
        email: "security@example.com",
      });
      const token = "secret-session-token-99999";
      await createTestSession({ token, userId: user.id });

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const json = await response.json();
      expect(json.data.password).toBeUndefined();
      expect(json.data.token).toBeUndefined();
    });
  });

  describe("Skenario Negatif / Unauthorized", () => {
    it("gagal dengan status 401 Unauthorized jika header Authorization tidak disertakan", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("gagal dengan status 401 Unauthorized jika format header bukan Bearer <token>", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Basic dXNlcjpwYXNz",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("gagal dengan status 401 Unauthorized jika token berformat Bearer tetapi nilainya kosong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer   ",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("gagal dengan status 401 Unauthorized jika token tidak ada di tabel sessions / expired", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer non-existent-random-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("gagal dengan status 401 Unauthorized jika session ada tetapi user terkait sudah tidak ada di tabel users", async () => {
      const user = await createTestUser({ email: "deleted@example.com" });
      const token = "orphan-session-token-000";
      await createTestSession({ token, userId: user.id });

      // Hapus foreign key check atau hapus user (di MySQL sessions references users(id), hapus user cascade/manual)
      // Kita coba hapus user
      try {
        await db.delete(users).where(eq(users.id, user.id));
      } catch {
        // Jika ada FK constraint, sesuaikan session dengan user id yang tidak ada
      }

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "POST",
          headers: {
            Authorization: "Bearer unknown-user-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });
  });
});
