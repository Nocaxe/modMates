import { expect, it, vi } from "vitest";
import { optimise } from "../optimise";

const MOCK_BODY = {
  modules: [{ code: "CS2040S", title: "DSA", lessons: {} }],
  selection: { CS2040S: { Lecture: "1" } },
  locked: ["CS2040S|Lecture"],
  constraints: [],
};

const MOCK_RESPONSE = {
  selection: { CS2040S: { Lecture: "1" } },
  score: 1.0,
};

it("optimise sends a POST request to /optimise", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    }),
  );

  await optimise(MOCK_BODY);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/optimise"),
    expect.objectContaining({ method: "POST" }),
  );
});

it("optimise sends Content-Type: application/json header", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    }),
  );

  await optimise(MOCK_BODY);

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: { "Content-Type": "application/json" },
    }),
  );
});

it("optimise serialises the body as JSON", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    }),
  );

  await optimise(MOCK_BODY);

  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ body: JSON.stringify(MOCK_BODY) }),
  );
});

it("optimise returns the parsed response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    }),
  );

  const result = await optimise(MOCK_BODY);

  expect(result).toEqual(MOCK_RESPONSE);
});

it("optimise throws when the response is not ok", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  await expect(optimise(MOCK_BODY)).rejects.toThrow("Optimise request failed");
});
