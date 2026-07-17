import { useAuth } from "../contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  listMyGroups,
  createGroup,
  joinGroup,
  leaveGroup,
} from "../api/groups";
import type { Group } from "../api/groups";

export default function GroupsPage() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");

  const refreshGroups = useCallback(() => {
    if (!session) return;
    listMyGroups(session.access_token).then(setGroups).catch(console.error);
  }, [session]);

  async function onCreate() {
    if (!session) return;
    await createGroup(session.access_token, name);
    setName("");
    refreshGroups();
  }

  async function onJoin() {
    if (!session) return;
    await joinGroup(session.access_token, inviteCode);
    setInviteCode("");
    refreshGroups();
  }

  async function onLeave(groupId: number) {
    if (!session) return;
    await leaveGroup(session.access_token, groupId);
    refreshGroups();
  }

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <div className="flex gap-2">
        <input
          value={name}
          placeholder="Group name"
          onChange={(e) => setName(e.target.value)}
          className="text-black bg-white py-1 rounded border border-gray-300"
        />
        <button
          onClick={() => void onCreate()}
          className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Create Group
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={inviteCode}
          placeholder="Invite code"
          onChange={(e) => setInviteCode(e.target.value)}
          className="text-black bg-white py-1 rounded border border-gray-300"
        />
        <button
          onClick={() => void onJoin()}
          className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Join Group
        </button>
      </div>
      {groups.map((group) => (
        <div
          key={group.id}
          className="bg-white rounded-lg shadow-md p-6 mb-4 w-full max-w-md"
        >
          <h2 className="text-xl font-bold mb-2">{group.name}</h2>
          <span>Invite code: {group.invite_code}</span>
          <br />
          <span>Members: {group.member_count}</span>
          <br />
          <button
            onClick={() => void onLeave(group.id)}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-2"
          >
            Leave Group
          </button>
        </div>
      ))}
    </div>
  );
}
