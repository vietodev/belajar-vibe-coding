import { describe, expect, it } from "bun:test";
import { app } from "./helpers";

describe("GET / (Root Endpoint)", () => {
  it("mengembalikan status 200 OK dengan response body 'Hello World'", async () => {
    const response = await app.handle(
      new Request("http://localhost/")
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe("Hello World");
  });
});
