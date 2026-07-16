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

export async function listMyGroups(accessToken: string): Promise<Group[]> {
    const response = await fetch(`${API_BASE}/groups`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });     
    if (!response.ok) {
        throw new Error('Failed to fetch groups');
    }
    return response.json() as Promise<Group[]>;
}

export async function joinGroup(accessToken: string, inviteCode: string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ invite_code: inviteCode })
    });
    if (!response.ok) {
        throw new Error('Failed to join group');
    }
    return response.json() as Promise<Group>;
}