import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Database, ArrowLeftRight, Clock, AlertTriangle,
  ClipboardList
} from 'lucide-react';

function KPICard({
  icon: Icon, label, value, color, variant = "default"
}: { icon: React.ElementType; label: string; value: string | number; color: string; variant?: "default" | "hero" | "danger" }) {
  
  const isHero = variant === "hero";
  const isDanger = variant === "danger";

  let bgClass = "bg-[#FFFFFF] border-[#E4E4E7]";
  let labelClass = "text-[#71717A]";
  let valueClass = "text-[#18181B]";
  let iconBg = `${color}10`;
  let iconColor = color;

  if (isHero) {
    bgClass = "bg-gradient-to-br from-[#18181B] to-[#27272A] border-[#3F3F46]";
    labelClass = "text-[#A1A1AA]";
    valueClass = "text-[#FFFFFF]";
    iconBg = "rgba(255,255,255,0.1)";
    iconColor = "#FFFFFF";
  } else if (isDanger) {
    bgClass = "bg-[#FEF2F2] border-[#FECACA]";
    labelClass = "text-[#DC2626]";
    valueClass = "text-[#991B1B]";
    iconBg = "rgba(220, 38, 38, 0.1)";
    iconColor = "#DC2626";
  }

  return (
    <div className={`${bgClass} rounded-2xl p-6 flex items-center justify-between border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300`}>
      <div>
        <div className={`text-sm font-bold mb-1.5 ${labelClass}`}>{label}</div>
        <div className={`text-4xl font-black tracking-tight ${valueClass}`}>{value}</div>
      </div>
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={24} strokeWidth={2} />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          icon={Database} 
          label="Total Cyber Assets" 
          value={stats?.total_assets ?? 0} 
          color="#18181B" 
          variant="hero"
        />
        <KPICard 
          icon={ArrowLeftRight} 
          label="Active Loans" 
          value={stats?.active_loans ?? 0} 
          color="#DC2626" 
        />
        <KPICard 
          icon={Clock} 
          label="Pending Approvals" 
          value={stats?.pending_approvals ?? 0} 
          color="#52525B" 
        />
        <KPICard 
          icon={AlertTriangle} 
          label="Overdue Assets" 
          value={stats?.overdue_loans ?? 0} 
          color="#DC2626" 
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between">
          <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-4 flex justify-between items-center">
            <div>
              <div className="text-base font-bold text-white">Recent Transactions</div>
            </div>
            <Link to="/loans" className="text-xs font-bold text-white hover:text-white/80 transition-colors">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[#F4F4F5]">
                  <th className="text-left px-6 py-3.5 text-xs font-mono font-bold text-[#71717A] tracking-wider">Loan ID</th>
                  <th className="text-left px-6 py-3.5 text-xs font-mono font-bold text-[#71717A] tracking-wider">Asset ID</th>
                  <th className="text-left px-6 py-3.5 text-xs font-mono font-bold text-[#71717A] tracking-wider">User ID</th>
                  <th className="text-left px-6 py-3.5 text-xs font-mono font-bold text-[#71717A] tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {loans.slice(0, 5).map((loan: any) => (
                  <tr key={loan.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-[#DC2626] font-semibold">LN-{loan.id}</td>
                    <td className="px-6 py-4 text-xs font-mono text-[#18181B] font-medium">AST-{loan.asset_id}</td>
                    <td className="px-6 py-4 text-xs font-mono text-[#52525B]">USR-{loan.user_id}</td>
                    <td className="px-6 py-4">
                      {(loan.status === 'PENDING' || loan.status === 'REQUESTED') && (
                        <span className="text-[10px] font-mono text-[#EA580C] font-bold bg-[#EA580C]/10 border border-[#EA580C]/20 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                      {loan.status === 'ACTIVE' && (
                        <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                      {loan.status === 'OVERDUE' && (
                        <span className="text-[10px] font-mono text-[#DC2626] font-bold bg-[#DC2626]/10 border border-[#DC2626]/20 px-2 py-0.5 rounded animate-pulse">
                          Overdue
                        </span>
                      )}
                      {loan.status === 'RETURNED' && (
                        <span className="text-[10px] font-mono text-[#71717A] font-bold bg-[#F4F4F5] border border-[#E4E4E7] px-2 py-0.5 rounded">
                          Returned
                        </span>
                      )}
                      {loan.status === 'REJECTED' && (
                        <span className="text-[10px] font-mono text-[#71717A] font-bold bg-gray-100 border border-gray-200 px-2 py-0.5 rounded line-through">
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-mono text-[#71717A]">
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
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
            <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-4">
              <div className="text-base font-bold text-white">Real-time Asset Status</div>
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
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#52525B] font-medium">{item.label}</span>
                      <span className={`font-mono font-bold ${item.color}`}>{item.val} ({percentage}%)</span>
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
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
            <div className="bg-linear-to-r from-[#DC2626] to-[#B91C1C] px-6 py-4">
              <div className="text-base font-bold text-white">Quick Operations</div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                <Link to="/loans" className="flex flex-col items-center justify-center p-4 bg-[#F4F4F5] hover:bg-[#DC2626]/10 border border-[#E4E4E7] hover:border-[#DC2626]/20 rounded-xl text-center transition-all group">
                  <ClipboardList size={20} className="text-[#DC2626] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-[#18181B] font-mono">Request Loan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
