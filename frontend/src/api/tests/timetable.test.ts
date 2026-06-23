import { expect, it, vi } from "vitest";
import { getTimetable, saveTimetable } from "../timetable";

it("getTimetable calls the correct endpoint with a bearer token", async () => {
  const mockData = {
    selection: { CS2103T: { Lecture: "1" } },
    locked: ["CS2103T|Lecture"],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }),
  );

  const result = await getTimetable("my-token");

  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/timetable"), {
    headers: { Authorization: "Bearer my-token" },
  });
  expect(result).toEqual(mockData);
});

it("getTimetable throws when the response is not ok", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  await expect(getTimetable("my-token")).rejects.toThrow(
    "Failed to fetch timetable data",
  );
});

it("saveTimetable sends a PUT request with the correct headers and body", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  const data = { selection: { CS2103T: { Lecture: "1" } }, locked: [] };

  await saveTimetable("my-token", data);

  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/timetable"), {
    method: "PUT",
    headers: {
      Authorization: "Bearer my-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
});

it("saveTimetable resolves without a value on success", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  const data = { selection: {}, locked: [] };
  await expect(saveTimetable("my-token", data)).resolves.toBeUndefined();
});
