import { beforeEach, describe, expect, it, mock } from "bun:test";
import { UserRegistrationError } from "./users-service";

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
