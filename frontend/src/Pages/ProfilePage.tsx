import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { updateProfile } from "../api/profile";
import { listMyGroups } from "../api/groups";
import type { Group } from "../api/groups";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const { session } = useAuth();
  const { profile, rawDisplayName, refreshProfile } = useProfile();
  const navigate = useNavigate();

  // Section 2: display name editor
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const displayedNameInput: string =
    nameInput !== null ? nameInput : rawDisplayName;

  async function handleSaveDisplayName() {
    if (!session) return;
    setNameSaving(true);
    setNameMessage(null);
    try {
      await updateProfile(
        session.access_token,
        displayedNameInput.trim() || null,
      );
      refreshProfile();
      setNameInput(null);
      setNameMessage("Display name saved.");
    } catch {
      setNameMessage("Failed to save display name.");
    } finally {
      setNameSaving(false);
    }
  }

  // Section 3: groups
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    if (!session) return;
    listMyGroups(session.access_token).then(setGroups).catch(console.error);
  }, [session]);

  // Section 4: change password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPwMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage("Password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPwMessage("Password changed successfully.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change password.";
      setPwMessage(msg);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {/* Email */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Email</h2>
        <p className="text-gray-300">{profile?.email ?? "—"}</p>
      </section>

      {/* Display name */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Display name</h2>
        <p className="text-sm text-gray-400">
          Shown in group tabs. Defaults to your email if unset.
        </p>
        <input
          value={displayedNameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder={profile?.email ?? "Your display name"}
          className="text-black bg-white py-1 px-2 rounded border border-gray-300"
        />
        <button
          onClick={() => void handleSaveDisplayName()}
          disabled={nameSaving}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 disabled:opacity-50 w-fit"
        >
          {nameSaving ? "Saving…" : "Save"}
        </button>
        {nameMessage && <p className="text-sm text-gray-300">{nameMessage}</p>}
      </section>

      {/* Groups */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">My groups</h2>
        {groups.length === 0 && (
          <p className="text-gray-400 text-sm">
            You are not in any groups yet.
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => void navigate(`/groups/${g.id}`)}
                className="text-blue-400 hover:underline text-sm text-left"
              >
                {g.name}
              </button>
              <span className="text-gray-400 text-sm">
                {" "}
                — {g.member_count} member(s)
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Change password */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="text-black bg-white py-1 px-2 rounded border border-gray-300"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="text-black bg-white py-1 px-2 rounded border border-gray-300"
        />
        <button
          onClick={() => void handleChangePassword()}
          disabled={pwSaving}
          className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 disabled:opacity-50 w-fit"
        >
          {pwSaving ? "Changing…" : "Change password"}
        </button>
        {pwMessage && <p className="text-sm text-gray-300">{pwMessage}</p>}
      </section>
    </div>
  );
}
