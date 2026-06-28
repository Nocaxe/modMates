export type OptimiseResponse = {
  selection: Record<string, Record<string, string>>;
  score: number;
};

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function optimise(body: object): Promise<OptimiseResponse> {
  const res = await fetch(`${API_BASE}/optimise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Optimise request failed");
  return res.json() as Promise<OptimiseResponse>;
}
