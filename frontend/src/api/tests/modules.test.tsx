import { expect, it, vi } from "vitest";
import { searchModules } from "../modules";

it("searchModules calls the correct endpoint and returns encoded query", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ moduleCode: "CS2040S", title: "Data Structures and Algorithms" }]),
    }));

    await searchModules("CS2040S");

    expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/modules/search?query=CS2040S"),
    );
});

it("searchModules returns the parsed JSON data when response is ok", async () => {
    const mockData = [{ moduleCode: "CS2040S", title: "Data Structures and Algorithms" }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
    }));
    const result = await searchModules("CS2040S");
    expect(result).toEqual(mockData);
});

it("searchModules throws an error when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(searchModules("CS2040S")).rejects.toThrow(
        "Failed to search modules",
    );
});