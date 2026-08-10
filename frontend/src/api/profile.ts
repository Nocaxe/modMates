export type Profile = {
  user_id: string;
  email: string;
  display_name: string | null;
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

export async function updateProfile(
  accessToken: string,
  display_name: string | null,
): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ display_name }),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  return response.json() as Promise<Profile>;
}
