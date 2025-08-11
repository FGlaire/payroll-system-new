<script>
// @ts-nocheck
import Layout from "../components/Layout.svelte";
import { onMount, onDestroy } from 'svelte';
import { push } from 'svelte-spa-router';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { getEmployeeById, getPayrollByEmployee } from '../lib/database.js';

let employee = { name: '', type: '', rate: 0 };
let payslip = { regularHours: 0, overtimeHours: 0, specialAllowances: 0, customDeductions: 0 };
let error = null;
let deductionDetails = [];

function parseParams() {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);

  employee = {
    id: params.get('id'),
    name: params.get('name') || '',
    type: params.get('type') || '',
    rate: parseFloat(params.get('rate')) || 0,
  };

  payslip = {
    regularHours: parseFloat(params.get('regularHours')) || 0,
    overtimeHours: parseFloat(params.get('overtimeHours')) || 0,
    specialAllowances: parseFloat(params.get('specialAllowances')) || 0,
    customDeductions: parseFloat(params.get('customDeductions')) || 0,
  };
}

// Computed Payslip Values
$: basicPay = employee.rate * payslip.regularHours;
$: overtimePay = employee.rate * payslip.overtimeHours * 1.25; //Still unsure if theres araise in OT
$: grossPay = basicPay + overtimePay + payslip.specialAllowances;
$: totalDeductions = payslip.customDeductions;
$: takeHomePay = grossPay - totalDeductions;

function downloadPDF() {
  const element = document.querySelector('.print-area');
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Payslip_${employee.name}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 4 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().from(element).set(opt).save();
}

onMount(async () => {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  const employeeId = params.get('id');

  if (!employeeId) {
    error = 'No employee ID provided.';
    return;
  }

  try {
    // Fetch employee securely
    const emp = await getEmployeeById(employeeId);
    if (!emp) {
      error = 'Employee not found.';
      return;
    }
    employee = {
      id: emp.employee_id,
      name: emp.employee_name,
      type: emp.employee_type,
      rate: emp.rate_per_hour
    };

    // Try to get the latest payroll record to populate payslip + deduction remarks
    const history = await getPayrollByEmployee(employeeId);
    if (history && history.length > 0) {
      const latest = history[0];
      payslip = {
        regularHours: latest.regular_hours || 0,
        overtimeHours: latest.overtime_hours || 0,
        specialAllowances: latest.special_allowances || 0,
        customDeductions: latest.custom_deductions || 0
      };
      // Normalize deduction_remarks into an array of { remark, amount }
      const raw = latest.deduction_remarks;
      if (!raw) {
        deductionDetails = [];
      } else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          deductionDetails = Array.isArray(parsed) ? parsed : [];
        } catch {
          deductionDetails = [];
        }
      } else if (Array.isArray(raw)) {
        deductionDetails = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        deductionDetails = Array.isArray(raw.items) ? raw.items : [];
      }
    } else {
      // Fallback to URL params for demo compatibility
      payslip.regularHours = parseFloat(params.get('regularHours')) || 0;
      payslip.overtimeHours = parseFloat(params.get('overtimeHours')) || 0;
      payslip.specialAllowances = parseFloat(params.get('specialAllowances')) || 0;
      payslip.customDeductions = parseFloat(params.get('customDeductions')) || 0;
      deductionDetails = [];
    }
  } catch (err) {
    error = 'Error loading payslip.';
    console.error(err);
  }
  window.addEventListener('hashchange', parseParams);
});

onDestroy(() => {
  window.removeEventListener('hashchange', parseParams);
});
</script>

