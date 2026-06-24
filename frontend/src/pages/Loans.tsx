import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Check, CheckCircle, X, Plus,
  ChevronLeft, ChevronRight, ShieldCheck, Calendar, Eye,
  ArrowLeftRight, Search
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SearchableSelect, CustomMultiSelect, CustomSelect } from '../components/CustomDropdown';

export function Loans() {
  const { isAdmin } = useAuth();
  const [showRecordModal, setShowRecordModal] = useState(() => sessionStorage.getItem('loans_showRecordModal') === 'true');
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  
  // Form State
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerDivision, setBorrowerDivision] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState(''); // Deskripsi / Alasan
  const [quantity, setQuantity] = useState<number>(1);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Search & Pagination States (Admin View)
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [entriesPerPage, setEntriesPerPage] = useState(Number(searchParams.get('limit')) || 10);
  const [adminTab, setAdminTab] = useState(searchParams.get('tab') || 'active');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(searchParams.get('statuses') ? searchParams.get('statuses')!.split(',') : []);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(searchParams.get('divisions') ? searchParams.get('divisions')!.split(',') : []);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any | null>(null);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (entriesPerPage !== 10) params.set('limit', String(entriesPerPage));
    if (adminTab !== 'active') params.set('tab', adminTab);
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
    if (selectedDivisions.length > 0) params.set('divisions', selectedDivisions.join(','));
    setSearchParams(params, { replace: true });
  }, [searchQuery, currentPage, entriesPerPage, adminTab, selectedStatuses, selectedDivisions, setSearchParams]);

  useEffect(() => {
    if (showRecordModal) sessionStorage.setItem('loans_showRecordModal', 'true');
    else sessionStorage.removeItem('loans_showRecordModal');
  }, [showRecordModal]);

  const steps = ["Borrower Info", "Asset & Time", "Review & Submit"];

  const fetchData = async () => {
    try {
      const [assetsRes, loansRes] = await Promise.all([
        api.get('/assets'),
        api.get('/loans')
      ]);
      setAssets(assetsRes.data.data ?? []);
      const loansData = loansRes.data.data ?? [];
      loansData.sort((a: any, b: any) => b.id - a.id);
      setLoans(loansData);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/loans/${id}`, { status: 'ACTIVE' });
      await fetchData();
    } catch (e) {
      console.error("Failed to approve loan", e);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/loans/${id}`, { status: 'REJECTED' });
      await fetchData();
    } catch (e) {
      console.error("Failed to reject loan", e);
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await api.patch(`/loans/${id}`, { status: 'RETURNED' });
      await fetchData();
    } catch (e: any) {
      console.error("Failed to return loan", e);
      alert("Failed to return loan: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const serializedPurpose = JSON.stringify({
        borrower_name: borrowerName,
        borrower_division: borrowerDivision,
        borrower_phone: borrowerPhone,
        borrower_email: borrowerEmail || 'N/A',
        loan_date: loanDate,
        return_date: expectedReturnDate,
        reason: purpose
      });

      await api.post('/loans', { 
        asset_id: parseInt(selectedAssetId), 
        purpose: serializedPurpose,
        quantity: quantity
      });

      setSuccess(true);
      setStep(1);
      setBorrowerName('');
      setBorrowerDivision('');
      setBorrowerPhone('');
      setBorrowerEmail('');
      setSelectedAssetId('');
      setLoanDate(new Date().toISOString().split('T')[0]);
      setExpectedReturnDate('');
      setPurpose('');
      setQuantity(1);
      setShowRecordModal(false);
      setFieldErrors({});
      
      setCurrentPage(1); // Jump back to first page
      setTimeout(() => setSuccess(false), 5000);
      await fetchData();
    } catch (e) {
      console.error("Failed to submit request", e);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovals = loans.filter(l => l.status === 'PENDING' || l.status === 'REQUESTED');

  // Helper parser for structured purpose data
  const parseLoanPurpose = (loan: any) => {
    try {
      if (loan.purpose && loan.purpose.startsWith('{')) {
        return JSON.parse(loan.purpose);
      }
    } catch (e) {
      // fallback
    }
    return {
      borrower_name: `USR-${loan.user_id}`,
      borrower_division: 'Cyber Division',
      borrower_phone: 'N/A',
      borrower_email: 'N/A',
      loan_date: new Date(loan.requested_at).toLocaleDateString(),
      return_date: 'N/A',
      reason: loan.purpose || 'No purpose stated'
    };
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.name : `AST-${assetId}`;
  };

  // Admin Tabs Logic
  const getTabLoans = () => {
    switch (adminTab) {
      case "active":
        return loans.filter(l => l.status === 'ACTIVE');
      case "overdue":
        return loans.filter(l => l.status === 'OVERDUE');
      case "history":
        return loans.filter(l => ['RETURNED', 'REJECTED'].includes(l.status));
      default:
        return [];
    }
  };

  const baseAdminLoans = getTabLoans();

  // Compute statuses based on tab, and divisions from ALL loans
  let statuses: string[] = [];
  if (adminTab === 'history') statuses = ['Returned', 'Rejected'];
  else if (adminTab === 'active') statuses = ['Active'];
  else if (adminTab === 'overdue') statuses = ['Overdue'];
  
  const divisions = Array.from(new Set(loans.map(l => parseLoanPurpose(l).borrower_division))).filter(Boolean);

  const filteredAdminLoans = baseAdminLoans.filter((loan) => {
    const details = parseLoanPurpose(loan);
    const assetName = getAssetName(loan.asset_id);
    
    // Multi-select filters
    if (selectedStatuses.length > 0 && !selectedStatuses.map(s => s.toUpperCase()).includes(loan.status)) return false;
    if (selectedDivisions.length > 0 && !selectedDivisions.includes(details.borrower_division)) return false;

    if (!searchQuery) return true;

    return (
      loan.id.toString().includes(searchQuery) ||
      loan.asset_id.toString().includes(searchQuery) ||
      assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.borrower_division.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination Calculation
  const totalItems = filteredAdminLoans.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const indexOfLastLoan = currentPage * entriesPerPage;
  const indexOfFirstLoan = indexOfLastLoan - entriesPerPage;
  const currentLoans = filteredAdminLoans.slice(indexOfFirstLoan, indexOfLastLoan);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Success Alert Banner */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-mono font-semibold text-emerald-700">
            Loan successfully recorded and is now active.
          </span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header */}
        <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight size={18} className="text-[#DC2626]" />
            <div className="text-base font-bold text-[#18181B] tracking-wide">Loan Management Console</div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setStep(1);
                  setShowRecordModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Record Loan
              </button>
            </div>
          )}
        </div>

          <div className="flex flex-col h-full bg-[#FAFAFA]">
            {/* Sub-menu Tabs */}
            <div className="flex border-b border-[#E4E4E7] bg-[#FCFCFC] px-6 gap-6 shrink-0">
              {[
                { id: "active", label: "Active Loans", count: loans.filter(l => l.status === "ACTIVE").length },
                { id: "approval", label: "Approval Board", count: pendingApprovals.length },
                { id: "overdue", label: "Overdue", count: loans.filter(l => l.status === "OVERDUE").length },
                { id: "history", label: "History", count: loans.filter(l => ["RETURNED", "REJECTED"].includes(l.status)).length },
              ].map((tab) => {
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAdminTab(tab.id);
                      setSelectedStatuses([]);
                      setSelectedDivisions([]);
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className={`py-3 px-1 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive 
                        ? "border-[#DC2626] text-[#DC2626]" 
                        : "border-transparent text-[#71717A] hover:text-[#18181B]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      tab.count > 0
                        ? "bg-[#DC2626] text-white shadow-sm"
                        : isActive 
                          ? "bg-[#DC2626] text-white" 
                          : "bg-[#E4E4E7] text-[#52525B]"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {adminTab === "approval" ? (
                /* Approval Board View */
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingApprovals.map((req) => {
                      const details = parseLoanPurpose(req);
                      return (
                        <div key={req.id} className="bg-white border border-[#E4E4E7] rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
                          <div>
                            <div className="flex items-center justify-between mb-3 border-b border-[#E4E4E7]/40 pb-2.5">
                              <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">REQ-{req.id}</span>
                              <span className="text-[10px] font-mono text-[#71717A]">{new Date(req.requested_at).toLocaleDateString()}</span>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#71717A]">Peminjam:</span>
                                <span className="font-bold text-[#18181B]">{details.borrower_name}</span>
                              </div>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#71717A]">Divisi:</span>
                                <span className="font-bold text-[#52525B]">{details.borrower_division}</span>
                              </div>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#71717A]">Kontak:</span>
                                <span className="font-bold text-[#52525B]">{details.borrower_phone}</span>
                              </div>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#71717A]">Perangkat:</span>
                                <span className="font-bold text-[#DC2626]">{getAssetName(req.asset_id)} (Qty: {req.quantity})</span>
                              </div>
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-[#71717A]">Masa Pinjam:</span>
                                <span className="font-bold text-amber-600">{details.loan_date} to {details.return_date}</span>
                              </div>
                              <div className="text-xs font-mono border-t border-[#E4E4E7]/40 pt-2.5">
                                <span className="text-[#71717A] block mb-1 text-[10px] uppercase tracking-wider">Alasan Peminjaman</span>
                                <p className="text-[#18181B] italic bg-[#FAFAFA] p-2.5 rounded border border-[#E4E4E7]/50">"{details.reason || 'Tidak ada alasan'}"</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E4E4E7] text-[#71717A] text-[10px] font-mono font-bold rounded-lg hover:bg-[#FAFAFA] transition-all cursor-pointer"
                            >
                              <X size={11} /> Reject
                            </button>
                            <button 
                              onClick={() => handleApprove(req.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#16A34A]/10 hover:bg-[#16A34A]/20 border border-[#16A34A]/25 text-[#16A34A] text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer"
                            >
                              <Check size={11} /> Approve
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {pendingApprovals.length === 0 && (
                      <div className="col-span-full bg-[#FFFFFF] border border-dashed border-[#E4E4E7] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                        <ShieldCheck size={32} className="text-emerald-500 mb-3" />
                        <h3 className="text-sm font-bold text-[#18181B] font-mono">Queue Cleared</h3>
                        <p className="text-xs font-mono text-[#71717A] mt-1">No pending loan requests require review.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Data Table View for Active/Overdue/History */
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                          { value: 50, label: 50 }
                        ]}
                      />
                      <span>result per page</span>
                    </div>
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
                      
                      <CustomMultiSelect
                        label="Status"
                        allLabel="All Statuses"
                        selectedValues={selectedStatuses}
                        onChange={(vals) => {
                          setSelectedStatuses(vals);
                          setCurrentPage(1);
                        }}
                        options={statuses}
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

                  {/* Table Wrapper */}
                  <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-auto max-h-[500px] relative">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="bg-[#F4F4F5] border-y border-[#E4E4E7]">
                            {["Loan ID", "Asset Name", "Qty", "Borrower", "Division", "Loan Period", "Status", "Actions"].map((h) => (
                              <th key={h} className={`sticky top-0 bg-[#F4F4F5] z-10 text-left px-5 py-4 text-[14px] font-semibold whitespace-nowrap ${h === 'Actions' ? 'text-[#18181B]' : 'text-[#DC2626]'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4E4E7]/60">
                          {currentLoans.map((loan) => {
                            const details = parseLoanPurpose(loan);
                            return (
                              <tr key={loan.id} className="hover:bg-[#F9FAFB] transition-colors bg-white border-b border-[#E4E4E7]">
                                <td className="px-5 py-4 text-[14px] text-[#4B5563] whitespace-nowrap">LN-{loan.id}</td>
                                <td className="px-5 py-4 text-[14px] text-[#4B5563]">{getAssetName(loan.asset_id)}</td>
                                <td className="px-5 py-4 text-[14px] text-[#4B5563]">{loan.quantity}</td>
                                <td className="px-5 py-4 text-[14px] text-[#4B5563]">{details.borrower_name}</td>
                                <td className="px-5 py-4 text-[14px] text-[#4B5563]">{details.borrower_division}</td>
                                <td className="px-5 py-4 text-[14px] text-[#4B5563] whitespace-nowrap">{details.loan_date} - {details.return_date}</td>
                                <td className="px-5 py-4">
                                  {loan.status === 'OVERDUE' ? (
                                    <span className="text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 px-2 py-0.5 rounded whitespace-nowrap animate-pulse">
                                      Overdue
                                    </span>
                                  ) : loan.status === 'ACTIVE' ? (
                                    <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded whitespace-nowrap">
                                      Active
                                    </span>
                                  ) : loan.status === 'RETURNED' ? (
                                    <span className="text-xs font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2 py-0.5 rounded whitespace-nowrap">
                                      Returned
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] px-2 py-0.5 rounded uppercase">
                                      {loan.status}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setSelectedLoanDetails(loan)}
                                      className="p-1.5 bg-[#10B981] text-white hover:bg-[#059669] rounded transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                                      title="View Details"
                                    >
                                      <Eye size={15} strokeWidth={2.5} className="shrink-0" />
                                    </button>
                                    {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                                      <button 
                                        onClick={() => handleReturn(loan.id)}
                                        className="p-1.5 bg-[#3B82F6] text-white hover:bg-[#2563EB] rounded transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                                        title="Mark as Returned"
                                      >
                                        <CheckCircle size={15} strokeWidth={2.5} className="shrink-0" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredAdminLoans.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-5 py-12 text-center text-xs font-mono text-[#71717A]">
                                No loans found matching the criteria.
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
                          Showing <span className="font-bold text-[#18181B]">{indexOfFirstLoan + 1}</span> to{' '}
                          <span className="font-bold text-[#18181B]">{Math.min(indexOfLastLoan, totalItems)}</span> of{' '}
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
              )}
            </div>
          </div>
      </div>


      {/* Record Loan Modal */}
      {showRecordModal && createPortal(
        <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-8 py-5 flex items-center justify-between text-[#18181B] rounded-t-2xl shrink-0">
              <div>
                <h3 className="text-sm font-bold font-mono">Record New Loan</h3>
              </div>
              <button 
                onClick={() => setShowCancelConfirmModal(true)}
                className="p-1 hover:bg-[#E4E4E7] rounded transition-all cursor-pointer text-[#71717A] hover:text-[#18181B]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Step Tracker Wizard */}
              <div className="flex items-center justify-between px-2 mb-6">
                {steps.map((label, i) => {
                  const s = i + 1;
                  const done = step > s;
                  const active = step === s;
                  return (
                    <div key={label} className="flex-1 flex items-center last:flex-initial">
                      <div className="flex items-center gap-2">
                        <div className={[
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all duration-300",
                          done ? "bg-emerald-50 border-emerald-300 text-emerald-600 shadow-sm"
                            : active ? "bg-[#DC2626]/10 border-[#DC2626]/40 text-[#DC2626] shadow-sm"
                            : "bg-[#F4F4F5] border-[#E4E4E7] text-[#71717A]",
                        ].join(" ")}>
                          {done ? <Check size={12} className="stroke-3" /> : s}
                        </div>
                        <span className={[
                          "text-[10px] font-mono font-bold hidden sm:block",
                          active ? "text-[#18181B]" : "text-[#71717A]"
                        ].join(" ")}>{label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-4 ${done ? "bg-emerald-300" : "bg-[#E4E4E7]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Form Card */}
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-6 flex flex-col relative z-10 min-h-[480px]">
                <div className="grow space-y-5">
                
                {/* Step 1: Borrower Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Name</label>
                        <input 
                          type="text" 
                          value={borrowerName}
                          onChange={(e) => {
                            setBorrowerName(e.target.value);
                            if (fieldErrors.borrowerName) setFieldErrors(prev => ({ ...prev, borrowerName: '' }));
                          }}
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 placeholder-[#A1A1AA] transition-all ${fieldErrors.borrowerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`} 
                        />
                        {fieldErrors.borrowerName && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.borrowerName}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Phone Number</label>
                        <input 
                          type="text" 
                          value={borrowerPhone}
                          onChange={(e) => {
                            setBorrowerPhone(e.target.value);
                            if (fieldErrors.borrowerPhone) setFieldErrors(prev => ({ ...prev, borrowerPhone: '' }));
                          }}
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 placeholder-[#A1A1AA] transition-all ${fieldErrors.borrowerPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`} 
                        />
                        {fieldErrors.borrowerPhone && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.borrowerPhone}</span>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Division</label>
                      <input 
                        type="text" 
                        value={borrowerDivision}
                        onChange={(e) => {
                          setBorrowerDivision(e.target.value);
                          if (fieldErrors.borrowerDivision) setFieldErrors(prev => ({ ...prev, borrowerDivision: '' }));
                        }}
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 placeholder-[#A1A1AA] transition-all ${fieldErrors.borrowerDivision ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`} 
                      />
                      {fieldErrors.borrowerDivision && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.borrowerDivision}</span>}
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Email (Optional)</label>
                      <input 
                        type="email" 
                        value={borrowerEmail}
                        onChange={(e) => {
                          setBorrowerEmail(e.target.value);
                          if (fieldErrors.borrowerEmail) setFieldErrors(prev => ({ ...prev, borrowerEmail: '' }));
                        }}
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 placeholder-[#A1A1AA] transition-all ${fieldErrors.borrowerEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`} 
                      />
                      {fieldErrors.borrowerEmail && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.borrowerEmail}</span>}
                    </div>
                  </div>
                )}

                {/* Step 2: Asset & Time Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Asset to Borrow</label>
                        <SearchableSelect
                          value={selectedAssetId}
                          onChange={(val) => {
                            setSelectedAssetId(val as string);
                            if (fieldErrors.selectedAssetId) setFieldErrors(prev => ({ ...prev, selectedAssetId: '' }));
                          }}
                          placeholder="Select available device..."
                          options={assets
                            .filter((a) => (a.available_quantity ?? a.quantity) > 0 && a.status !== 'LOST' && a.status !== 'MISSING')
                            .map((a) => {
                              const isBroken = a.status === 'MAINTENANCE';
                              return {
                                value: String(a.id),
                                label: `${a.name} (AST-${a.id})${a.serial_number ? ` - ${a.serial_number}` : ''}`,
                                badgeText: isBroken ? '[Broken/Maintenance]' : `Available: ${a.available_quantity ?? a.quantity}`,
                                badgeColor: isBroken ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'
                              };
                            })
                          }
                          className={fieldErrors.selectedAssetId ? '[&>button]:border-red-500' : ''}
                        />
                        {fieldErrors.selectedAssetId && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.selectedAssetId}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Quantity to Borrow</label>
                        <input 
                          type="number" 
                          min="1"
                          max={selectedAssetId ? (assets.find(a => a.id === parseInt(selectedAssetId))?.available_quantity ?? assets.find(a => a.id === parseInt(selectedAssetId))?.quantity) : 1}
                          value={quantity}
                          onChange={(e) => {
                            setQuantity(parseInt(e.target.value) || 1);
                            if (fieldErrors.quantity) setFieldErrors(prev => ({ ...prev, quantity: '' }));
                          }}
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 transition-all ${fieldErrors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`} 
                        />
                        {fieldErrors.quantity && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.quantity}</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Loan Date</label>
                        <CustomDatePicker 
                          value={loanDate} 
                          onChange={(val) => {
                            setLoanDate(val);
                            if (fieldErrors.loanDate) setFieldErrors(prev => ({ ...prev, loanDate: '' }));
                          }} 
                        />
                        {fieldErrors.loanDate && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.loanDate}</span>}
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Return Date</label>
                        <CustomDatePicker 
                          value={expectedReturnDate} 
                          onChange={(val) => {
                            setExpectedReturnDate(val);
                            if (fieldErrors.expectedReturnDate) setFieldErrors(prev => ({ ...prev, expectedReturnDate: '' }));
                          }} 
                          minDate={loanDate}
                        />
                        {fieldErrors.expectedReturnDate && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.expectedReturnDate}</span>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Description (Reason for Loan)</label>
                      <textarea
                        rows={8}
                        value={purpose}
                        onChange={(e) => {
                          setPurpose(e.target.value);
                          if (fieldErrors.purpose) setFieldErrors(prev => ({ ...prev, purpose: '' }));
                        }}
                        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 transition-all ${fieldErrors.purpose ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#E4E4E7] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}`}
                      />
                      {fieldErrors.purpose && <span className="text-red-500 text-[10px] font-mono mt-1 block">{fieldErrors.purpose}</span>}
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-2 uppercase border-b border-[#E4E4E7] pb-1.5">Review Loan Details</div>
                    {[
                      ["Borrower Name", borrowerName],
                      ["Borrower Division", borrowerDivision],
                      ["Borrower Phone", borrowerPhone],
                      ["Borrower Email", borrowerEmail || "N/A"],
                      ["Selected Asset", getAssetName(parseInt(selectedAssetId))],
                      ["Quantity", quantity],
                      ["Loan Date", loanDate],
                      ["Return Date", expectedReturnDate],
                      ["Reason / Description", purpose],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 border-b border-[#E4E4E7]/40 last:border-0 text-xs">
                        <span className="text-[10px] text-[#71717A] font-mono shrink-0">{k}</span>
                        <span className="text-[10px] text-[#18181B] font-mono font-bold text-right max-w-[280px] leading-tight truncate" title={v}>{v}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                      <CheckCircle size={13} className="text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-mono text-blue-700 leading-relaxed">
                        Notice: Asset check-out acts as a digital receipt. Please make sure to return the asset when it is no longer needed.
                      </p>
                    </div>
                  </div>
                )}

                </div>

                {/* Wizard Buttons */}
                <div className="flex justify-end gap-3 pt-5 mt-auto border-t border-[#E4E4E7]/60">
                  {step > 1 && (
                    <button 
                      onClick={() => setStep((s) => s - 1)} 
                      className="px-5 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (step === 1) {
                        const errors: Record<string, string> = {};
                        if (!borrowerName.trim()) errors.borrowerName = "Borrower Name is required.";
                        if (!borrowerPhone.trim()) errors.borrowerPhone = "Borrower Phone is required.";
                        if (!borrowerDivision.trim()) errors.borrowerDivision = "Borrower Division is required.";
                        if (borrowerEmail) {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(borrowerEmail)) {
                            errors.borrowerEmail = "Please enter a valid email address.";
                          }
                        }
                        if (Object.keys(errors).length > 0) {
                          setFieldErrors(errors);
                          return;
                        }
                        setFieldErrors({});
                        setStep(2);
                      } else if (step === 2) {
                        const errors: Record<string, string> = {};
                        if (!selectedAssetId) errors.selectedAssetId = "Asset is required.";
                        if (!quantity || quantity < 1) errors.quantity = "Quantity must be at least 1.";
                        if (!loanDate) errors.loanDate = "Loan Date is required.";
                        if (!expectedReturnDate) errors.expectedReturnDate = "Return Date is required.";
                        if (!purpose.trim()) errors.purpose = "Description is required.";
                        
                        if (Object.keys(errors).length > 0) {
                          setFieldErrors(errors);
                          return;
                        }
                        setFieldErrors({});
                        setStep(3);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={submitting}
                    className={`px-8 py-2.5 text-white text-xs font-mono font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                      step === 3 
                        ? "bg-linear-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857]" 
                        : "bg-linear-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8]"
                    }`}
                  >
                    {step === 3 ? (submitting ? "Saving..." : "Record Loan") : "Next →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}

      {/* Detail Loan Modal */}
      {selectedLoanDetails && createPortal((() => {
        const details = parseLoanPurpose(selectedLoanDetails);
        return (
          <div className="fixed inset-0 z-99999 flex items-start justify-center p-4 pt-2 sm:pt-4 overflow-y-auto bg-black/45 animate-in fade-in duration-200">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-[#FAFAFA] border-b border-[#E4E4E7] px-8 py-5 flex items-center justify-between text-[#18181B] rounded-t-2xl">
                <div>
                  <h3 className="text-sm font-bold font-mono">Loan Details LN-{selectedLoanDetails.id}</h3>
                  <p className="text-[10px] text-[#71717A] font-mono mt-0.5">
                    Loan Period: {details.loan_date} to {details.return_date}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLoanDetails(null)}
                  className="p-1 hover:bg-[#E4E4E7] rounded transition-all cursor-pointer text-[#71717A] hover:text-[#18181B]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-5">
                
                {/* Status Badge */}
                <div className="flex justify-between items-center border-b border-[#E4E4E7]/60 pb-3">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider">CURRENT STATUS</span>
                  {selectedLoanDetails.status === 'OVERDUE' ? (
                    <span className="text-[10px] font-mono text-[#DC2626] font-bold bg-[#DC2626]/10 border border-[#DC2626]/20 px-2.5 py-1 rounded-full animate-pulse">
                      Overdue
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#16A34A]/10 border border-[#16A34A]/20 px-2.5 py-1 rounded-full">
                      Active / Borrowed
                    </span>
                  )}
                </div>

                {/* Section: Borrower Information */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Borrower Information</h4>
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Full Name:</span>
                      <span className="font-bold text-[#18181B]">{details.borrower_name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Division / Unit:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_division}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Phone Number:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_phone}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Email Address:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_email}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Asset Information */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Asset Information</h4>
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Asset Name:</span>
                      <span className="font-bold text-[#DC2626]">{getAssetName(selectedLoanDetails.asset_id)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Borrow Quantity:</span>
                      <span className="font-bold text-[#DC2626]">{selectedLoanDetails.quantity}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Asset ID Code:</span>
                      <span className="font-bold text-[#52525B]">AST-{selectedLoanDetails.asset_id}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Purpose/Reason */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-1.5">Loan Reason / Description</h4>
                  <p className="text-xs font-mono text-[#18181B] bg-amber-50/40 border border-amber-200/60 p-3 rounded-xl italic leading-relaxed">
                    "{details.reason || 'No reason provided.'}"
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-5 bg-[#FAFAFA] border-t border-[#E4E4E7] flex justify-end gap-4 rounded-b-2xl">
                <button 
                  onClick={() => setSelectedLoanDetails(null)}
                  className="px-4 py-2 bg-white border border-[#E4E4E7] text-[#52525B] text-xs font-mono font-bold rounded-lg hover:bg-[#F4F4F5] transition-all cursor-pointer shadow-sm"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })(), document.body)}

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
                  setShowRecordModal(false);
                  setStep(1);
                  setBorrowerName('');
                  setBorrowerDivision('');
                  setBorrowerPhone('');
                  setBorrowerEmail('');
                  setSelectedAssetId('');
                  setExpectedReturnDate('');
                  setPurpose('');
                  setQuantity(1);
                  setFieldErrors({});
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
    </div>
  );
}

export function CustomDatePicker({ 
  value, 
  onChange, 
  minDate,
  openUp = false
}: { 
  value: string; 
  onChange: (val: string) => void; 
  minDate?: string;
  openUp?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDaysInMonth = () => {
    const days = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, prevMonthTotalDays - i)
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i)
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, i)
      });
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const handleSelectDay = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isBeforeMin = (date: Date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    return target < min;
  };

  return (
    <div className={`relative ${isOpen ? 'z-9999' : ''}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-[#E4E4E7] rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-[#18181B] focus-within:border-[#DC2626] transition-all cursor-pointer flex items-center justify-between min-h-[38px] shadow-sm select-none"
      >
        <span>{value ? formatDisplayDate(value) : "Select Date..."}</span>
        <Calendar size={14} className="text-[#71717A]" />
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 sm:right-auto sm:w-[280px] ${openUp ? 'bottom-full mb-2.5' : 'mt-2.5'} bg-white border border-[#E4E4E7] rounded-xl shadow-xl p-4 z-50 animate-in fade-in ${openUp ? 'slide-in-from-bottom-1' : 'slide-in-from-top-1'} duration-200`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold font-mono text-[#18181B]">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div className="flex gap-1.5">
              <button 
                type="button"
                onClick={prevMonth}
                className="p-1 rounded hover:bg-[#F4F4F5] text-[#71717A] cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-[#F4F4F5] text-[#71717A] cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {weekdayNames.map((w, idx) => (
              <span key={idx} className="text-[10px] font-bold font-mono text-[#A1A1AA] py-0.5">{w}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              const disabled = isBeforeMin(item.date);
              const selected = isSelected(item.date);
              const today = isToday(item.date);
              
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => handleSelectDay(e, item.date)}
                  className={[
                    "aspect-square text-[10px] font-mono rounded-md flex items-center justify-center transition-all cursor-pointer",
                    selected 
                      ? "bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white font-bold"
                      : disabled
                        ? "text-[#E4E4E7] cursor-not-allowed opacity-40"
                        : !item.isCurrentMonth
                          ? "text-[#D4D4D8] hover:bg-[#F4F4F5]"
                          : today
                            ? "border border-[#DC2626] text-[#DC2626] font-bold hover:bg-[#DC2626]/5"
                            : "text-[#52525B] hover:bg-[#F4F4F5]"
                  ].join(" ")}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer controls */}
          <div className="flex justify-between border-t border-[#E4E4E7] mt-3.5 pt-2.5 text-[9px] font-mono">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
              className="text-red-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={(e) => handleSelectDay(e, new Date())}
              className="text-[#71717A] hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
