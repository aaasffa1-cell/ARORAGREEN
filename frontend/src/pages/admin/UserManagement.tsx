import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { UserCheck, Search, ShieldAlert, UserX, CheckCircle, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    api.admin
      .getUsers(searchQuery)
      .then((res) => setUsers(res.users || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  const handleToggleSuspend = async (user: any) => {
    const action = user.is_suspended ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} account: ${user.email}?`)) return;

    try {
      await api.admin.suspendUser(user.id, !user.is_suspended);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to modify account state.');
    }
  };

  const handleDeleteUser = async (user: any) => {
    const confirmPrompt = `Are you sure you want to PERMANENTLY DELETE user account:\n\nEmail: ${user.email}\nName: ${user.display_name || 'Player'}\n\nWARNING: This will permanently remove this user and their associated squads/registrations from the Neon database!`;
    if (!window.confirm(confirmPrompt)) return;

    setDeletingUserId(user.id);
    try {
      await api.admin.deleteUser(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest mb-1">
            <UserCheck className="w-4 h-4 text-cyan" />
            <span>ACCOUNT DIRECTORY &amp; PRIVILEGES</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold uppercase text-icewhite">
            User Account Management
          </h1>
          <p className="text-xs text-subtext mt-1">
            Search registered accounts, view roles, and suspend malicious players or rule breakers.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search email, name, IGN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-midnight border border-aroraborder rounded-lg pl-9 pr-3 py-2 text-xs text-icewhite placeholder-subtext focus:outline-none focus:border-cyan"
          />
          <Search className="w-4 h-4 text-subtext absolute left-3 top-2.5" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-subtext">Loading user directory...</div>
      ) : users.length > 0 ? (
        <div className="bg-deepteal/30 border border-aroraborder rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight/70 text-subtext uppercase font-mono tracking-wider border-b border-aroraborder">
                <tr>
                  <th className="py-3 px-4">Account / Email</th>
                  <th className="py-3 px-4">In-Game Details</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aroraborder/50 text-subtext">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-midnight/40">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-icewhite block">{u.display_name || 'Player'}</span>
                      <span className="text-[11px] font-mono text-gray-400">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {u.free_fire_ign ? (
                        <>
                          <span className="text-cyan block">{u.free_fire_ign}</span>
                          <span className="text-[10px] text-subtext">UID: {u.free_fire_uid || '-'}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Unconfigured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || ['Player']).map((role: string) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              role === 'Admin'
                                ? 'bg-neongreen/20 text-neongreen border border-neongreen/40'
                                : 'bg-deepteal text-cyan border border-aroraborder'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {u.registrations_count} Regs • {u.squads_count} Squads
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_suspended ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-mono">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-neongreen border border-neongreen/40 text-[10px] font-mono">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                            u.is_suspended
                              ? 'bg-emerald-950 border border-neongreen text-neongreen hover:bg-emerald-900/40'
                              : 'bg-amber-950 border border-amber-500/50 text-amber-300 hover:bg-amber-900/40'
                          }`}
                        >
                          {u.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={deletingUserId === u.id}
                          className="px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors bg-rose-950/80 border border-rose-500/60 text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 flex items-center gap-1"
                          title="Permanently Delete User from Neon DB"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>{deletingUserId === u.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-deepteal/20 border border-aroraborder rounded-xl text-subtext text-xs">
          No user accounts found matching your search term.
        </div>
      )}
    </div>
  );
};
