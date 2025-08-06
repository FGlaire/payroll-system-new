import { supabase } from './supabase.js';

// Employee Management Functions
export async function getActiveEmployees() {
  const { data, error } = await supabase
    .from('active_employees')
    .select('*')
    .order('employee_name');
  
  if (error) throw error;
  return data;
}

export async function getEmployeeById(employeeId) {
  const { data, error } = await supabase
    .from('employee_master')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'Active')
    .single();
  
  if (error) throw error;
  return data;
}

export async function addEmployee(employee) {
  const { data, error } = await supabase
    .from('employee_master')
    .insert([employee])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateEmployee(employeeId, updates) {
  const { data, error } = await supabase
    .from('employee_master')
    .update(updates)
    .eq('employee_id', employeeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deactivateEmployee(employeeId) {
  const { data, error } = await supabase
    .from('employee_master')
    .update({ status: 'Inactive' })
    .eq('employee_id', employeeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Payroll Functions
export async function getPayrollHistory() {
  const { data, error } = await supabase
    .from('payroll_summary')
    .select('*')
    .order('date_processed', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getPayrollByEmployee(employeeId) {
  const { data, error } = await supabase
    .from('payroll_summary')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date_processed', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createPayrollTransaction(payrollData) {
  const { data, error } = await supabase
    .rpc('insert_payroll_transaction', payrollData);
  
  if (error) throw error;
  return data;
}

export async function calculatePayroll(calculationData) {
  const { data, error } = await supabase
    .rpc('calculate_payroll', calculationData);
  
  if (error) throw error;
  return data[0]; // Return first row since it's a single calculation
}

// Utility Functions
export async function getEmployeeCount() {
  const { count, error } = await supabase
    .from('employee_master')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active');
  
  if (error) throw error;
  return count;
}

export async function searchEmployees(searchTerm) {
  const { data, error } = await supabase
    .from('active_employees')
    .select('*')
    .or(`employee_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`)
    .order('employee_name');
  
  if (error) throw error;
  return data;
}

export async function filterEmployeesByType(employeeType) {
  const { data, error } = await supabase
    .from('active_employees')
    .select('*')
    .eq('employee_type', employeeType)
    .order('employee_name');
  
  if (error) throw error;
  return data;
} 