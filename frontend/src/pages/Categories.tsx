import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Edit2, Trash2, X, Search, CheckCircle2, Tag, ChevronLeft, ChevronRight, Filter 
} from 'lucide-react';
import { CustomSelect, CustomMultiSelect } from '../components/CustomDropdown';
import type { Category } from '../types';

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
      isActive 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
        : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

const formatCategoryCode = (id: number) => `CAT-${String(id).padStart(3, '0')}`;

export function Categories() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewIsActive(true);
    setEditingCategory(null);
    setErrorMessage('');
    setFieldErrors({});
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const data = res.data.data ?? [];
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || 
      (statusFilter.includes('active') && cat.is_active) || 
      (statusFilter.includes('inactive') && !cat.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const paginatedItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNewName(cat.name);
    setNewDescription(cat.description || '');
    setNewIsActive(cat.is_active);
    setErrorMessage('');
    setFieldErrors({});
    setShowModal(true);
  };

  const openDeleteModal = (cat: Category) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  const executeSave = async () => {
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const payload = {
        name: newName,
        description: newDescription || "",
        is_active: newIsActive
      };
      
      await api.patch(`/categories/${editingCategory!.id}`, payload);
      showToast("Category updated successfully!", 'success');
      
      setSaveSuccess(true);
      setTimeout(() => {
        resetForm();
        setShowModal(false);
        setSaveSuccess(false);
        fetchCategories();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to save category", err);
      setSaveSuccess(false);
      if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage('An unexpected error occurred while saving the category.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEdit = () => {
    const errors: Record<string, string> = {};
    if (!newName.trim()) errors.newName = "Category name is required.";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    executeSave();
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        setDeleteSuccess(false);
        fetchCategories();
      }, 1200);
      showToast(`Category "${categoryToDelete.name}" has been deleted.`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to delete category.", 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Container Card */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header */}
        <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Tag size={18} className="text-[#DC2626]" />
            <div className="text-base font-bold text-[#18181B] tracking-wide">Category Master Data</div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, and Entries Selector */}
        <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries dropdown selector */}
          <div className="flex items-center gap-2 text-sm text-[#52525B]">
            <span>Show</span>
            <CustomSelect
              value={entriesPerPage}
              onChange={(size) => {
                setEntriesPerPage(size as number);
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: 5 },
                { value: 10, label: 10 },
                { value: 20, label: 20 },
                { value: 50, label: 50 },
              ]}
            />
            <span>result per page</span>
          </div>

          {/* Search bar & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
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
                className="w-full sm:w-80 bg-white border border-[#E4E4E7] rounded pl-9 pr-8 py-2 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <CustomMultiSelect
              label="Filter"
              allLabel="All Status"
              selectedValues={statusFilter}
              onChange={(vals) => {
                setStatusFilter(vals);
                setCurrentPage(1);
              }}
              options={['Active', 'Inactive']}
              icon={Filter}
            />
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[#F4F4F5] border-y border-[#E4E4E7]">
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">ID</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">Category Name</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap">Description</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#475569] whitespace-nowrap w-24">Status</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#18181B] whitespace-nowrap w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {paginatedItems.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F9FAFB] transition-colors bg-white border-b border-[#E4E4E7]">
                    <td className="px-6 py-4 text-[14px] text-[#4B5563] font-mono font-bold">{formatCategoryCode(cat.id)}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563] font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">{cat.description || '-'}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge isActive={cat.is_active} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <>
                            <button 
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] rounded cursor-pointer shadow-sm transition-colors" title="Edit">
                              <Edit2 size={15} strokeWidth={2.5} />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(cat)}
                              className="p-1.5 bg-[#EF4444] text-white hover:bg-[#DC2626] rounded cursor-pointer shadow-sm transition-colors" title="Delete">
                              <Trash2 size={15} strokeWidth={2.5} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] text-[#A1A1AA] font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-xs font-mono text-[#71717A]">
                      {searchQuery || statusFilter.length > 0 ? "Tidak ada kategori hasil filter." : "No categories found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 0 && (
            <div className="bg-[#FAFAFA] border-t border-[#E4E4E7] px-5 py-3 flex items-center justify-between">
              <div className="text-[10px] font-mono text-[#71717A]">
                Showing <span className="font-bold text-[#18181B]">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-bold text-[#18181B]">{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
                <span className="font-bold text-[#18181B]">{totalItems}</span> entries
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-[#E4E4E7] bg-white rounded hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={12} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white border-[#DC2626]'
                          : 'bg-white border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-[#E4E4E7] bg-white rounded hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {showModal && editingCategory && createPortal(
        <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
          <form noValidate onSubmit={(e) => { 
            e.preventDefault(); 
            confirmEdit();
          }} className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[#18181B] rounded-t-2xl">
              <div>
                <div className="text-sm font-mono font-bold">Edit Category</div>
              </div>
              <button 
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="text-[#71717A] hover:text-[#18181B] hover:bg-[#E4E4E7] rounded transition-all p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-8 grid gap-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono">
                  {errorMessage}
                </div>
              )}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 size={14} /> Saved successfully!
                </div>
              )}
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Category Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (fieldErrors.newName) setFieldErrors(prev => ({ ...prev, newName: '' }));
                  }}
                  className={`w-full bg-[#FFFFFF] border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 transition-all ${fieldErrors.newName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                  placeholder="e.g. Laptop, Monitor, etc."
                />
                {fieldErrors.newName && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.newName}</span>}
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] flex items-center justify-between mb-1.5 tracking-wider">
                  <span>Description</span>
                  <span className="text-[9px] text-[#A1A1AA] tracking-normal normal-case italic">Optional</span>
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                  placeholder="Brief description of this category"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Status</label>
                <select
                  value={newIsActive ? 'true' : 'false'}
                  onChange={(e) => setNewIsActive(e.target.value === 'true')}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-5 bg-[#FAFAFA] border-t border-[#E4E4E7] rounded-b-2xl">
              <button 
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="px-6 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!newName.trim()}
                className="px-6 py-2.5 bg-linear-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-mono font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && createPortal(
        <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 bg-black/45 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {deleteSuccess ? (
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-4 text-[#166534] shadow-sm">
                  <CheckCircle2 size={30} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-mono font-bold text-[#18181B] mb-1">Deleted!</h3>
                <p className="text-sm font-sans text-[#71717A]">Category has been removed.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 bg-[#DC2626]">
                  <h3 className="font-mono text-white text-base font-bold">Confirm Deletion</h3>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="px-6 py-8 text-center">
                  <p className="text-sm font-mono text-[#3F3F46] leading-relaxed">
                    Are you sure you want to delete <strong className="text-[#DC2626]">{categoryToDelete.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                  <button 
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#6B7280] hover:bg-[#4B5563] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Global Toast Notification */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-999999 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border ${
            toast.type === 'success' 
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' 
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}>
            <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
              {toast.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <X size={16} strokeWidth={3} />
              )}
            </div>
            <p className="text-sm font-sans font-medium pr-2">{toast.message}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
