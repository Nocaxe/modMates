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