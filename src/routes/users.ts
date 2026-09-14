import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    return await db.select().from(users);
  })
  .post(
    "/",
    async ({ body }) => {
      const result = await db.insert(users).values({ name: body.name });
      return { success: true, insertId: result[0].insertId };
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    }
  );
