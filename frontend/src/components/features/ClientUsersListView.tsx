import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Mail, Phone, FolderGit2, Pencil, CheckCircle2 } from 'lucide-react';
import { Client, ClientUser } from '../../types/registry';
import ClientUserModal from './ClientUserModal';

interface ClientUsersListViewProps {
  clients: Client[];
  isAdmin: boolean;
}

export default function ClientUsersListView({ clients, isAdmin }: ClientUsersListViewProps) {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/client-users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUsers(data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenAdd = () => { setEditingUser(null); setModalOpen(true); };
  const handleOpenEdit = (u: ClientUser) => { setEditingUser(u); setModalOpen(true); };

  const handleSaved = (msg: string) => {
    setToast(msg);
    fetchUsers();
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientId === 'all' || u.clientId === selectedClientId;
    return matchesSearch && matchesClient;
  });

  return (
    <>
      <ClientUserModal open={modalOpen} user={editingUser} clients={clients} onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <div className="space-y-4">
        {toast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{toast}</span></div>
            <button onClick={() => setToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search client users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white"
              />
            </div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.displayName || c.name}</option>))}
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Client User
            </button>
          )}
        </div>

        {/* Client Users Table */}
        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">User ID / Username</div>
            <div className="col-span-3">Full Name</div>
            <div className="col-span-2">Contact Details</div>
            <div className="col-span-2">Company / Client</div>
            <div className="col-span-2">Permitted Projects</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          <div className="divide-y divide-studio-border bg-white">
            {loading ? (
              <div className="py-8 text-center text-[12px] text-studio-muted animate-pulse">Loading client users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-studio-muted">No external client users found.</div>
            ) : (
              filteredUsers.map((u) => {
                const assignedCount = u.projects?.length || 0;
                return (
                  <div key={u.id} className="group px-5 py-3 grid grid-cols-12 gap-3 text-[12.5px] items-center hover:bg-studio-hover/40 transition-colors">
                    <div className="col-span-2">
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text block w-fit mb-0.5">
                        {u.id}
                      </span>
                      <span className="text-[11px] text-studio-muted block">@{u.username}</span>
                    </div>

                    <div className="col-span-3 min-w-0 pr-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-brand-orange border border-orange-200 shrink-0 font-bold text-[11px]">
                        {u.name[0]}
                      </div>
                      <span className="font-semibold text-studio-text truncate">{u.name}</span>
                    </div>

                    <div className="col-span-2 text-studio-muted text-[11.5px] space-y-0.5 truncate">
                      <div className="flex items-center gap-1.5 truncate" title={u.email}><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{u.email}</span></div>
                      {u.phone && <div className="flex items-center gap-1.5 truncate" title={u.phone}><Phone className="w-3.5 h-3.5 shrink-0" /><span>{u.phone}</span></div>}
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 text-[12px] font-medium text-studio-text truncate">
                      <Building2 className="w-3.5 h-3.5 text-studio-muted shrink-0" />
                      <span className="truncate">{u.client?.displayName || u.client?.name || u.clientId}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${assignedCount > 0 ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        <FolderGit2 className="w-3 h-3" />
                        <span>{assignedCount} {assignedCount === 1 ? 'Project' : 'Projects'}</span>
                      </span>
                    </div>

                    <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                      {isAdmin && (
                        <button type="button" onClick={() => handleOpenEdit(u)} title="Edit Client User" className="opacity-0 group-hover:opacity-100 p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-opacity">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${u.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
