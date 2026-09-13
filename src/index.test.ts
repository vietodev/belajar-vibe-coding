import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

describe("Elysia App", () => {
  it("returns 'Hello World' on GET /", async () => {
    const app = new Elysia().get("/", () => "Hello World");
    const response = await app.handle(new Request("http://localhost/")).then((res) => res.text());
    expect(response).toBe("Hello World");
  });
});
