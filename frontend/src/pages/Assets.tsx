import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Download, Edit2, Trash2, X, 
  Search, ChevronLeft, ChevronRight, SlidersHorizontal 
} from 'lucide-react';
import type { Asset } from '../types';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BORROWED:  "bg-blue-50 text-blue-700 border-blue-200",
    MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
    MISSING: "bg-red-50 text-red-700 border-red-200",
    LOST: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    AVAILABLE: "Available", 
    BORROWED: "Borrowed",
    MAINTENANCE: "Maintenance", 
    MISSING: "Missing", 
    LOST: "Lost",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${cfg[status] ?? cfg.AVAILABLE}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function Assets() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('available');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Modal form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Extract dynamic categories list from seeded data
  const categories = ["all", ...Array.from(new Set(assets.map(a => a.category).filter(Boolean)))];

  // Filtering Logic
  const filtered = assets.filter((asset) => {
    let matchesStatus = false;
    if (statusFilter === 'available') {
      matchesStatus = asset.status === 'AVAILABLE';
    } else if (statusFilter === 'borrowed') {
      matchesStatus = asset.status === 'BORROWED';
    } else if (statusFilter === 'maintenance') {
      matchesStatus = asset.status === 'MAINTENANCE';
    } else if (statusFilter === 'lost') {
      matchesStatus = asset.status === 'LOST';
    }

    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toString().includes(searchQuery) ||
      (asset.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (asset.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
   });

  // Pagination Calculation
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  
  // Adjust current page if out of bounds (e.g. after search filters narrow down the list)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const indexOfLastAsset = currentPage * entriesPerPage;
  const indexOfFirstAsset = indexOfLastAsset - entriesPerPage;
  const currentAssets = filtered.slice(indexOfFirstAsset, indexOfLastAsset);

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/assets', {
        name: newName,
        category: newCategory || "Uncategorized",
        serial_number: newSerialNumber || null,
        description: newDescription || ""
      });
      setNewName('');
      setNewCategory('');
      setNewSerialNumber('');
      setNewDescription('');
      setShowModal(false);
      fetchAssets();
    } catch (err) {
      console.error("Failed to save asset", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Asset ID", "Asset Name", "Category", "Serial Number", "Description", "Status", "Created At"];
    const rows = filtered.map(a => [
      `AST-${a.id}`,
      a.name,
      a.category || "",
      a.serial_number || "",
      a.description || "",
      a.status,
      a.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asset_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Main Asset Container Card */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header (Matching Active Sidebar Style) */}
        <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-base font-bold text-white tracking-wide">Asset Inventory Registry</div>
            <div className="text-xs text-[#FEF2F2]/90 font-mono mt-1">
              {assets.length} assets registered · {assets.filter(a => a.status === "AVAILABLE").length} available for checkout
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Download size={13} /> Export CSV
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/95 text-[#DC2626] border border-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Add New Asset
              </button>
            )}
          </div>
        </div>

        {/* Sub-menu Tabs */}
        <div className="flex border-b border-[#E4E4E7] bg-[#FCFCFC] px-6 gap-6 shrink-0">
          {[
            { id: "available", label: "Available Assets", count: assets.filter(a => a.status === "AVAILABLE").length },
            { id: "borrowed", label: "Borrowed Assets", count: assets.filter(a => a.status === "BORROWED").length },
            { id: "maintenance", label: "Maintenance", count: assets.filter(a => a.status === "MAINTENANCE").length },
            { id: "lost", label: "Lost & Missing", count: assets.filter(a => a.status === "LOST").length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-3 px-1 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? "border-[#DC2626] text-[#DC2626]" 
                    : "border-transparent text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-[#DC2626]/10 text-[#DC2626]" : "bg-[#F4F4F5] text-[#71717A]"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Filters, and Entries Selector */}
        <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries dropdown selector */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#52525B]">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#E4E4E7] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#18181B] focus:outline-none focus:border-[#DC2626] cursor-pointer"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          {/* Search bar & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search name, ID, desc..."
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

            {/* Category Select Filter */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} className="text-[#71717A]" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs font-mono text-[#52525B] focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#DC2626] text-xs font-mono animate-pulse">Loading assets data feed...</div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5]">
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider w-24">Asset ID</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Asset Name</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Category</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Serial Number</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider">Description</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider w-24">Status</th>
                  <th className="text-left px-6 py-3.5 text-[10px] font-mono font-bold text-[#71717A] tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {currentAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-[#DC2626]">
                      AST-{asset.id}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-bold text-[#18181B]">
                      {asset.name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-mono text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 rounded border border-[#E4E4E7]">
                        {asset.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-[#52525B] whitespace-nowrap">
                      {asset.serial_number || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono text-[#52525B] max-w-[220px] truncate" title={asset.description}>
                      {asset.description || '-'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {isAdmin ? (
                          <>
                            <button className="p-1.5 text-[#71717A] hover:text-[#0891B2] hover:bg-cyan-500/10 rounded transition-all cursor-pointer" title="Edit Asset">
                              <Edit2 size={11} />
                            </button>
                            <button className="p-1.5 text-[#71717A] hover:text-[#DC2626] hover:bg-red-500/10 rounded transition-all cursor-pointer" title="Delete Asset">
                              <Trash2 size={11} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] text-[#A1A1AA] font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-xs font-mono text-[#71717A]">
                      No assets match the search criteria.
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
              Showing <span className="font-bold text-[#18181B]">{totalItems === 0 ? 0 : indexOfFirstAsset + 1}</span> to{' '}
              <span className="font-bold text-[#18181B]">{Math.min(indexOfLastAsset, totalItems)}</span> of{' '}
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

      {/* Add Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveAsset} className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7]">
              <div>
                <div className="text-sm font-mono font-bold text-[#18181B]">Add New Asset</div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="text-[#71717A] hover:text-[#18181B] transition-colors p-1"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro 16\"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Laptop, Network, Token"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-LENOVO-T14-001"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Description</label>
                <textarea
                  placeholder="e.g. Incident Response Forensic Machine"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="flex-1 py-2.5 bg-[#FFFFFF] hover:bg-[#FAFAFA] border border-[#E4E4E7] text-[#71717A] text-xs font-mono font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting || !newName.trim()}
                className="flex-1 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Asset'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
