import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { 
  Users as UsersIcon, Plus, Edit2, Trash2, X, 
  Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle2, Search, Power
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { User } from '../types';
import { CustomSelect, CustomMultiSelect } from '../components/CustomDropdown';
import { useAuth } from '../context/AuthContext';

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(() => sessionStorage.getItem('users_showModal') === 'true');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<User | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[] | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [entriesPerPage, setEntriesPerPage] = useState(Number(searchParams.get('limit')) || 10);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(searchParams.get('roles') ? searchParams.get('roles')!.split(',') : []);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(searchParams.get('divisions') ? searchParams.get('divisions')!.split(',') : []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (entriesPerPage !== 10) params.set('limit', String(entriesPerPage));
    if (selectedRoles.length > 0) params.set('roles', selectedRoles.join(','));
    if (selectedDivisions.length > 0) params.set('divisions', selectedDivisions.join(','));
    setSearchParams(params, { replace: true });
  }, [searchQuery, currentPage, entriesPerPage, selectedRoles, selectedDivisions, setSearchParams]);

  // Form states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Admin');
  const [division, setDivision] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const data = res.data.data ?? [];
      data.sort((a: User, b: User) => b.id - a.id);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showModal) sessionStorage.setItem('users_showModal', 'true');
    else sessionStorage.removeItem('users_showModal');
  }, [showModal]);

  const resetForm = () => {
    setFullname('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRole('Admin');
    setDivision('');
    setPhone('');
    setIsActive(true);
    setErrorMessage('');
    setFieldErrors({});
  };

  const executeSaveUser = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        fullname,
        email,
        password: password || undefined,
        role,
        division: division || null,
        phone: phone || null,
        is_active: isActive
      };

      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        resetForm();
        setShowSaveConfirmModal(false);
        setShowModal(false);
        setSaveSuccess(false);
        setCurrentPage(1); // Jump back to first page
        fetchUsers();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save user", err);
      setShowSaveConfirmModal(false);
      
      let errorMsg = "Failed to create user. Please check if email is unique.";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((e: any) => e.msg).join(', ');
        } else {
          errorMsg = err.response.data.detail;
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setErrorMessage(errorMsg);
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      fetchUsers();
      setShowDeleteConfirmModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewLogs = async (user: User) => {
    setLogsLoading(true);
    setShowLogsModal(true);
    setSelectedUserForLogs(user);
    try {
      const res = await api.get(`/users/${user.id}/logs`);
      setSelectedUserLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      setSelectedUserLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Compute available roles (capitalized) and divisions
  const roles = Array.from(new Set(users.map(u => u.role))).filter(Boolean).map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase());
  const divisions = Array.from(new Set(users.map(u => u.division))).filter(Boolean) as string[];

  // Filtering Logic
  const filtered = users.filter((u) => {
    // Multi-select filters
    if (selectedRoles.length > 0 && !selectedRoles.map(r => r.toUpperCase()).includes(u.role)) return false;
    if (selectedDivisions.length > 0 && (!u.division || !selectedDivisions.includes(u.division))) return false;

    if (!searchQuery) return true;

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
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header (Matching Active Sidebar Style) */}
        <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <UsersIcon size={18} className="text-[#DC2626]" />
            <div className="text-base font-bold text-[#18181B] tracking-wide">Cybersecurity Directory</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingUser(null);
                setFullname(''); setEmail(''); setPassword(''); setRole('Admin'); setDivision(''); setPhone('');
                setErrorMessage('');
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Plus size={13} /> Add User
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Entries Selector */}
        <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries dropdown selector */}
          <div className="flex items-center gap-2 text-sm text-[#52525B]">
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
            <span>result per page</span>
          </div>

          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#DC2626] transition-colors" size={14} />
              <input
                type="text"
                placeholder="Filter in records..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64 sm:w-80 bg-white border border-[#E4E4E7] rounded pl-9 pr-8 py-2 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <CustomMultiSelect
              label="Role"
              allLabel="All Roles"
              selectedValues={selectedRoles}
              onChange={(vals) => {
                setSelectedRoles(vals);
                setCurrentPage(1);
              }}
              options={roles}
            />
            
            <CustomMultiSelect
              label="Division"
              allLabel="All Divisions"
              selectedValues={selectedDivisions}
              onChange={(vals) => {
                setSelectedDivisions(vals);
                setCurrentPage(1);
              }}
              options={divisions}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#DC2626] text-xs font-mono animate-pulse">Loading directory database...</div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-[#F4F4F5] border-y border-[#E4E4E7]">
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#DC2626] whitespace-nowrap">User</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#DC2626] whitespace-nowrap">Department / Division</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#DC2626] whitespace-nowrap">Contact</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#DC2626] whitespace-nowrap w-24">Status</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#DC2626] whitespace-nowrap w-32">Role</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#18181B] whitespace-nowrap w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {currentUsers.map((user) => {
                  const initials = user.fullname?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || 'US';
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#F9FAFB] transition-colors bg-white border-b border-[#E4E4E7]"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={[
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-xs",
                            "w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0",
                            user.role === "Admin"
                              ? "bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]"
                              : "bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A]",
                          ].join(" ")}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-[14px] text-[#4B5563] font-semibold">{user.fullname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B5563]">{user.division || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-[#4B5563] font-medium">{user.email}</div>
                        {user.phone && <div className="text-[13px] text-[#6B7280]">{user.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active === false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border border-[#A1A1AA]/50 text-[#71717A] bg-[#F4F4F5]">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "Admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border border-[#DC2626]/30 text-[#DC2626] bg-[#DC2626]/5">
                            Admin
                          </span>
                        ) : user.role === "Supervisor" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border border-purple-500/30 text-purple-600 bg-purple-500/5">
                            Supervisor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded border border-[#E4E4E7] text-[#71717A] bg-[#F4F4F5]">
                            Staff
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingUser(user);
                              setFullname(user.fullname);
                              setEmail(user.email);
                              setRole(user.role);
                              setDivision(user.division || '');
                              setPhone(user.phone || '');
                              setIsActive(user.is_active !== undefined ? user.is_active : true);
                              setErrorMessage('');
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] rounded cursor-pointer shadow-sm transition-colors" title="Edit User">
                            <Edit2 size={15} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleViewLogs(user)}
                            className="p-1.5 bg-[#10B981] text-white hover:bg-[#059669] rounded cursor-pointer shadow-sm transition-colors" title="View User Logs">
                            <Eye size={15} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await api.patch(`/users/${user.id}`, { is_active: user.is_active === false ? true : false });
                                fetchUsers();
                              } catch (err) {
                                console.error("Failed to toggle status", err);
                              }
                            }}
                            disabled={user.id === currentUser?.id}
                            className={`p-1.5 rounded shadow-sm transition-colors ${
                              user.id === currentUser?.id
                                ? "bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed"
                                : user.is_active === false
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                                  : "bg-[#F59E0B] text-white hover:bg-[#D97706] cursor-pointer"
                            }`} 
                            title={user.is_active === false ? "Activate User" : "Deactivate User"}
                          >
                            <Power size={15} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            className={`p-1.5 rounded shadow-sm transition-colors ${
                              user.id === currentUser?.id
                                ? "bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed"
                                : "bg-[#EF4444] text-white hover:bg-[#DC2626] cursor-pointer"
                            }`} 
                            title={user.id === currentUser?.id ? "Cannot delete currently logged-in user" : "Delete User"}
                          >
                            <Trash2 size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-xs font-mono text-[#71717A]">
                      No users found.
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
      {showModal && createPortal(
        <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
          <form noValidate onSubmit={(e) => { 
            e.preventDefault(); 
            const errors: Record<string, string> = {};
            
            if (!fullname.trim()) {
              errors.fullname = "Full Name is required.";
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.email = "Please enter a valid email address.";
            }
            
            if (!editingUser && !password.trim()) {
              errors.password = "Password is required.";
            } else if (password && password.length < 6) {
              errors.password = "Password must be at least 6 characters long.";
            } else if (password && password !== confirmPassword) {
              errors.confirmPassword = "Passwords do not match.";
            }

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              return;
            }
            
            setFieldErrors({});
            setErrorMessage('');
            setShowSaveConfirmModal(true); 
          }} className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-8 py-5 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#18181B] rounded-t-2xl">
              <div>
                <div className="text-sm font-mono font-bold">{editingUser ? 'Edit User' : 'Add User'}</div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCancelConfirmModal(true)} 
                className="text-[#71717A] hover:text-[#18181B] hover:bg-[#E4E4E7] rounded transition-all p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {errorMessage && (
                <div className="col-span-1 sm:col-span-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-mono font-bold leading-relaxed">
                  {errorMessage}
                </div>
              )}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value);
                    if (fieldErrors.fullname) setFieldErrors(prev => ({ ...prev, fullname: '' }));
                  }}
                  className={`w-full bg-[#FFFFFF] border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.fullname ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                />
                {fieldErrors.fullname && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.fullname}</span>}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full bg-[#FFFFFF] border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                />
                {fieldErrors.email && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.email}</span>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUser ? "(Leave blank to keep current password)" : ""}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`w-full bg-[#FFFFFF] border rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.password}</span>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={editingUser ? "(Leave blank if not changing password)" : ""}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`w-full bg-[#FFFFFF] border rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.confirmPassword}</span>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Role</label>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val as string)}
                  options={[
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Supervisor', label: 'Supervisor' }
                  ]}
                  className="w-full h-[38px] [&>button]:h-full"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Department / Division</label>
                <input
                  type="text"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Status</label>
                <CustomSelect
                  value={isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(val) => setIsActive(val === "ACTIVE")}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' }
                  ]}
                  className="w-full h-[38px] [&>button]:h-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-5 bg-[#FAFAFA] border-t border-[#E4E4E7] rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setShowCancelConfirmModal(true)} 
                className="px-6 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting || !fullname.trim() || !email.trim() || (!password.trim() && !editingUser)}
                className="px-6 py-2.5 bg-linear-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-mono font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User')}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* User Logs Modal */}
      {showLogsModal && createPortal(
        <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-8 py-5 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#18181B] rounded-t-2xl">
              <div>
                <div className="text-sm font-mono font-bold">User Loan History</div>
                <div className="text-[10px] text-[#71717A] font-mono mt-0.5">
                  {selectedUserForLogs?.fullname}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowLogsModal(false)} 
                className="text-[#71717A] hover:text-[#18181B] hover:bg-[#E4E4E7] rounded transition-all p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {logsLoading ? (
                <div className="text-center text-[#71717A] text-xs font-mono py-8">Loading logs...</div>
              ) : selectedUserLogs && selectedUserLogs.length > 0 ? (
                <div className="space-y-4">
                  {selectedUserLogs.map((log) => (
                    <div key={log.id} className="p-4 border border-[#E4E4E7] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#18181B]">{log.asset?.name || 'Unknown Asset'}</div>
                        <div className="text-[10px] text-[#71717A] mt-1">Requested: {new Date(log.requested_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">
                          {log.status}
                        </div>
                        <div className="text-[10px] text-[#71717A] mt-1">Qty: {log.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#71717A] text-xs font-mono py-8">No loan history found for this user.</div>
              )}
            </div>
            <div className="flex justify-end gap-4 px-8 py-5 bg-[#FAFAFA] border-t border-[#E4E4E7] rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setShowLogsModal(false)} 
                className="px-6 py-2.5 bg-[#FFFFFF] hover:bg-[#FAFAFA] border border-[#E4E4E7] text-[#71717A] text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmModal && createPortal(
        <div className="fixed inset-0 z-999999 flex items-start justify-center p-4 pt-6 sm:pt-8 bg-black/45 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#F59E0B]">
              <h3 className="font-mono text-white text-base font-bold">Discard Changes?</h3>
              <button 
                onClick={() => setShowCancelConfirmModal(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                Are you sure you want to cancel? Any unsaved changes will be lost.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
              <button 
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                No, Keep Editing
              </button>
              <button 
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmModal && createPortal(
        <div className="fixed inset-0 z-999999 flex items-start justify-center p-4 pt-6 sm:pt-8 bg-black/45 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {saveSuccess ? (
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4 text-[#166534] shadow-sm">
                  <CheckCircle2 size={30} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-mono font-bold text-[#18181B] mb-1">Saved!</h3>
                <p className="text-sm font-sans text-[#71717A]">User data has been saved successfully.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 bg-[#10B981]">
                  <h3 className="font-mono text-white text-base font-bold">Confirm Save</h3>
                  <button 
                    onClick={() => setShowSaveConfirmModal(false)}
                    className="text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="px-6 py-8 text-center">
                  <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                    Are you sure you want to save {editingUser ? 'these changes' : 'this new user'}?
                  </p>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                  <button 
                    type="button"
                    onClick={() => setShowSaveConfirmModal(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={executeSaveUser}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving...' : 'Confirm Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && createPortal(
        <div className="fixed inset-0 z-999999 flex items-start justify-center p-4 pt-6 sm:pt-8 bg-black/45 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#DC2626]">
              <h3 className="font-mono text-white text-base font-bold">Delete User?</h3>
              <button 
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setUserToDelete(null);
                }}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                Are you sure you want to delete user <strong>{userToDelete?.fullname}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
              <button 
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setUserToDelete(null);
                }}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteUser}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
