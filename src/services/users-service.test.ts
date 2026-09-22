import { beforeEach, describe, expect, it, mock } from "bun:test";
import { UserLoginError, UserRegistrationError } from "./users-service";

const mockSelect = mock();
const mockInsertValues = mock();
const mockUpdateSet = mock();
const mockDeleteWhere = mock();

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
      update: () => ({
        set: () => ({
          where: (...args: any[]) => mockUpdateSet(...args),
        }),
      }),
      delete: () => ({
        where: (...args: any[]) => mockDeleteWhere(...args),
      }),
    },
  };
});

describe("Users Service (registerUser)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockInsertValues.mockReset();
    mockUpdateSet.mockReset();
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
    mockUpdateSet.mockReset();
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
    mockUpdateSet.mockResolvedValueOnce([]);

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

describe("Users Service (getCurrentUser)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
  });

  it("returns null when empty token is passed", async () => {
    const { getCurrentUser } = await import("./users-service");
    const user = await getCurrentUser("");
    expect(user).toBeNull();
  });

  it("returns user details when token is valid and found", async () => {
    const fakeUser = {
      id: 1,
      name: "Vieto",
      email: "vieto@localhost",
      created_at: new Date("2026-01-01T00:00:00Z"),
    };
    mockSelect.mockResolvedValueOnce([fakeUser]);

    const { getCurrentUser } = await import("./users-service");
    const user = await getCurrentUser("valid-token");
    expect(user).toEqual(fakeUser);
  });

  it("returns null when token is not found in database", async () => {
    mockSelect.mockResolvedValueOnce([]);

    const { getCurrentUser } = await import("./users-service");
    const user = await getCurrentUser("invalid-token");
    expect(user).toBeNull();
  });
});

describe("Users Service (logoutUser)", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockDeleteWhere.mockReset();
    mockUpdateSet.mockReset();
  });

  it("throws UserLogoutError when token is empty", async () => {
    const { logoutUser } = await import("./users-service");
    await expect(logoutUser("")).rejects.toThrow("Unauthorized");
  });

  it("throws UserLogoutError when session is not found", async () => {
    mockSelect.mockResolvedValueOnce([]); // session not found
    
    const { logoutUser } = await import("./users-service");
    await expect(logoutUser("invalid-token")).rejects.toThrow("Unauthorized");
  });

  it("deletes session and returns OK when token is valid", async () => {
    mockSelect.mockResolvedValueOnce([{ id: 1 }]); // session found
    mockDeleteWhere.mockResolvedValueOnce([]);
    mockUpdateSet.mockResolvedValueOnce([]);

    const { logoutUser } = await import("./users-service");
    const result = await logoutUser("valid-token");

    expect(result).toEqual({ data: "OK" });
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledTimes(1);
  });
});
