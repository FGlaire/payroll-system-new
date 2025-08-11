<script>
  import Layout from "../components/Layout.svelte";
  import { onMount } from 'svelte';
  import {
    getPayrollHistory,
    deletePayrollTransaction,
    restorePayrollTransaction,
    permanentlyDeletePayrollTransaction,
    getDeletedPayrollTransactions
  } from '../lib/database.js';
  import { push } from 'svelte-spa-router';

  let filter = "All";
  let search = "";
  let loading = false;
  let error = null;
  let payrollHistory = [];
  let deletedTransactions = [];

  // Load payroll history on mount
  onMount(async () => {
    await loadPayrollHistory();
    await loadDeleted();
  });

  async function loadPayrollHistory() {
    try {
      loading = true;
      error = null;
      payrollHistory = await getPayrollHistory();
    } catch (err) {
      error = err.message;
      console.error('Error loading payroll history:', err);
    } finally {
      loading = false;
    }
  }

  async function loadDeleted() {
    try {
      const data = await getDeletedPayrollTransactions();
      deletedTransactions = data || [];
    } catch (err) {
      console.error('Error loading deleted payroll:', err);
    }
  }

  $: filteredHistory = payrollHistory.filter((entry) => {
    return (
      (filter === "All" || entry.employee_type === filter) &&
      (entry.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        entry.employee_id.toLowerCase().includes(search.toLowerCase()))
    );
  });

  function viewPayslip(record) {
    const queryParams = new URLSearchParams({
      id: record.employee_id,
      name: record.employee_name,
      type: record.employee_type,
      rate: record.rate_per_hour,
      regularHours: record.regular_hours,
      overtimeHours: record.overtime_hours,
      specialAllowances: record.special_allowances,
      customDeductions: record.custom_deductions
    });
    push(`/payslip-overview?${queryParams.toString()}`);
  }

  async function softDelete(record) {
    if (!confirm(`Move transaction ${record.transaction_id} to trash?`)) return;
    await deletePayrollTransaction(record.transaction_id);
    await loadPayrollHistory();
    await loadDeleted();
  }

  async function restore(tx) {
    await restorePayrollTransaction(tx.transaction_id);
    await loadPayrollHistory();
    await loadDeleted();
  }

  async function purge(tx) {
    if (!confirm(`Permanently delete transaction ${tx.transaction_id}? This cannot be undone.`)) return;
    await permanentlyDeletePayrollTransaction(tx.transaction_id);
    await loadPayrollHistory();
    await loadDeleted();
  }

  // Helper to parse deduction remarks
  function getDeductionDetails(record) {
    if (!record.deduction_remarks) return [];
    try {
      const arr = JSON.parse(record.deduction_remarks);
      if (Array.isArray(arr)) return arr;
      return [];
    } catch {
      return [];
    }
  }
</script>

