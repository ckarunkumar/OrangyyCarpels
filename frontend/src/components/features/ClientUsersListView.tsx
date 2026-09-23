import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Mail, Phone, FolderGit2, Pencil, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  const [deletingUser, setDeletingUser] = useState<ClientUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/client-users/${deletingUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client user');
      setToast(`Client user "${deletingUser.name}" deleted successfully.`);
      setDeletingUser(null);
      fetchUsers();
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting client user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientId === 'all' || u.clientId === selectedClientId;
    return matchesSearch && matchesClient;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Active') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Can Login') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Cannot Login') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <>
      <ClientUserModal open={modalOpen} user={editingUser} clients={clients} onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-studio-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-studio-text">Delete Client User</h3>
                <p className="text-[12px] text-studio-muted">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-[12.5px] text-studio-text leading-relaxed">
              Are you sure you want to delete client user <span className="font-bold text-studio-text">{deletingUser.name}</span> ({deletingUser.id})? Their login access and project assignments will be removed. Client and project business records will remain unaffected.
            </p>
            <div className="pt-3 border-t border-studio-border flex justify-end gap-2.5">
              <button type="button" onClick={() => setDeletingUser(null)} disabled={isDeleting} className="px-4 py-2 border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar cursor-pointer">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete User'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {toast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{toast}</span></div>
            <button onClick={() => setToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Search by name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white" />
            </div>
            <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="px-3 py-1.5 border border-studio-border rounded-lg text-[12px] text-studio-text focus:outline-none focus:border-brand-orange bg-white">
              <option value="all">All Clients</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.displayName || c.name}</option>))}
            </select>
          </div>

          {isAdmin && (
            <button type="button" onClick={handleOpenAdd} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange text-white rounded-lg text-[12px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer shrink-0">
              <Plus className="w-4 h-4" /> Add Client User
            </button>
          )}
        </div>

        <div className="border border-studio-border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-studio-sidebar border-b border-studio-border px-5 py-2.5 text-[10px] font-bold text-studio-muted uppercase tracking-wider grid grid-cols-12 gap-3 items-center">
            <div className="col-span-1">User ID</div>
            <div className="col-span-2">Full Name</div>
            <div className="col-span-2">Email Address</div>
            <div className="col-span-2">Mobile / Phone</div>
            <div className="col-span-2">Client Name</div>
            <div className="col-span-1">Assigned</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
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
                    <div className="col-span-1">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-studio-sidebar border border-studio-border text-studio-text block w-fit">
                        {u.id}
                      </span>
                    </div>

                    <div className="col-span-2 min-w-0 pr-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-brand-orange border border-orange-200 shrink-0 font-bold text-[10px]">
                        {u.name[0]}
                      </div>
                      <span className="font-semibold text-studio-text truncate">{u.name}</span>
                    </div>

                    <div className="col-span-2 text-studio-muted text-[11.5px] truncate flex items-center gap-1.5" title={u.email}>
                      <Mail className="w-3.5 h-3.5 shrink-0 text-studio-muted/70" />
                      <span className="truncate">{u.email}</span>
                    </div>

                    <div className="col-span-2 text-studio-muted text-[11.5px] truncate flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-studio-muted/70" />
                      <span className="truncate">{u.phone || '—'}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 text-[12px] font-medium text-studio-text truncate">
                      <Building2 className="w-3.5 h-3.5 text-studio-muted shrink-0" />
                      <span className="truncate">{u.client?.displayName || u.client?.name || u.clientId}</span>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold border ${assignedCount > 0 ? 'bg-orange-50 border-orange-200 text-brand-orange' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        <FolderGit2 className="w-2.5 h-2.5" />
                        <span>{assignedCount}</span>
                      </span>
                    </div>

                    <div className="col-span-1">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border inline-block ${getStatusBadge(u.status)}`}>
                        {u.status}
                      </span>
                    </div>

                    <div className="col-span-1 text-right flex items-center justify-end gap-1">
                      {isAdmin && (
                        <>
                          <button type="button" onClick={() => handleOpenEdit(u)} title="Edit Client User" className="p-1 hover:bg-studio-sidebar rounded text-studio-muted hover:text-brand-orange cursor-pointer transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => setDeletingUser(u)} title="Delete Client User" className="p-1 hover:bg-red-50 rounded text-studio-muted hover:text-red-600 cursor-pointer transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
