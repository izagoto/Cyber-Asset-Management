export interface User {
  id: number;
  email: string;
  fullname: string;
  role: 'ADMIN' | 'SUPERVISOR';
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
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'LOST' | 'MISSING';
  quantity: number;
  available_quantity?: number;
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
  quantity: number;
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
  returned_loans: number;
  maintenance_assets: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Borrower {
  id: number;
  name: string;
  division?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
