import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { app, clearDatabase, createTestSession, createTestUser } from "./helpers";

describe("DELETE /api/users/current (Logout User)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe("Skenario Positif", () => {
    it("logout berhasil dengan header Authorization: Bearer <token_valid> mengembalikan status 200 OK dan body { data: 'OK' }", async () => {
      const token = "logout-valid-token-111";
      const user = await createTestUser({
        email: "logout@example.com",
        token,
      });
      await createTestSession({ token, userId: user.id });

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ data: "OK" });
    });

    it("data session dengan token tersebut terhapus dari tabel sessions", async () => {
      const token = "logout-check-session-222";
      const user = await createTestUser({
        email: "checksession@example.com",
        token,
      });
      await createTestSession({ token, userId: user.id });

      await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      expect(session).toBeUndefined();
    });

    it("kolom token pada user terkait di tabel users di-set menjadi null", async () => {
      const token = "logout-check-user-token-333";
      const user = await createTestUser({
        email: "checkusertoken@example.com",
        token,
      });
      await createTestSession({ token, userId: user.id });

      await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const [userInDb] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(userInDb).toBeDefined();
      expect(userInDb.token).toBeNull();
    });
  });

  describe("Skenario Negatif / Unauthorized", () => {
    it("logout gagal dengan status 401 Unauthorized jika header Authorization tidak disertakan", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("logout gagal dengan status 401 Unauthorized jika token tidak ditemukan / tidak valid di database", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer non-existent-token",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("logout gagal dengan status 401 Unauthorized jika format Authorization header tidak valid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: "InvalidFormatToken",
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("logout kedua kali menggunakan token yang sama langsung gagal dengan status 401 Unauthorized", async () => {
      const token = "logout-twice-token-444";
      const user = await createTestUser({
        email: "twice@example.com",
        token,
      });
      await createTestSession({ token, userId: user.id });

      // Logout pertama
      const res1 = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(res1.status).toBe(200);

      // Logout kedua
      const res2 = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(res2.status).toBe(401);
      const json2 = await responseJson(res2);
      expect(json2).toEqual({ error: "Unauthorized" });
    });
  });
});

async function responseJson(res: Response) {
  return await res.json();
}
