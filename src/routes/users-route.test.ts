import { beforeEach, describe, expect, it, mock } from "bun:test";
import { usersRoute } from "./users-route";

const mockSelect = mock();
const mockInsertValues = mock();

mock.module("../db", () => {
  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: (...args: any[]) => mockSelect(...args),
          }),
        }),
      }),
      insert: () => ({
        values: (...args: any[]) => mockInsertValues(...args),
      }),
    },
  };
});

describe("Users Route (POST /api/register)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
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
