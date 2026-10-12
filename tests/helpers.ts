import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { userRoutes } from "../src/routes/users";
import { usersRoute } from "../src/routes/users-route";

export const app = new Elysia()
  .get("/", () => "Hello World")
  .use(userRoutes)
  .use(usersRoute);

export async function clearDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}

export async function createTestUser(data: {
  name?: string;
  email: string;
  password?: string;
  token?: string | null;
}) {
  const hashedPassword = await Bun.password.hash(data.password || "password123");
  const [result] = await db.insert(users).values({
    name: data.name || "Test User",
    email: data.email,
    password: hashedPassword,
    token: data.token || null,
  });

  return {
    id: result.insertId,
    email: data.email,
    name: data.name || "Test User",
  };
}

export async function createTestSession(data: {
  token: string;
  userId: number;
}) {
  const [result] = await db.insert(sessions).values({
    token: data.token,
    userId: data.userId,
  });

  return {
    id: result.insertId,
    token: data.token,
    userId: data.userId,
  };
}
