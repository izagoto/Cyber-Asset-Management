import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Check, CheckCircle, X, Search, 
  ChevronLeft, ChevronRight, ShieldCheck, Calendar, Eye
} from 'lucide-react';

export function Loans() {
  const { isAdmin } = useAuth();
  const [view, setView] = useState<"admin" | "request">(isAdmin ? "admin" : "request");
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
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Search & Pagination States (Admin View)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any | null>(null);

  const steps = ["Borrower Info", "Asset & Time", "Review & Submit"];

  const fetchData = async () => {
    try {
      const [assetsRes, loansRes] = await Promise.all([
        api.get('/assets'),
        api.get('/loans')
      ]);
      setAssets(assetsRes.data.data ?? []);
      setLoans(loansRes.data.data ?? []);
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
    } catch (e) {
      console.error("Failed to return loan", e);
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
        purpose: serializedPurpose
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
      
      setTimeout(() => setSuccess(false), 5000);
      await fetchData();
    } catch (e) {
      console.error("Failed to submit request", e);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovals = loans.filter(l => l.status === 'PENDING' || l.status === 'REQUESTED');
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');

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

  // Filtering Logic for Admin View Active Table
  const filteredActiveLoans = activeLoans.filter((loan) => {
    const details = parseLoanPurpose(loan);
    const assetName = getAssetName(loan.asset_id);
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
  const totalItems = filteredActiveLoans.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, entriesPerPage, totalPages, currentPage]);

  const indexOfLastLoan = currentPage * entriesPerPage;
  const indexOfFirstLoan = indexOfLastLoan - entriesPerPage;
  const currentLoans = filteredActiveLoans.slice(indexOfFirstLoan, indexOfLastLoan);

  // Form Validation per Step
  const isStep1Valid = borrowerName.trim() !== '' && borrowerDivision.trim() !== '' && borrowerPhone.trim() !== '';
  const isStep2Valid = selectedAssetId !== '' && loanDate !== '' && expectedReturnDate !== '' && purpose.trim() !== '';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Success Alert Banner */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-mono font-semibold text-emerald-700">
            Peminjaman berhasil diajukan! Menunggu persetujuan admin siber.
          </span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col">
        
        {/* Card Header */}
        <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-base font-bold text-white tracking-wide">Loan Tracking System</div>
            <div className="text-xs text-[#FEF2F2]/90 font-mono mt-1">
              {pendingApprovals.length} pending · {activeLoans.length} active · {activeLoans.filter(l => l.status === 'OVERDUE').length} overdue
            </div>
          </div>
          {isAdmin && (
            <div className="flex bg-white/10 border border-white/20 rounded-lg p-1 gap-1 shrink-0">
              <button
                onClick={() => setView("request")}
                className={`px-4.5 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                  view === "request" 
                    ? "bg-white text-[#DC2626] shadow-sm" 
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                Request Form
              </button>
              <button
                onClick={() => setView("admin")}
                className={`px-4.5 py-1.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 relative ${
                  view === "admin" 
                    ? "bg-white text-[#DC2626] shadow-sm" 
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>Approval Board</span>
                {pendingApprovals.length > 0 && (
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-extrabold shadow-sm animate-pulse shrink-0 ${
                    view === "admin" 
                      ? "bg-[#DC2626] text-white" 
                      : "bg-white text-[#DC2626]"
                  }`}>
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* View Rendering */}
        {view === "request" ? (
          <div className="p-6">
            <div className="max-w-xl mx-auto py-4 space-y-6">
              
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
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-6 space-y-5">
                
                {/* Step 1: Borrower Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Borrower's Full Name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] placeholder-[#A1A1AA] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Division</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Cyber Defense, IT Support"
                        value={borrowerDivision}
                        onChange={(e) => setBorrowerDivision(e.target.value)}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] placeholder-[#A1A1AA] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Phone Number</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. +62 812-XXXX-XXXX"
                        value={borrowerPhone}
                        onChange={(e) => setBorrowerPhone(e.target.value)}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] placeholder-[#A1A1AA] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Borrower Email (Optional)</label>
                      <input 
                        type="email" 
                        placeholder="e.g. user@cybersec.com"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] placeholder-[#A1A1AA] transition-all" 
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Asset & Time Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Asset to Borrow</label>
                      <select 
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] appearance-none cursor-pointer"
                      >
                        <option value="">Select available device...</option>
                        {assets.filter((a) => a.status === "AVAILABLE").map((a) => (
                          <option key={a.id} value={a.id}>{a.name} (AST-{a.id}){a.serial_number ? ` - ${a.serial_number}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Loan Date</label>
                        <CustomDatePicker 
                          value={loanDate} 
                          onChange={setLoanDate} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Return Date</label>
                        <CustomDatePicker 
                          value={expectedReturnDate} 
                          onChange={setExpectedReturnDate} 
                          minDate={loanDate}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#71717A] block mb-1.5 tracking-wider">Description (Reason for Loan)</label>
                      <textarea
                        rows={3}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Provide a detailed reason for borrowing this device..."
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs font-mono text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] resize-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono text-[#71717A] tracking-wider mb-2 uppercase border-b border-[#E4E4E7] pb-1.5">Review Loan Request Details</div>
                    {[
                      ["Borrower Name", borrowerName],
                      ["Borrower Division", borrowerDivision],
                      ["Borrower Phone", borrowerPhone],
                      ["Borrower Email", borrowerEmail || "N/A"],
                      ["Selected Asset", getAssetName(parseInt(selectedAssetId))],
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

                {/* Wizard Buttons */}
                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <button 
                      onClick={() => setStep((s) => s - 1)} 
                      className="px-5 py-2.5 bg-white border border-[#E4E4E7] text-[#71717A] text-xs font-mono font-bold rounded-lg hover:bg-[#FAFAFA] transition-all cursor-pointer shadow-sm"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (step === 1 && !isStep1Valid) return;
                      if (step === 2 && !isStep2Valid) return;
                      
                      if (step < 3) {
                        setStep((s) => s + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={submitting || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                    className="flex-1 py-2.5 bg-linear-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-mono font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {step === 3 ? (submitting ? "Submitting..." : "Submit Request") : "Next →"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            
            {/* 1. Pending Approvals (Approval Queue) */}
            <div>
              <div className="text-xs font-bold text-[#18181B] tracking-wider uppercase mb-3.5">
                Approval Queue ({pendingApprovals.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <span className="font-bold text-[#DC2626]">{getAssetName(req.asset_id)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#71717A]">Masa Pinjam:</span>
                            <span className="font-bold text-amber-600">{details.loan_date} s/d {details.return_date}</span>
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
                  <div className="md:col-span-2 bg-[#FAFAFA] border border-dashed border-[#E4E4E7] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={28} className="text-emerald-500 mb-2" />
                    <h3 className="text-xs font-bold text-[#18181B] font-mono">Queue Cleared</h3>
                    <p className="text-[10px] font-mono text-[#71717A] mt-0.5">No pending loan requests require review.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Active Loans Table */}
            <div className="border-t border-[#E4E4E7]/60 pt-6">
              
              {/* Active Loans Header & Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="text-xs font-bold text-[#18181B] tracking-wider uppercase">
                  Active Loans ({activeLoans.length})
                </div>
                
                {/* Search Bar & Entries count */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#71717A]">
                    <span>Show</span>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-[#E4E4E7] rounded px-2 py-0.5 font-bold text-[#18181B] cursor-pointer"
                    >
                      {[5, 10, 20, 50].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      type="text"
                      placeholder="Search active loans..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-[#E4E4E7] rounded-lg pl-7 pr-3 py-1 text-[11px] font-mono placeholder-[#A1A1AA] focus:outline-none focus:border-[#DC2626] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-auto max-h-[400px] relative">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-[#F4F4F5] border-b border-[#E4E4E7]">
                        {["Loan ID", "Asset Name", "Borrower", "Division", "Phone", "Loan Period", "Status", "Actions"].map((h) => (
                          <th key={h} className="sticky top-0 bg-[#F4F4F5] z-10 text-left px-5 py-3 text-[10px] font-mono font-bold text-[#71717A] tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E4E7]/60">
                      {currentLoans.map((loan) => {
                        const details = parseLoanPurpose(loan);
                        return (
                          <tr key={loan.id} className="hover:bg-[#FAFAFA] transition-colors text-xs">
                            <td className="px-5 py-3.5 text-xs font-mono text-[#DC2626] font-semibold whitespace-nowrap">LN-{loan.id}</td>
                            <td className="px-5 py-3.5 text-xs font-bold text-[#18181B]">{getAssetName(loan.asset_id)}</td>
                            <td className="px-5 py-3.5 text-xs font-medium text-[#18181B]">{details.borrower_name}</td>
                            <td className="px-5 py-3.5 text-xs text-[#52525B]">{details.borrower_division}</td>
                            <td className="px-5 py-3.5 text-xs font-mono text-[#71717A]">{details.borrower_phone}</td>
                            <td className="px-5 py-3.5 text-xs font-mono text-amber-600 whitespace-nowrap">{details.loan_date} - {details.return_date}</td>
                            <td className="px-5 py-3.5">
                              {loan.status === 'OVERDUE' ? (
                                <span className="text-[10px] font-mono text-[#DC2626] font-bold bg-[#DC2626]/10 border border-[#DC2626]/20 px-2 py-0.5 rounded whitespace-nowrap animate-pulse">
                                  Overdue
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded whitespace-nowrap">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedLoanDetails(loan)}
                                  className="p-1 hover:bg-[#F4F4F5] rounded text-[#71717A] hover:text-[#DC2626] transition-colors cursor-pointer flex items-center justify-center"
                                  title="Lihat Detail Peminjaman"
                                >
                                  <Eye size={13} className="shrink-0" />
                                </button>
                                <button
                                  onClick={() => handleReturn(loan.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                                  title="Check-In / Kembalikan Asset"
                                >
                                  Check-In
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredActiveLoans.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-xs font-mono text-[#71717A]">
                            No active loans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer */}
                {totalPages > 0 && (
                  <div className="bg-[#FAFAFA] border-t border-[#E4E4E7] px-5 py-3 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-[#71717A]">
                      Showing <span className="font-bold text-[#18181B]">{indexOfFirstLoan + 1}</span> to{' '}
                      <span className="font-bold text-[#18181B]">{Math.min(indexOfLastLoan, totalItems)}</span> of{' '}
                      <span className="font-bold text-[#18181B]">{totalItems}</span> entries
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Prev Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 border border-[#E4E4E7] bg-white rounded hover:bg-[#F4F4F5] text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={12} />
                      </button>

                      {/* Numbers */}
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

                      {/* Next Button */}
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
          </div>
        )}

      </div>

      {/* Detail Loan Modal */}
      {selectedLoanDetails && (() => {
        const details = parseLoanPurpose(selectedLoanDetails);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-5 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold font-mono">Detail Peminjaman LN-{selectedLoanDetails.id}</h3>
                  <p className="text-[10px] opacity-85 font-mono mt-0.5">
                    Masa Pinjam: {details.loan_date} s/d {details.return_date}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLoanDetails(null)}
                  className="p-1 hover:bg-white/10 rounded transition-all cursor-pointer text-white/80 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                
                {/* Status Badge */}
                <div className="flex justify-between items-center border-b border-[#E4E4E7]/60 pb-3">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider">STATUS TERKINI</span>
                  {selectedLoanDetails.status === 'OVERDUE' ? (
                    <span className="text-[10px] font-mono text-[#DC2626] font-bold bg-[#DC2626]/10 border border-[#DC2626]/20 px-2.5 py-1 rounded-full animate-pulse">
                      Overdue / Terlambat
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#16A34A]/10 border border-[#16A34A]/20 px-2.5 py-1 rounded-full">
                      Active / Sedang Dipinjam
                    </span>
                  )}
                </div>

                {/* Section: Borrower Information */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Informasi Peminjam</h4>
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Nama Lengkap:</span>
                      <span className="font-bold text-[#18181B]">{details.borrower_name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Divisi / Unit:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_division}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Nomor HP:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_phone}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Alamat Email:</span>
                      <span className="font-bold text-[#52525B]">{details.borrower_email}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Asset Information */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Informasi Perangkat</h4>
                  <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Nama Perangkat:</span>
                      <span className="font-bold text-[#DC2626]">{getAssetName(selectedLoanDetails.asset_id)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Kode Asset ID:</span>
                      <span className="font-bold text-[#52525B]">AST-{selectedLoanDetails.asset_id}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Purpose/Reason */}
                <div>
                  <h4 className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-1.5">Alasan / Deskripsi Peminjaman</h4>
                  <p className="text-xs font-mono text-[#18181B] bg-amber-50/40 border border-amber-200/60 p-3 rounded-xl italic leading-relaxed">
                    "{details.reason || 'Tidak ada alasan yang dicantumkan.'}"
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#FAFAFA] border-t border-[#E4E4E7] px-6 py-3.5 flex justify-end">
                <button 
                  onClick={() => setSelectedLoanDetails(null)}
                  className="px-4 py-2 bg-white border border-[#E4E4E7] text-[#52525B] text-xs font-mono font-bold rounded-lg hover:bg-[#F4F4F5] transition-all cursor-pointer shadow-sm"
                >
                  Tutup Detail
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function CustomDatePicker({ 
  value, 
  onChange, 
  minDate 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  minDate?: string;
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
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-[#E4E4E7] rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-[#18181B] focus-within:border-[#DC2626] transition-all cursor-pointer flex items-center justify-between min-h-[38px] shadow-sm select-none"
      >
        <span>{value ? formatDisplayDate(value) : "Select Date..."}</span>
        <Calendar size={14} className="text-[#71717A]" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[280px] mt-2.5 bg-white border border-[#E4E4E7] rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
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
