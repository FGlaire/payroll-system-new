<script>
// @ts-nocheck

  import Layout from "../components/Layout.svelte";
  import { onMount, onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';
  // @ts-ignore
  import html2pdf from 'html2pdf.js';

  let employee = { name: '', type: '', rate: 0 };
  let payslip = { daysWorked: 0, overtime: 0, cashAdvance: 0 };

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
      daysWorked: parseFloat(params.get('daysWorked')) || 0,
      overtime: parseFloat(params.get('overtime')) || 0,
      cashAdvance: parseFloat(params.get('cashAdvance')) || 0,
    };
  }

  // Computed Payslip Values
  $: basicPayOnly = employee.rate * payslip.daysWorked * 8;
  $: overtimePay = employee.rate * payslip.overtime;
  $: basicPay = basicPayOnly + overtimePay;
  $: totalDeductions = payslip.cashAdvance;  // Add other deductions here if needed
  $: takeHomePay = basicPay - totalDeductions;

  function downloadPDF() {
    const element = document.querySelector('.print-area');
    const opt = {
      margin: 0,
      filename: `Payslip_${employee.name}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  }

  onMount(() => {
    parseParams();
    window.addEventListener('hashchange', parseParams);
  });

  onDestroy(() => {
    window.removeEventListener('hashchange', parseParams);
  });
</script>

<Layout currentPage="payslip">
  <div class="bg-white p-4 sm:p-6 rounded shadow-xl flex flex-col lg:flex-row gap-6 items-center lg:items-start">
    <!-- Payslip Content -->
    <div class="print-area border border-gray-300 p-4 sm:p-6 w-full max-w-[514px] h-auto relative flex flex-col items-center">
      <img src="/fusion_build_logo_2.png" alt="FusionBuild Logo" class="h-16 w-auto mb-1" />
      <p class="text-center text-[10px] mb-2">
        LOT 1954, GEN. E Aguinaldo Hwy, Lalaan 2, Silang, 4118 Cavite | contact@fusionbuild.tech
      </p>

      <h2 class="text-center font-bold mb-2">PAYSLIP</h2>
      <div class="text-sm space-y-0.5 self-start w-full">
        <div class="flex justify-between">
          <span>Employee Name:</span>
          <span>{employee.name}</span>
        </div>
        <div class="flex justify-between">
          <span>Position:</span>
          <span>{employee.type}</span>
        </div>
        <div class="flex justify-between">
          <span>Account #:</span>
          <span>_____________</span>
        </div>
        <div class="flex justify-between">
          <span>Payroll Method:</span>
          <span>_____________</span>
        </div>
      </div>
      <div class="my-1 border-t border-black w-full"></div>

      <!-- Earnings Section -->
      <div class="text-sm self-start w-full space-y-0.5 mb-8">
        <p class="font-bold">EARNINGS:</p>
        <div class="flex justify-between">
          <span>Hourly Rate:</span>
          <span>₱{employee.rate.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Days Worked:</span>
          <span>{payslip.daysWorked} day(s)</span>
        </div>
        <div class="flex justify-between">
          <span>OT:</span>
          <span>{payslip.overtime} hour(s)</span>
        </div>
        <div class="flex justify-between">
          <span>Basic Pay:</span>
          <span>₱{basicPayOnly.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Overtime Worked:</span>
          <span>₱{overtimePay.toFixed(2)}</span>
        </div>
        <div class="flex justify-between font-bold mt-2">
          <span>Total Earnings:</span>
          <span>₱{basicPay.toFixed(2)}</span>
        </div>
      </div>
      <div class="my-1 border-t border-black w-full"></div>

      <!-- Deductions Section -->
      <div class="text-sm self-start w-full space-y-0.5 mb-8">
        <p class="font-bold">DEDUCTIONS:</p>
        <div class="flex justify-between">
          <span>Custom Reduction:</span>
          <span>- ₱0.00</span> <!-- Placeholder -->
        </div>
        <div class="flex justify-between">
          <span>Advances:</span>
          <span>- ₱{payslip.cashAdvance.toFixed(2)}</span>
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
        <div class="flex justify-between text-sm">
          <div class="flex flex-col items-center w-1/2">
            <p>_______________________</p>
            <p>Authorized Signature</p>
          </div>
          <div class="flex flex-col items-center w-1/2">
            <p>_______________________</p>
            <p>Employee Signature</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit and Download PDF Buttons -->
    <div class="no-print w-full lg:w-auto flex justify-center lg:justify-end items-center">
      <div class="flex flex-col sm:flex-row gap-4">
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
