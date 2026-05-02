// @vitest-environment node
import { describe, it, expect } from "vitest";
import { POST } from "@/app/share-target/route";

describe("share-target route handler", () => {
  it("returns a 303 redirect to / on POST", async () => {
    const response = await POST();

    expect(response.status).toBe(303);
    const location = response.headers.get("location");
    expect(location).toBeDefined();
    expect(new URL(location!).pathname).toBe("/");
  });

  it("uses NEXT_PUBLIC_BASE_URL when set", async () => {
    const original = process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";

    try {
      const response = await POST();
      const location = response.headers.get("location");
      expect(location).toBe("https://example.com/");
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_BASE_URL = original;
      }
    }
  });

  it("falls back to localhost when NEXT_PUBLIC_BASE_URL is unset", async () => {
    const original = process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;

    try {
      const response = await POST();
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    } finally {
      if (original !== undefined) {
        process.env.NEXT_PUBLIC_BASE_URL = original;
      }
    }
  });
});
