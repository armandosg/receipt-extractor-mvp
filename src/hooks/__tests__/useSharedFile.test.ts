import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSharedFile } from "@/hooks/useSharedFile";

/**
 * Build a minimal mock Cache object backed by a Map.
 * @returns An object implementing the Cache interface with jest mock functions.
 */
function createMockCache() {
  const store = new Map<string, Response>();
  return {
    store,
    match: vi.fn(async (key: string) => store.get(key) ?? undefined),
    put: vi.fn(async (key: string, response: Response) => {
      store.set(key, response);
    }),
    delete: vi.fn(async (key: string) => store.delete(key)),
  };
}

describe("useSharedFile", () => {
  let mockCache: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    mockCache = createMockCache();

    // Mock the global caches API
    vi.stubGlobal("caches", {
      open: vi.fn(async () => mockCache),
    });
  });

  it("returns the shared file and clears the cache entry", async () => {
    const fileContent = new Blob(["receipt-data"], { type: "image/png" });
    mockCache.store.set(
      "/shared-receipt",
      new Response(fileContent, {
        headers: {
          "Content-Type": "image/png",
          "X-File-Name": "photo.png",
        },
      }),
    );

    const { result } = renderHook(() => useSharedFile());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.sharedFile).not.toBeNull();
    expect(result.current.sharedFile!.name).toBe("photo.png");
    expect(result.current.sharedFile!.type).toBe("image/png");
    expect(mockCache.delete).toHaveBeenCalledWith("/shared-receipt");
  });

  it("returns null when no shared file exists", async () => {
    const { result } = renderHook(() => useSharedFile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.sharedFile).toBeNull();
    expect(mockCache.delete).not.toHaveBeenCalled();
  });

  it("uses fallback name when X-File-Name header is missing", async () => {
    const fileContent = new Blob(["data"], { type: "application/pdf" });
    mockCache.store.set(
      "/shared-receipt",
      new Response(fileContent, {
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    const { result } = renderHook(() => useSharedFile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.sharedFile!.name).toBe("shared-receipt");
  });
});
