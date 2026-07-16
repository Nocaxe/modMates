import {useAuth} from "../contexts/AuthContext";
import {useEffect, useState} from "react";
import {listMyGroups} from "../api/groups";
import type {Group} from "../api/groups";

export default function GroupsPage() {
    const {session} = useAuth()
    const [groups, setGroups] = useState<Group[]>([])

    useEffect(() => {
        if (!session) return

        listMyGroups(session.access_token)
            .then(setGroups)
            .catch(console.error)
    }, [session])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                {groups.map((group) => (
                    <div key={group.id} className="bg-white rounded-lg shadow-md p-6 mb-4 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-2">{group.name}</h2>
                        <span>Invite code: {group.invite_code}</span>
                        <span>Members: {group.member_count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}