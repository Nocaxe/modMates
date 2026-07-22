import { expect, it, vi } from "vitest";
import { jointOptimise, batchSaveTimetables } from "../groups";

// jointOptimise

it("jointOptimise sends a POST request to /optimise/joint with Bearer auth and group_id", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solutions: [] }),
    }),
  );

  await jointOptimise("my-token", 42);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/optimise/joint"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer my-token" },
      body: JSON.stringify({ group_id: 42 }),
    },
  );
});

it("jointOptimise returns the parsed response", async () => {
  const mockResponse = { solutions: [{ members: [] }] };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }),
  );

  const result = await jointOptimise("my-token", 1);

  expect(result).toEqual(mockResponse);
});

it("jointOptimise throws with the error detail when the response is not ok", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Hard constraints conflict" }),
    }),
  );

  await expect(jointOptimise("my-token", 1)).rejects.toThrow(
    "Hard constraints conflict",
  );
});

it("jointOptimise throws a fallback message when the error body cannot be parsed", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    }),
  );

  await expect(jointOptimise("my-token", 1)).rejects.toThrow(
    "Joint optimisation failed",
  );
});

// batchSaveTimetables

it("batchSaveTimetables sends a PUT request to /timetable/batch with Bearer auth and body", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  const updates = [{ user_id: "user-a", selection: { CS2040S: { Lecture: "01" } } }];

  await batchSaveTimetables("my-token", 42, updates);

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/timetable/batch"),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer my-token" },
      body: JSON.stringify({ group_id: 42, updates }),
    },
  );
});

it("batchSaveTimetables resolves without a value on success", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

  await expect(batchSaveTimetables("my-token", 1, [])).resolves.toBeUndefined();
});

it("batchSaveTimetables throws when the response is not ok", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  await expect(batchSaveTimetables("my-token", 1, [])).rejects.toThrow(
    "Failed to apply joint timetable",
  );
});