<Layout currentPage="payslip">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
  {:else}
    <div class="bg-white p-4 sm:p-6 rounded shadow-xl flex flex-col items-center gap-6">
      <!-- Payslip Content -->
      <div class="print-area border border-gray-300 p-4 sm:p-6 w-full max-w-3xl h-auto relative flex flex-col items-center">
        <img src="/fusion_build_logo_2.png" alt="FusionBuild Logo" class="h-16 w-auto mb-2" />
        <p class="text-center text-[10px] mb-2">
          LOT 1954, GEN. E Aguinaldo Hwy, Lalaan 2, Silang, 4118 Cavite | contact@fusionbuild.tech
        </p>

        <h2 class="text-center font-bold mb-2 text-lg sm:text-xl">PAYSLIP</h2>
        <div class="text-sm space-y-1 self-start w-full">
          <div class="flex justify-between">
            <span>Employee Name:</span>
            <span>{employee.name}</span>
          </div>
          <div class="flex justify-between">
            <span>Position:</span>
            <span>{employee.type}</span>
          </div>
          <div class="flex justify-between">
            <span>Employee ID:</span>
            <span>{employee.id}</span>
          </div>
          <div class="flex justify-between">
            <span>Date:</span>
            <span>_____________</span>
          </div>
        </div>

        <div class="h-4"></div>
        <div class="my-1 border-t border-black w-full"></div>

        <!-- Earnings Section -->
        <div class="text-sm self-start w-full space-y-1 mb-8">
          <p class="font-bold">EARNINGS:</p>
          <div class="flex justify-between">
            <span>Hourly Rate:</span>
            <span>₱{employee.rate.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Regular Hours:</span>
            <span>{payslip.regularHours} hour(s)</span>
          </div>
          <div class="flex justify-between">
            <span>Overtime Hours:</span>
            <span>{payslip.overtimeHours} hour(s)</span>
          </div>
          <div class="flex justify-between">
            <span>Basic Pay:</span>
            <span>₱{basicPay.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Overtime Pay:</span>
            <span>₱{overtimePay.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Special Allowances:</span>
            <span>₱{payslip.specialAllowances.toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold mt-2">
            <span>Gross Pay:</span>
            <span>₱{grossPay.toFixed(2)}</span>
          </div>
        </div>

        <div class="my-1 border-t border-black w-full"></div>

        <!-- Deductions Section -->
        <div class="text-sm self-start w-full space-y-1 mb-8">
          <p class="font-bold">DEDUCTIONS:</p>
          {#if deductionDetails.length}
            {#each deductionDetails as d}
              <div class="flex justify-between">
                <span>{d.remark}</span>
                <span>- ₱{(+d.amount || 0).toFixed(2)}</span>
              </div>
            {/each}
          {/if}
          <div class="flex justify-between">
            <span>Custom Deductions:</span>
            <span>- ₱{payslip.customDeductions.toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold mt-2">
            <span>Total Deductions:</span>
            <span>- ₱{totalDeductions.toFixed(2)}</span>
          </div>
        </div>

        <div class="my-1 border-t border-black w-full"></div>

        <div class="flex justify-between text-sm font-bold self-start w-full mb-2">
          <span>Take Home Pay:</span>
          <span>₱{takeHomePay.toFixed(2)}</span>
        </div>

        <div class="border-b w-full mt-1"></div>

        <!-- Signature Area -->
        <div class="w-full mt-10">
          <div class="flex flex-wrap justify-between text-sm gap-4">
            <div class="flex flex-col items-center flex-1 min-w-[120px]">
              <p>_______________________</p>
              <p>Authorized Signature</p>
            </div>
            <div class="flex flex-col items-center flex-1 min-w-[120px]">
              <p>_______________________</p>
              <p>Employee Signature</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit and Download PDF Buttons -->
      <div class="no-print w-full flex justify-center items-center mt-4">
        <div class="flex flex-wrap justify-center gap-4">
          <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded shadow-md w-full sm:w-auto"
            on:click={() => push('/payslip')}
          >
            Edit
          </button>
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded shadow-md w-full sm:w-auto"
            on:click={downloadPDF}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  {/if}
</Layout>

<style>
  @media print {
    body * {
      visibility: hidden;
    }

    .print-area, .print-area * {
      visibility: visible;
    }

    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
    }

    .no-print {
      display: none !important;
    }
  }
</style>
