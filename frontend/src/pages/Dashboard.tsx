import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Database, ArrowLeftRight, Clock,
  ClipboardList, CheckCircle, Wrench,
  Activity, List, Zap, AlertTriangle
} from 'lucide-react';

function KPICard({
  icon: Icon, label, value, color, variant
}: { icon: React.ElementType; label: string; value: string | number; color: string; variant?: "default" | "hero" | "danger" }) {
  
  const isDanger = variant === "danger";

  return (
    <div className={`bg-white rounded-md border ${isDanger ? 'border-red-200 bg-red-50/30' : 'border-[#D1D5DB]'} p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200`}>
      <div className="shrink-0" style={{ color: color }}>
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col">
        <div className="text-[13px] font-medium text-[#6B7280] leading-tight">{label}</div>
        <div className={`text-[26px] font-normal mt-1 tracking-tight leading-none ${isDanger ? 'text-red-700' : 'text-[#111827]'}`}>{value}</div>
      </div>
    </div>
  );
}




export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsAndLoans = async () => {
      try {
        const [statsRes, loansRes] = await Promise.all([
          api.get('/stats'),
          api.get('/loans')
        ]);
        setStats(statsRes.data.data);
        setLoans(loansRes.data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndLoans();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-cyan-500 font-mono text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-6">
        <KPICard 
          icon={Database} 
          label="Total Assets" 
          value={stats?.total_asset_quantity ?? 0} 
          color="#18181B" 
        />
        <KPICard 
          icon={CheckCircle} 
          label="Available Assets" 
          value={stats?.available_assets ?? 0} 
          color="#10B981" 
        />
        <KPICard 
          icon={ArrowLeftRight} 
          label="Active Loans" 
          value={stats?.active_loans ?? 0} 
          color="#2563EB" 
        />
        <KPICard 
          icon={ClipboardList} 
          label="Returned Assets" 
          value={stats?.returned_loans ?? 0} 
          color="#8B5CF6" 
        />
        <KPICard 
          icon={Clock} 
          label="Overdue Assets" 
          value={stats?.overdue_loans ?? 0} 
          color="#DC2626" 
          variant="danger"
        />
        <KPICard 
          icon={Wrench} 
          label="In Maintenance" 
          value={stats?.maintenance_assets ?? 0} 
          color="#F59E0B" 
        />
      </div>

      {/* Overdue Alert Banner */}
      {stats?.overdue_loans > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-bold text-red-700">Attention Required: {stats.overdue_loans} Overdue Asset{stats.overdue_loans > 1 ? 's' : ''}</div>
            <div className="text-xs text-red-600 mt-0.5">Some borrowed assets have passed their return deadline. Please review and follow up immediately.</div>
          </div>
          <Link to="/loans?tab=overdue" className="text-xs font-bold text-red-700 hover:text-red-800 bg-white px-3 py-1.5 rounded-lg border border-red-200 transition-colors">
            View Details
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <List size={18} className="text-[#DC2626]" />
              <div className="text-base font-bold text-[#18181B] tracking-wide">Recent Transactions</div>
            </div>
            <Link to="/loans" className="text-xs font-bold text-[#DC2626] hover:text-[#B91C1C] transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[#18181B]">
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-white whitespace-nowrap w-[20%]">Loan ID</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-white whitespace-nowrap w-[30%]">Asset ID</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-white whitespace-nowrap w-[30%]">User ID</th>
                  <th className="text-left px-6 py-4 text-[14px] font-semibold text-white whitespace-nowrap w-[20%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {loans.slice(0, 5).map((loan: any) => (
                  <tr key={loan.id} className="hover:bg-[#F9FAFB] transition-colors bg-white border-b border-[#E4E4E7]">
                    <td className="px-6 py-4 text-[14px] text-[#4B5563] whitespace-nowrap">LN-{loan.id}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">AST-{loan.asset_id}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4B5563]">USR-{loan.user_id}</td>
                    <td className="px-6 py-4">
                      {(loan.status === 'PENDING' || loan.status === 'REQUESTED') && (
                        <span className="text-xs font-bold text-[#EA580C] bg-[#EA580C]/10 border border-[#EA580C]/20 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                      {loan.status === 'ACTIVE' && (
                        <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                      {loan.status === 'OVERDUE' && (
                        <span className="text-xs font-bold text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 px-2 py-0.5 rounded animate-pulse">
                          Overdue
                        </span>
                      )}
                      {loan.status === 'RETURNED' && (
                        <span className="text-xs font-bold text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] px-2 py-0.5 rounded">
                          Returned
                        </span>
                      )}
                      {loan.status === 'REJECTED' && (
                        <span className="text-xs font-bold text-[#71717A] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded line-through">
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-[#71717A]">
                      No recent transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Actions & Status Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Asset Status Breakdown */}
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
            <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className="text-[#DC2626]" />
                <div className="text-base font-bold text-[#18181B] tracking-wide">Real-time Asset Status</div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Available", val: stats?.available_assets ?? 0, bg: "bg-[#16A34A]", color: "text-[#16A34A]" },
                { label: "Borrowed", val: stats?.borrowed_assets ?? 0, bg: "bg-[#2563EB]", color: "text-[#2563EB]" },
                { label: "Maintenance", val: stats?.maintenance_assets ?? 0, bg: "bg-[#D97706]", color: "text-[#D97706]" },
                { label: "Lost", val: stats?.lost_assets ?? 0, bg: "bg-[#DC2626]", color: "text-[#DC2626]" },
              ].map((item) => {
                const total = (stats?.available_assets ?? 0) + (stats?.borrowed_assets ?? 0) + (stats?.maintenance_assets ?? 0) + (stats?.lost_assets ?? 0) || 1;
                const percentage = Math.round((item.val / total) * 100);
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-[#52525B] font-medium">{item.label}</span>
                      <span className={`font-semibold ${item.color}`}>{item.val} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.bg}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] border-l-4 border-l-[#A1A1AA] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
            <div className="bg-[#FFFFFF] border-b border-[#E4E4E7] px-6 py-5">
              <div className="flex items-center gap-2.5">
                <Zap size={18} className="text-[#DC2626]" />
                <div className="text-base font-bold text-[#18181B] tracking-wide">Quick Operations</div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                <Link to="/loans" className="flex items-center justify-center gap-3 p-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <ClipboardList size={22} className="text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[15px] font-bold tracking-wide">Request Loan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
