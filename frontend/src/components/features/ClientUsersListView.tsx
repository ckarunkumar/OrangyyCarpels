import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Client, ClientUser } from '../../types/registry';
import ClientUserModal from './ClientUserModal';
import DeleteClientUserModal from './DeleteClientUserModal';
import ClientUserRow from './ClientUserRow';
import { useSearch } from '../../context/SearchContext';

interface ClientUsersListViewProps {
  clients: Client[];
  isAdmin: boolean;
  selectedClientId?: string;
  openAddModal?: boolean;
  onCloseAddModal?: () => void;
}

export default function ClientUsersListView({
  clients,
  isAdmin,
  selectedClientId = 'all',
  openAddModal,
  onCloseAddModal,
}: ClientUsersListViewProps) {
  const { searchQuery } = useSearch();
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (openAddModal) {
      setEditingUser(null);
      setModalOpen(true);
    }
  }, [openAddModal]);

  const handleCloseModal = () => {
    setModalOpen(false);
    if (onCloseAddModal) onCloseAddModal();
  };

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
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.client?.name && u.client.name.toLowerCase().includes(q)) ||
      (u.client?.displayName && u.client.displayName.toLowerCase().includes(q));
    const matchesClient = selectedClientId === 'all' || u.clientId === selectedClientId;
    return matchesSearch && matchesClient;
  });

  return (
    <>
      <ClientUserModal open={modalOpen} user={editingUser} clients={clients} defaultClientId={selectedClientId !== 'all' ? selectedClientId : undefined} onClose={handleCloseModal} onSaved={handleSaved} />
      <DeleteClientUserModal user={deletingUser} isDeleting={isDeleting} onCancel={() => setDeletingUser(null)} onConfirm={confirmDelete} />

      <div className="space-y-4">
        {toast && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-[12.5px] font-semibold animate-in fade-in shadow-2xs">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><span>{toast}</span></div>
            <button onClick={() => setToast(null)} className="text-green-600 hover:text-green-800 text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

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
              <div className="text-center py-8 text-[12px] text-studio-muted">{searchQuery ? `No client users matching "${searchQuery}"` : 'No external client users registered.'}</div>
            ) : (
              filteredUsers.map((u) => (
                <ClientUserRow
                  key={u.id}
                  user={u}
                  isAdmin={isAdmin}
                  onEdit={(user) => { setEditingUser(user); setModalOpen(true); }}
                  onDelete={(user) => setDeletingUser(user)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
