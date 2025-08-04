import EmployeeManagement from './pages/EmployeeManagement.svelte';
import Payslip from './pages/Payslip.svelte';
import PayrollHistory from './pages/PayrollHistory.svelte';
import PayslipOverview from './pages/PayslipOverview.svelte'; 

export default {
  '/': EmployeeManagement,
  '/payslip': Payslip,
  '/history': PayrollHistory,
  '/payslip-overview': PayslipOverview, 
};
