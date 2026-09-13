import { Elysia } from "elysia";
import { userRoutes } from "./routes/users";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = new Elysia()
  .get("/", () => "Hello World")
  .use(userRoutes)
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
