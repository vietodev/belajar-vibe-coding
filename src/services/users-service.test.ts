import { beforeEach, describe, expect, it, mock } from "bun:test";
import { UserLoginError, UserRegistrationError } from "./users-service";

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

describe("Users Service (registerUser)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
  });

  it("throws UserRegistrationError when email is already registered", async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1 }]);

    const { registerUser } = await import("./users-service");

    await expect(
      registerUser({
        name: "Vieto",
        email: "vieto@localhost",
        password: "rahasia",
      })
    ).rejects.toThrow("Email sudah terdaftar");
  });

  it("hashes password and inserts user into database when email is not registered", async () => {
    mockSelect.mockResolvedValueOnce([]);
    mockInsertValues.mockResolvedValueOnce([{ insertId: 1 }]);

    const { registerUser } = await import("./users-service");

    const result = await registerUser({
      name: "Vieto",
      email: "vieto@localhost",
      password: "rahasia",
    });

    expect(result).toEqual({ data: "OK" });
    expect(mockInsertValues).toHaveBeenCalledTimes(1);

    const insertedValues = mockInsertValues.mock.calls[0][0];
    expect(insertedValues.name).toBe("Vieto");
    expect(insertedValues.email).toBe("vieto@localhost");
    expect(insertedValues.password).not.toBe("rahasia");
    expect(await Bun.password.verify("rahasia", insertedValues.password)).toBe(true);
  });
});

describe("Users Service (loginUser)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
  });

  it("throws UserLoginError when email is not found", async () => {
    mockSelect.mockResolvedValueOnce([]);

    const { loginUser } = await import("./users-service");

    await expect(
      loginUser({ email: "notfound@localhost", password: "rahasia" })
    ).rejects.toThrow("Email atau password salah");
  });

  it("throws UserLoginError when password is wrong", async () => {
    const hashedPassword = await Bun.password.hash("passwordbenar");
    mockSelect.mockResolvedValueOnce([{ id: 1, password: hashedPassword }]);

    const { loginUser } = await import("./users-service");

    await expect(
      loginUser({ email: "vieto@localhost", password: "passwordsalah" })
    ).rejects.toThrow("Email atau password salah");
  });

  it("returns a UUID token and saves session when credentials are valid", async () => {
    const hashedPassword = await Bun.password.hash("rahasia");
    mockSelect.mockResolvedValueOnce([{ id: 5, password: hashedPassword }]);
    mockInsertValues.mockResolvedValueOnce([{ insertId: 1 }]);

    const { loginUser } = await import("./users-service");

    const result = await loginUser({ email: "vieto@localhost", password: "rahasia" });

    expect(result.data).toBeString();
    expect(result.data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    expect(mockInsertValues).toHaveBeenCalledTimes(1);
    const insertedSession = mockInsertValues.mock.calls[0][0];
    expect(insertedSession.token).toBe(result.data);
    expect(insertedSession.userId).toBe(5);
  });
});
