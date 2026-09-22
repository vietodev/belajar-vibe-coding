import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  UserLoginError,
  UserLogoutError,
  UserRegistrationError,
  logoutUser,
} from "../services/users-service";

export const usersRoute = new Elysia()
  .post(
    "/api/register",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return result;
      } catch (error) {
        if (error instanceof UserRegistrationError) {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal pada server" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        return result;
      } catch (error) {
        if (error instanceof UserLoginError) {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Terjadi kesalahan internal pada server" };
      }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post("/api/users/current", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const user = await getCurrentUser(token);
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    return {
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    };
  })
  .delete("/api/users/current", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const result = await logoutUser(token);
      set.status = 200;
      return result;
    } catch (error) {
      if (error instanceof UserLogoutError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Terjadi kesalahan internal pada server" };
    }
  });
