export type RankedSolution = {
  selection: Record<string, Record<string, string>>;
  score: number;
};

export type GroupMember = {
  name: string;
  ranked_selections: Record<string, Record<string, string>>[];
};

export type OptimiseResponse = {
  solutions: RankedSolution[];
};

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function optimise(body: {
  modules: object[];
  selection: Record<string, Record<string, string>>;
  locked: string[];
  skipped?: string[];
  constraints: object[];
  group_members?: GroupMember[];
}): Promise<OptimiseResponse> {
  const res = await fetch(`${API_BASE}/optimise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Optimise request failed");
  return res.json() as Promise<OptimiseResponse>;
}
