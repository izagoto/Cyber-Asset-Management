import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Plus, Edit2, Eye, Trash2, X, 
  Search, ChevronLeft, ChevronRight 
} from 'lucide-react';
import type { User } from '../types';
import { CustomSelect } from '../components/CustomDropdown';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Form states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [division, setDivision] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await api.post('/users', {
        fullname,
        email,
        password,
        role,
        division: division || null,
        phone: phone || null,
        is_active: true
      });
      setFullname('');
      setEmail('');
      setPassword('');
      setRole('USER');
      setDivision('');
      setPhone('');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Failed to save user", err);
      setErrorMessage(err.response?.data?.detail || err.response?.data?.message || "Failed to create user. Please check if email is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering Logic
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.division || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone || '').includes(searchQuery) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination Calculation
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const indexOfLastUser = currentPage * entriesPerPage;
  const indexOfFirstUser = indexOfLastUser - entriesPerPage;
  const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Card Container */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header (Matching Active Sidebar Style) */}
        <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-base font-bold text-white tracking-wide">User Directory Management</div>
            <div className="text-xs text-[#FEF2F2]/90 font-mono mt-1">
              {users.length} registered users · {users.filter(u => u.role === "ADMIN").length} administrators
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setErrorMessage('');
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/95 text-[#DC2626] border border-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Plus size={13} /> Add New User
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Entries Selector */}
        <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries dropdown selector */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#52525B]">
            <span>Show</span>
            <CustomSelect
              value={entriesPerPage}
              onChange={(size) => {
                setEntriesPerPage(size);
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: 5 },
                { value: 10, label: 10 },
                { value: 20, label: 20 },
                { value: 50, label: 50 }
              ]}
            />
            <span>entries</span>
          </div>

          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search user name, email, role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-48 sm:w-56 bg-white border border-[#E4E4E7] rounded-lg pl-8 pr-8 py-1.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#DC2626] text-xs font-mono animate-pulse">Loading directory database...</div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5]">
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">User</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Department / Division</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider w-32">Role</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {currentUsers.map((user) => {
                  const initials = user.fullname?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || 'US';
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={[
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 shadow-xs",
                            user.role === "ADMIN"
                              ? "bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]"
                              : "bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A]",
                          ].join(" ")}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#18181B]">{user.fullname}</div>
                            <div className="text-[10px] font-mono text-[#71717A] mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-[#52525B]">
                        {user.division || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-[#71717A]">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-3.5">
                        {user.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded border border-[#DC2626]/30 text-[#DC2626] bg-[#DC2626]/5">
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold rounded border border-[#E4E4E7] text-[#71717A] bg-[#F4F4F5]">
                            BORROWER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 text-[#71717A] hover:text-[#0891B2] hover:bg-cyan-500/10 rounded transition-all cursor-pointer" title="Edit User">
                            <Edit2 size={11} />
                          </button>
                          <button className="p-1.5 text-[#71717A] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded transition-all cursor-pointer" title="View User Logs">
                            <Eye size={11} />
                          </button>
                          <button className="p-1.5 text-[#71717A] hover:text-[#DC2626] hover:bg-red-500/10 rounded transition-all cursor-pointer" title="Delete User">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-xs font-mono text-[#71717A]">
                      No users match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div className="bg-[#FAFAFA] border-t border-[#E4E4E7] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs font-mono text-[#71717A]">
              Showing <span className="font-bold text-[#18181B]">{totalItems === 0 ? 0 : indexOfFirstUser + 1}</span> to{' '}
              <span className="font-bold text-[#18181B]">{Math.min(indexOfLastUser, totalItems)}</span> of{' '}
              <span className="font-bold text-[#18181B]">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-1.5 border border-[#E4E4E7] bg-white rounded-lg hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white border-[#DC2626] shadow-sm'
                        : 'bg-white border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-1.5 border border-[#E4E4E7] bg-white rounded-lg hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveUser} className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white">
              <div>
                <div className="text-sm font-mono font-bold">Add New User</div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 rounded transition-all p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-mono font-bold leading-relaxed">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@cybersec.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] cursor-pointer"
                >
                  <option value="USER">Borrower</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Department / Division</label>
                <input
                  type="text"
                  placeholder="e.g. Incident Response, Cyber Defense"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +62 812-XXXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-[#FAFAFA] border-t border-[#E4E4E7]">
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="flex-1 py-2.5 bg-[#FFFFFF] hover:bg-[#FAFAFA] border border-[#E4E4E7] text-[#71717A] text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting || !fullname.trim() || !email.trim() || password.trim().length < 6}
                className="flex-1 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
