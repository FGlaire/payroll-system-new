<script>
  // @ts-nocheck

  import Layout from "../components/Layout.svelte";
  import { push } from "svelte-spa-router";

  let employeeIdInput = "";
  /**
   * @type {{ id: number; name: string; type: string; rate: number; } | null | undefined}
   */
  let selectedEmployee = null;
  let showModal = false;
  let hasValidated = false;

  // TODO: REMOVE THIS DUMMY DATA, FETCH this from Supabase 'employees' table or kung san nakalagay employee
  let employees = [
    { id: 1, name: "Rullan, Andrei", type: "Foreman", rate: 125 },
    { id: 2, name: "Bacolod, John", type: "Skilled", rate: 85.75 },
    { id: 3, name: "Dancis, Jesica", type: "Labor", rate: 75 },
  ];

  let payslipData = {};
  /**
   * @type {any[]}
   */
  let validatedEmployees = [];

  // TODO: FETCH employees from Supabase employee list

  function validateEmployee() {
    hasValidated = true;
    selectedEmployee = employees.find((e) => e.id === +employeeIdInput);

    if (
      selectedEmployee &&
      !validatedEmployees.find((e) => e.id === selectedEmployee.id)
    ) {
      validatedEmployees = [...validatedEmployees, selectedEmployee];
    }
  }

  function openModal(employee) {
    selectedEmployee = employee;
    showModal = true;

    // TODO: Fetch payslip data for this employee from Supabase tables kung san nakalagay

    if (!payslipData[employee.id]) {
      payslipData[employee.id] = {
        daysWorked: "",
        overtime: "",
        cashAdvance: "",
      };
    }
  }

  function closeModal() {
    showModal = false;
  }

  function saveData() {
    // TODO: Insert or Update yung selected employees id sa supabase
    showModal = false;
  }

  function getPayslipDataById(id) {
    return payslipData[id] || {};
  }

  function generatePayslip(employee) {
    const data = getPayslipDataById(employee.id);

    const queryParams = new URLSearchParams({
      id: employee.id,
      name: employee.name,
      type: employee.type,
      rate: employee.rate,
      daysWorked: data.daysWorked || 0,
      overtime: data.overtime || 0,
      cashAdvance: data.cashAdvance || 0,
    });

    push(`/payslip-overview?${queryParams.toString()}`);
  }
</script>

<Layout currentPage="payslip">
  <div class="space-y-6">
    <h2 class="text-3xl font-bold">Payslip</h2>

    <!-- For Validation, if employee is nasa list -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="block font-medium">Enter Employee ID:</label>
      <input
        type="number"
        bind:value={employeeIdInput}
        class="border p-2 rounded w-full sm:w-60 text-sm"
      />
      <button
        on:click={validateEmployee}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto shadow-md text-sm"
        >Validate</button
      >
    </div>

    {#if hasValidated}
      {#if selectedEmployee}
        <div class="p-4 bg-green-100 rounded shadow text-green-900 text-sm">
          <p><strong>ID:</strong> {selectedEmployee.id}</p>
          <p><strong>Name:</strong> {selectedEmployee.name}</p>
          <p><strong>Type:</strong> {selectedEmployee.type}</p>
          <p><strong>Hourly Rate:</strong> ₱{selectedEmployee.rate}</p>
        </div>
      {:else}
        <div class="p-4 rounded shadow record-row text-sm">
          No record found.
        </div>
      {/if}
    {/if}

    <!-- Table for Validated Employees at the moment -->
    <div class="bg-white rounded-lg p-4 shadow overflow-x-auto">
      <h3 class="text-lg font-semibold mb-4">Records</h3>
      <table class="w-full min-w-[600px] border-collapse text-sm">
        <thead class="bg-[#001f3f] text-white">
          <tr>
            <th class="p-3 text-left rounded-tl-lg">ID</th>
            <th class="p-3 text-left">Name</th>
            <th class="p-3 text-left">Type</th>
            <th class="p-3 text-left">Hourly Rate</th>
            <th class="p-3 text-left">No. of Days</th>
            <th class="p-3 text-left">Overtime</th>
            <th class="p-3 text-left">Cash Advance</th>
            <th class="p-3 text-left">Total</th>
            <th class="p-3 text-left rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if validatedEmployees.length === 0}
            <tr class="record-row">
              <td colspan="9" class="text-center p-4 text-sm">No record found.</td>
            </tr>
          {:else}
            {#each validatedEmployees as employee (employee.id)}
              <tr class="record-row">
                <td class="p-3 text-sm">{employee.id}</td>
                <td class="p-3 text-sm">{employee.name}</td>
                <td class="p-3 text-sm">{employee.type}</td>
                <td class="p-3 text-sm">₱{employee.rate}</td>
                <td class="p-3 text-sm">{getPayslipDataById(employee.id).daysWorked || "--"}</td>
                <td class="p-3 text-sm">{getPayslipDataById(employee.id).overtime || "--"}</td>
                <td class="p-3 text-sm">
                  {#if getPayslipDataById(employee.id).cashAdvance !== "" && getPayslipDataById(employee.id).cashAdvance != null}
                    ₱{(+getPayslipDataById(employee.id).cashAdvance).toFixed(2)}
                  {:else}
                    --
                  {/if}
                </td>
                <td class="p-3 text-sm">
                  {#if getPayslipDataById(employee.id).daysWorked}
                    ₱{(
                      employee.rate *
                      +getPayslipDataById(employee.id).daysWorked * 8 +
                      (employee.rate * +getPayslipDataById(employee.id).overtime || 0) -
                      (+getPayslipDataById(employee.id).cashAdvance || 0)
                    ).toFixed(2)}
                  {:else}
                    --
                  {/if}
                </td>
                <td class="p-3 flex flex-wrap gap-2">
                  <!-- If malagyan na nga data, magkakaron ng 2 buttons which is edit and generate payslip -->
                  <button
                    on:click={() => openModal(employee)}
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded w-full sm:w-auto shadow-md text-sm"
                    >{getPayslipDataById(employee.id).daysWorked
                      ? "Edit"
                      : "Input Data"}</button
                  >
                  {#if getPayslipDataById(employee.id).daysWorked}
                    <button
                      on:click={() => generatePayslip(employee)}
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded w-full sm:w-auto shadow-md text-sm"
                      >Generate Payslip</button
                    >
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
      <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
          <button
            on:click={closeModal}
            class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            &times;
          </button>

          <h3 class="text-lg font-semibold mb-4 mt-4">Enter Payslip Data</h3>

          <!-- Still unsure dito kaya days lalagay dito and 1 day is = 8 hrs -->
          <div class="mb-3">
            <label class="block font-medium mb-1">No. of Days Worked</label>
            <input
              type="number"
              bind:value={payslipData[selectedEmployee.id].daysWorked}
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <!-- MHours ilalagay dito  -->
          <div class="mb-3">
            <label class="block font-medium mb-1">Overtime (hour/s)</label>
            <input
              type="number"
              bind:value={payslipData[selectedEmployee.id].overtime}
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <!-- For Cash Advances -->
          <div class="mb-4">
            <label class="block font-medium mb-1">Cash Advance (₱)</label>
            <input
              type="number"
              bind:value={payslipData[selectedEmployee.id].cashAdvance}
              class="w-full border p-2 rounded text-sm"
            />
          </div>

          <div class="flex justify-end gap-2">
            <button
              on:click={saveData}
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md text-sm"
              >Save</button
            >
            <button
              on:click={closeModal}
              class="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow-md text-sm"
              >Cancel</button
            >
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