<Layout currentPage="history">
  <h1 class="text-3xl font-bold mb-6">Payroll History</h1>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <!-- Filter and Search Row -->
  <div class="flex justify-between items-center mb-4">
    <div class="flex items-center gap-2">
      <label for="history-filter" class="text-md font-medium">Filter:</label>
      <select
        id="history-filter"
        bind:value={filter}
        class="border border-gray-300 rounded px-4 py-2"
      >
        <option value="All">All</option>
        <option value="Foreman">Foreman</option>
        <option value="Skilled">Skilled</option>
        <option value="Labor">Labor</option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <label for="history-search" class="text-md font-medium">Search:</label>
      <input
        id="history-search"
        type="text"
        bind:value={search}
        class="border border-gray-300 px-4 py-2 rounded"
        placeholder="Enter name or ID"
      />
      <button class="bg-[#002244] hover:bg-[#001a33] text-white px-4 py-2 rounded shadow-md">
        Search
      </button>
    </div>
  </div>

  <!-- Table for Payroll History -->
  <div class="bg-white rounded-lg p-4 shadow overflow-x-auto">
    <h3 class="text-lg font-semibold mb-4">Payroll History</h3>

    {#if loading}
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="mt-2 text-gray-600">Loading payroll history...</p>
      </div>
    {:else}
      <table class="w-full text-left border-collapse">
        <thead class="bg-[#002244] text-white">
          <tr>
            <th class="px-4 py-2 rounded-tl-lg">Transaction ID</th>
            <th class="px-4 py-2">Employee ID</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Type</th>
            <th class="px-4 py-2">Regular Hours</th>
            <th class="px-4 py-2">Overtime Hours</th>
            <th class="px-4 py-2">Basic Pay</th>
            <th class="px-4 py-2">Overtime Pay</th>
            <th class="px-4 py-2">Gross Pay</th>
            <th class="px-4 py-2">Net Pay</th>
            <th class="px-4 py-2">Deduction Details</th>
            <th class="px-4 py-2 rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredHistory as record, index (record.transaction_id)}
            <tr class="record-row {index === filteredHistory.length - 1 ? 'rounded-bl-lg rounded-br-lg' : ''}">
              <td class="px-4 py-2">{record.transaction_id}</td>
              <td class="px-4 py-2">{record.employee_id}</td>
              <td class="px-4 py-2">{record.employee_name}</td>
              <td class="px-4 py-2">{record.employee_type}</td>
              <td class="px-4 py-2">{record.regular_hours}</td>
              <td class="px-4 py-2">{record.overtime_hours}</td>
              <td class="px-4 py-2">₱{record.basic_pay.toFixed(2)}</td>
              <td class="px-4 py-2">₱{record.overtime_pay.toFixed(2)}</td>
              <td class="px-4 py-2">₱{record.gross_pay.toFixed(2)}</td>
              <td class="px-4 py-2">₱{record.net_pay.toFixed(2)}</td>
              <td class="px-4 py-2">
                {#if getDeductionDetails(record).length > 0}
                  <ul class="text-xs text-gray-900">
                    {#each getDeductionDetails(record) as d}
                      <li>{d.remark}: ₱{(+d.amount || 0).toFixed(2)}</li>
                    {/each}
                  </ul>
                {:else}
                  --
                {/if}
              </td>
              <td class="px-4 py-2 flex gap-2">
                <button class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm shadow-md" on:click={() => viewPayslip(record)}>
                  View
                </button>
                <button class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm shadow-md" on:click={() => softDelete(record)}>
                  🗑️
                </button>
              </td>
            </tr>
          {/each}

          {#if filteredHistory.length === 0}
            <tr>
              <td colspan="11" class="px-4 py-4">
                <div class="bg-gray-200 text-gray-600 italic text-center rounded-lg py-2">
                  No matching records found.
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Trash Modal-like section -->
  <div class="bg-white rounded-lg p-4 shadow mt-6">
    <h3 class="text-lg font-semibold mb-4">Deleted Transactions (Trash)</h3>
    {#if deletedTransactions.length === 0}
      <div class="text-gray-500 italic">No deleted transactions.</div>
    {:else}
      <table class="w-full text-left border-collapse text-sm">
        <thead class="bg-gray-200">
          <tr>
            <th class="px-3 py-2">Txn ID</th>
            <th class="px-3 py-2">Employee</th>
            <th class="px-3 py-2">Deleted At</th>
            <th class="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each deletedTransactions as tx}
            <tr>
              <td class="px-3 py-2">{tx.transaction_id}</td>
              <td class="px-3 py-2">{tx.employee_id}</td>
              <td class="px-3 py-2">{tx.deleted_at?.split('T')[0]}</td>
              <td class="px-3 py-2 flex gap-2">
                <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded" on:click={() => restore(tx)}>Restore</button>
                <button class="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded" on:click={() => purge(tx)}>Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="text-xs text-gray-600 mt-2">Items in trash are permanently deleted after 30 days.</p>
    {/if}
  </div>
</Layout>

<style>
  .record-row {
    background-color: rgb(107 114 128 / var(--tw-border-opacity, 1));
    color: white;
  }
</style>
