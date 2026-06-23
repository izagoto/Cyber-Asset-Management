import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Shield, Edit2, Eye, Trash2 } from 'lucide-react';
import type { User } from '../types';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>

          <div className="text-[10px] text-[#71717A] font-mono mt-0.5">
            {users.length} registered users · {users.filter(u => u.role === "ADMIN").length} admins
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] hover:bg-[#DC2626]/80 shadow-sm text-[#FFFFFF] text-xs font-mono font-semibold rounded-lg transition-all">
          <Plus size={13} /> Add User
        </button>
      </div>

      <div className="bg-[#FFFFFF]  shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#DC2626] text-xs font-mono animate-pulse">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className=" bg-[#F4F4F5]">
                  {["User", "Department", "Contact", "Role", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-mono font-bold text-[#71717A] tracking-[0.12em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const initials = user.fullname?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || 'US';
                  return (
                    <tr key={user.id} className={`hover:bg-[#FAFAFA] transition-colors ${i < users.length - 1 ? "" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={[
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
                            user.role === "ADMIN"
                              ? "bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]"
                              : "bg-[#F4F4F5]  text-[#71717A]",
                          ].join(" ")}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-mono text-[#18181B] font-medium">{user.fullname}</div>
                            <div className="text-[9px] font-mono text-[#71717A] mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-mono text-[#52525B]">{user.division || '-'}</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-[#71717A]">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        {user.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-bold rounded border border-[#DC2626]/40 text-[#DC2626] bg-[#DC2626]/10">
                            <Shield size={8} /> ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-bold rounded  text-[#71717A] bg-[#F4F4F5]">
                            BORROWER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-[#71717A] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded transition-all"><Edit2 size={11} /></button>
                          <button className="p-1.5 text-[#71717A] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded transition-all"><Eye size={11} /></button>
                          <button className="p-1.5 text-[#71717A] hover:text-[#DC2626] hover:bg-[#DC2626]/10 rounded transition-all"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[11px] font-mono text-[#71717A]">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
