import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UserRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRegistrationError";
  }
}

export class UserLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserLoginError";
  }
}

export const registerUser = async (payload: RegisterUserInput) => {
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new UserRegistrationError("Email sudah terdaftar");
  }

  const hashedPassword = await Bun.password.hash(payload.password);

  await db.insert(users).values({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });

  return {
    data: "OK",
  };
};

export const loginUser = async (payload: LoginUserInput) => {
  const existingUser = await db
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existingUser.length === 0) {
    throw new UserLoginError("Email atau password salah");
  }

  const user = existingUser[0];
  const isPasswordValid = await Bun.password.verify(payload.password, user.password);

  if (!isPasswordValid) {
    throw new UserLoginError("Email atau password salah");
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  await db.update(users).set({ token }).where(eq(users.id, user.id));

  return {
    data: token,
  };
};

export async function getCurrentUser(token: string) {
  if (!token) return null;

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.createdAt,
    })
    .from(users)
    .where(eq(users.token, token))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}
