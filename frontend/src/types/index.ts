export interface User {
  id: number;
  email: string;
  fullname: string;
  role: 'ADMIN' | 'USER';
  division?: string;
  phone?: string;
  is_active: boolean;
  create_at: string;
}

export interface Asset {
  id: number;
  name: string;
  category?: string;
  serial_number?: string;
  description?: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST';
  created_at: string;
  updated_at?: string;
}

export interface Loan {
  id: number;
  asset_id: number;
  asset?: Asset;
  user_id: number;
  user?: User;
  status: 'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'REJECTED';
  notes?: string;
  purpose?: string;
  requested_at: string;
  approved_at?: string;
  returned_at?: string;
}
export interface StandardResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface DashboardStats {
  total_assets: number;
  available_assets: number;
  borrowed_assets: number;
  overdue_loans: number;
  pending_approvals: number;
  maintenance_assets: number;
}
