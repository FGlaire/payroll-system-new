export interface Employee {
  employee_id: string;
  employee_name: string;
  employee_type: 'Skilled' | 'Foreman' | 'Labor' | 'Other';
  rate_per_hour: number;
  date_hired: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface PayrollTransaction {
  transaction_id: number;
  employee_id: string;
  cut_off_start_date: string;
  cut_off_end_date: string;
  regular_hours: number;
  overtime_hours: number;
  basic_pay: number;
  overtime_pay: number;
  special_allowances: number;
  gross_pay: number;
  custom_deductions: number;
  net_pay: number;
  date_processed: string;
  created_at: string;
}

export interface PayrollSummary {
  transaction_id: number;
  employee_id: string;
  employee_name: string;
  employee_type: string;
  rate_per_hour: number;
  cut_off_start_date: string;
  cut_off_end_date: string;
  regular_hours: number;
  overtime_hours: number;
  basic_pay: number;
  overtime_pay: number;
  special_allowances: number;
  gross_pay: number;
  custom_deductions: number;
  net_pay: number;
  date_processed: string;
}

export interface ActiveEmployee {
  employee_id: string;
  employee_name: string;
  employee_type: string;
  rate_per_hour: number;
  date_hired: string;
  overtime_multiplier: number;
}

export interface NewEmployee {
  employee_id: string;
  employee_name: string;
  employee_type: 'Skilled' | 'Foreman' | 'Labor' | 'Other';
  rate_per_hour: number;
} 