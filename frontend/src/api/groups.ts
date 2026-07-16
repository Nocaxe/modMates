export type Group = {
    id: number;
    name: string;
    owner_id: string
    invite_code: string
    created_at: string
    member_count: number;
};

export type GroupMemberInfo = {
    user_id: string;
    email: string;
    joined_at: string;
};

export type OptimiserGroupMember = {
    name: string;
    ranked_selections: Record<string, Record<string, string>>[];
};

const API_BASE = import.meta.env.VITE_API_URL as string;

export async function createGroup(accessToken: string, name:string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name })
    });
    if (!response.ok) {
        throw new Error('Failed to create group');
    }
    return response.json() as Promise<Group>;
}