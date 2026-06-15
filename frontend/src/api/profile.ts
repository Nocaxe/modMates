export type Profile = {
  user_id: string;
  email: string;
};

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function getProfile(accessToken: string): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Failed to get profile");
  }
  return response.json() as Promise<Profile>;
}
