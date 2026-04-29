import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./auth";

export default function Members() {
  const { token } = useAuth();
  const users = useQuery(api.users.list, { token });

  if (users === undefined) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Members</h2>
      <ul className="divide-y">
        {users.map((u) => (
          <li key={u._id} className="py-2">
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-600">{u.email}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
