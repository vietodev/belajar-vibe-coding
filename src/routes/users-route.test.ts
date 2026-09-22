import { beforeEach, describe, expect, it, mock } from "bun:test";
import { usersRoute } from "./users-route";

const mockSelect = mock();
const mockInsertValues = mock();
const mockUpdateSet = mock();
const mockDeleteWhere = mock();

mock.module("../db", () => {
  const dbObj = {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: (...args: any[]) => mockSelect(...args),
          }),
        }),
        where: () => ({
          limit: (...args: any[]) => mockSelect(...args),
        }),
      }),
    }),
    insert: () => ({
      values: (...args: any[]) => mockInsertValues(...args),
    }),
    update: () => ({
      set: () => ({
        where: (...args: any[]) => mockUpdateSet(...args),
      }),
    }),
    delete: () => ({
      where: (...args: any[]) => mockDeleteWhere(...args),
    }),
    transaction: async (cb: any) => cb(dbObj),
  };

  return {
    db: dbObj,
  };
});

describe("Users Route (POST /api/register)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
    mockUpdateSet.mockReset();
  });

  it("returns { data: 'OK' } when registration is successful", async () => {
    mockSelect.mockResolvedValueOnce([]);
    mockInsertValues.mockResolvedValueOnce([{ insertId: 1 }]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vieto",
          email: "vieto@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: "OK" });
  });

  it("returns { error: 'Email sudah terdaftar' } with status 400 when email already exists", async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1 }]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vieto",
          email: "existing@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toEqual({ error: "Email sudah terdaftar" });
  });

  it("returns error with status 422 when required fields are missing", async () => {
    const response = await usersRoute.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vieto",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});

describe("Users Route (POST /api/users/login)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
    mockUpdateSet.mockReset();
  });

  it("returns { data: token } with status 200 when login is successful", async () => {
    const hashedPassword = await Bun.password.hash("rahasia");
    mockSelect.mockResolvedValueOnce([{ id: 1, password: hashedPassword }]);
    mockInsertValues.mockResolvedValueOnce([{ insertId: 1 }]);
    mockUpdateSet.mockResolvedValueOnce([]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "vieto@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { data: string };
    expect(json.data).toBeString();
    expect(json.data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("returns { error: 'Email atau password salah' } with status 401 when email is not found", async () => {
    mockSelect.mockResolvedValueOnce([]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "notfound@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Email atau password salah" });
  });

  it("returns { error: 'Email atau password salah' } with status 401 when password is wrong", async () => {
    const hashedPassword = await Bun.password.hash("passwordbenar");
    mockSelect.mockResolvedValueOnce([{ id: 1, password: hashedPassword }]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "vieto@localhost",
          password: "passwordsalah",
        }),
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Email atau password salah" });
  });

  it("returns error with status 422 when required fields are missing", async () => {
    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "vieto@localhost",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});

describe("Users Route (POST /api/users/current)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
  });

  it("returns current user data when valid bearer token is provided", async () => {
    const fakeUser = {
      id: 1,
      name: "Vieto",
      email: "vieto@localhost",
      created_at: new Date("2026-01-01T00:00:00Z"),
    };
    mockSelect.mockResolvedValueOnce([fakeUser]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token-123",
        },
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      data: {
        id: 1,
        name: "Vieto",
        email: "vieto@localhost",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("returns { error: 'Unauthorized' } with status 401 when Authorization header is missing", async () => {
    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns { error: 'Unauthorized' } with status 401 when token is invalid/not found", async () => {
    mockSelect.mockResolvedValueOnce([]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });
});

describe("Users Route (DELETE /api/users/current)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockDeleteWhere.mockReset();
    mockUpdateSet.mockReset();
  });

  it("returns { data: 'OK' } with status 200 when logout is successful", async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1 }]); // mock session exists
    mockDeleteWhere.mockResolvedValueOnce([]);
    mockUpdateSet.mockResolvedValueOnce([]);

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token-123",
        },
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: "OK" });
  });

  it("returns { error: 'Unauthorized' } with status 401 when Authorization header is missing", async () => {
    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("returns { error: 'Unauthorized' } with status 401 when token is invalid/not found", async () => {
    mockSelect.mockResolvedValueOnce([]); // mock session not found

    const response = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      })
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
  });
});
