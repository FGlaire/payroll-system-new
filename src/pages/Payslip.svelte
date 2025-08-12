<script>
  import Layout from "../components/Layout.svelte";
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import {
    getActiveEmployees,
    getEmployeeById,
    createPayrollTransaction,
  } from "../lib/database.js";

  let employeeIdInput = "";
  let selectedEmployee = null;
  let showModal = false;
  let hasValidated = false;
  let loading = false;
  let error = null;

  let employees = [];
  let payslipData = {};
  let validatedEmployees = [];

  // Load employees on mount
  onMount(async () => {
    try {
      employees = await getActiveEmployees();
    } catch (err) {
      error = err.message;
      console.error("Error loading employees:", err);
    }
  });

  async function validateEmployee() {
    try {
      loading = true;
      error = null;
      hasValidated = true;

      if (!employeeIdInput.trim()) {
        error = "Please enter an employee ID";
        return;
      }

      selectedEmployee = await getEmployeeById(employeeIdInput);

      if (
        selectedEmployee &&
        !validatedEmployees.find(
          (e) => e.employee_id === selectedEmployee.employee_id,
        )
      ) {
        validatedEmployees = [...validatedEmployees, selectedEmployee];
      }
    } catch (err) {
      // User-friendly error for not found
      if (
        err.message &&
        (err.message.includes(
          "Cannot coerce the result to a single JSON object",
        ) ||
          err.message.toLowerCase().includes("no rows") ||
          err.message.toLowerCase().includes("not found"))
      ) {
        selectedEmployee = null;
        error = null; // Don't show technical error
      } else {
        error = err.message;
      }
      console.error("Error validating employee:", err);
    } finally {
      loading = false;
    }
  }

  function openModal(employee) {
    selectedEmployee = employee;
    showModal = true;

    if (!payslipData[employee.employee_id]) {
      payslipData[employee.employee_id] = {
        regularHours: "",
        overtimeHours: "",
        specialAllowances: "",
        customDeductions: "",
        deductionDetails: [], // <-- new
      };
    } else if (!payslipData[employee.employee_id].deductionDetails) {
      payslipData[employee.employee_id].deductionDetails = [];
    }
  }

  function closeModal() {
    showModal = false;
  }

  function addDeductionField() {
    if (selectedEmployee) {
      const key = selectedEmployee.employee_id;
      const current = payslipData[key]?.deductionDetails || [];
      // reassign to trigger Svelte reactivity
      payslipData = {
        ...payslipData,
        [key]: {
          ...payslipData[key],
          deductionDetails: [...current, { remark: "", amount: "" }],
        },
      };
    }
  }

  function removeDeductionField(idx) {
    if (selectedEmployee) {
      const key = selectedEmployee.employee_id;
      const current = payslipData[key]?.deductionDetails || [];
      payslipData = {
        ...payslipData,
        [key]: {
          ...payslipData[key],
          deductionDetails: current.filter((_, i) => i !== idx),
        },
      };
    }
  }

  async function saveData() {
    try {
      loading = true;
      error = null;

      const data = payslipData[selectedEmployee.employee_id];

      if (!data.regularHours || data.regularHours <= 0) {
        error = "Please enter regular hours (must be greater than 0)";
        return;
      }

      // Sum all deduction amounts
      let totalDeductions = 0;
      if (data.deductionDetails && data.deductionDetails.length > 0) {
        totalDeductions = data.deductionDetails.reduce(
          (sum, d) => sum + (parseFloat(d.amount) || 0),
          0,
        );
      }
      data.customDeductions = totalDeductions;

      const payrollData = {
        p_employee_id: selectedEmployee.employee_id,
        p_cut_off_start_date: new Date().toISOString().split("T")[0],
        p_cut_off_end_date: new Date().toISOString().split("T")[0],
        p_regular_hours: parseFloat(data.regularHours),
        p_overtime_hours: parseFloat(data.overtimeHours) || 0,
        p_special_allowances: parseFloat(data.specialAllowances) || 0,
        p_custom_deductions: totalDeductions,
        p_deduction_remarks: JSON.stringify(data.deductionDetails),
      };

      await createPayrollTransaction(payrollData);
      showModal = false;
    } catch (err) {
      error = err.message;
      console.error("Error saving payroll data:", err);
    } finally {
      loading = false;
    }
  }

  function getPayslipDataById(id) {
    return payslipData[id] || {};
  }

  function generatePayslip(employee) {
    const data = getPayslipDataById(employee.employee_id);

    const queryParams = new URLSearchParams({
      id: employee.employee_id,
      name: employee.employee_name,
      type: employee.employee_type,
      rate: employee.rate_per_hour,
      regularHours: data.regularHours || 0,
      overtimeHours: data.overtimeHours || 0,
      specialAllowances: data.specialAllowances || 0,
      customDeductions: data.customDeductions || 0,
    });

    push(`/payslip-overview?${queryParams.toString()}`);
  }
