import { Elysia, t } from "elysia";
import { loginUser, registerUser, UserLoginError, UserRegistrationError } from "../services/users-service";

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
  );