</script>

<Layout currentPage="payslip">
  <div class="space-y-6">
    <h2 class="text-3xl font-bold">Payslip</h2>

    <!-- Error Display -->
    {#if error}
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
      >
        {error}
      </div>
    {/if}

    <!-- For Validation, if employee is nasa list -->
    <div class="flex flex-wrap items-center gap-2">
      <label for="employee-id-input" class="block font-medium"
        >Enter Employee ID:</label
      >
      <input
        id="employee-id-input"
        type="text"
        bind:value={employeeIdInput}
        placeholder="e.g., EMP001"
        class="border p-2 rounded w-full sm:w-60 text-sm"
      />
      <button
        on:click={validateEmployee}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto shadow-md text-sm"
        disabled={loading}
      >
        {loading ? "Validating..." : "Validate"}
      </button>
    </div>

    {#if hasValidated}
      {#if selectedEmployee}
        <div class="p-4 bg-green-100 rounded shadow text-green-900 text-sm">
          <p><strong>ID:</strong> {selectedEmployee.employee_id}</p>
          <p><strong>Name:</strong> {selectedEmployee.employee_name}</p>
          <p><strong>Type:</strong> {selectedEmployee.employee_type}</p>
          <p><strong>Hourly Rate:</strong> ₱{selectedEmployee.rate_per_hour}</p>
        </div>
      {:else}
        <div class="p-4 rounded shadow record-row text-sm">
          No record found.
        </div>
      {/if}
    {/if}

    <!-- Table for Validated Employees -->
    <div class="bg-white rounded-lg p-4 shadow overflow-x-auto">
      <h3 class="text-lg font-semibold mb-4">Records</h3>
      <table class="w-full min-w-[600px] border-collapse text-sm">
        <thead class="bg-[#001f3f] text-white">
          <tr>
            <th class="p-3 text-left rounded-tl-lg">ID</th>
            <th class="p-3 text-left">Name</th>
            <th class="p-3 text-left">Type</th>
            <th class="p-3 text-left">Hourly Rate</th>
            <th class="p-3 text-left">Regular Hours</th>
            <th class="p-3 text-left">Overtime Hours</th>
            <th class="p-3 text-left">Allowances</th>
            <th class="p-3 text-left">Deductions</th>
            <th class="p-3 text-left rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if validatedEmployees.length === 0}
            <tr class="record-row">
              <td colspan="9" class="text-center p-4 text-sm"
                >No record found.</td
              >
            </tr>
          {:else}
            {#each validatedEmployees as employee (employee.employee_id)}
              <tr class="record-row align-top">
                <td class="p-3 text-sm">{employee.employee_id}</td>
                <td class="p-3 text-sm">{employee.employee_name}</td>
                <td class="p-3 text-sm">{employee.employee_type}</td>
                <td class="p-3 text-sm">₱{employee.rate_per_hour}</td>
                <td class="p-3 text-sm"
                  >{getPayslipDataById(employee.employee_id).regularHours ||
                    "--"}</td
                >
                <td class="p-3 text-sm"
                  >{getPayslipDataById(employee.employee_id).overtimeHours ||
                    "--"}</td
                >
                <td class="p-3 text-sm">
                  {#if getPayslipDataById(employee.employee_id).specialAllowances}
                    ₱{(+getPayslipDataById(employee.employee_id)
                      .specialAllowances).toFixed(2)}
                  {:else}
                    --
                  {/if}
                </td>

                <!-- Deductions column updated to show all deduction details -->
                <td class="p-3 text-sm">
                  {#if getPayslipDataById(employee.employee_id).deductionDetails?.length}
                    <ul class="list-disc pl-4 space-y-1">
                      {#each getPayslipDataById(employee.employee_id).deductionDetails as d}
                        <li>
                          {d.remark || "No remark"} — ₱{(
                            +d.amount || 0
                          ).toFixed(2)}
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    --
                  {/if}
                </td>

                <td class="p-3 flex flex-wrap gap-2">
                  <button
                    on:click={() => openModal(employee)}
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded w-full sm:w-auto shadow-md text-sm"
                  >
                    {getPayslipDataById(employee.employee_id).regularHours
                      ? "Edit"
                      : "Input Data"}
                  </button>
                  {#if getPayslipDataById(employee.employee_id).regularHours}
                    <button
                      on:click={() => generatePayslip(employee)}
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded w-full sm:w-auto shadow-md text-sm"
                    >
                      Generate Payslip
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Modal for inputting Data -->
    {#if showModal}
      <div
        class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      >
        <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
          <button
            on:click={closeModal}
            class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            &times;
          </button>

          <h3 class="text-lg font-semibold mb-4 mt-4">Enter Payslip Data</h3>

          <!-- Regular Hours -->
          <div class="mb-3">
            <label for="regular-hours" class="block font-medium mb-1"
              >Regular Hours *</label
            >
            <input
              id="regular-hours"
              type="number"
              step="0.5"
              bind:value={
                payslipData[selectedEmployee.employee_id].regularHours
              }
              placeholder="0.0"
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <!-- Overtime Hours -->
          <div class="mb-3">
            <label for="overtime-hours" class="block font-medium mb-1"
              >Overtime Hours</label
            >
            <input
              id="overtime-hours"
              type="number"
              step="0.5"
              bind:value={
                payslipData[selectedEmployee.employee_id].overtimeHours
              }
              placeholder="0.0"
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <!-- Special Allowances -->
          <div class="mb-3">
            <label for="special-allowances" class="block font-medium mb-1"
              >Special Allowances (₱)</label
            >
            <input
              id="special-allowances"
              type="number"
              step="0.01"
              bind:value={
                payslipData[selectedEmployee.employee_id].specialAllowances
              }
              placeholder="0.00"
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <!-- Custom Deductions -->
          <div class="mb-4">
            <label class="block font-medium mb-1">Custom Deductions</label>
            {#each payslipData[selectedEmployee.employee_id].deductionDetails as deduction, idx}
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Remark"
                  bind:value={deduction.remark}
                  class="border p-2 rounded text-sm flex-1"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  bind:value={deduction.amount}
                  class="border p-2 rounded text-sm w-32"
                />
                <button
                  type="button"
                  class="bg-red-500 text-white px-2 rounded"
                  on:click={() => removeDeductionField(idx)}>-</button
                >
              </div>
            {/each}
            <button
              type="button"
              class="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              on:click={addDeductionField}>+ Add Deduction</button
            >
            {#key payslipData[selectedEmployee.employee_id].deductionDetails}
              <div class="mt-2 text-sm text-gray-600">
                Total: ₱{(
                  payslipData[selectedEmployee.employee_id].deductionDetails ||
                  []
                )
                  .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
                  .toFixed(2)}
              </div>
            {/key}
          </div>

          <div class="flex justify-end gap-2">
            <button
              on:click={saveData}
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md text-sm"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              on:click={closeModal}
              class="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</Layout>

<style>
  .record-row {
    background-color: rgb(107 114 128 / var(--tw-border-opacity, 1));
    color: white;
  }
</style>
