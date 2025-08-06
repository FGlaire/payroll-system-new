<script>
  import Layout from "../components/Layout.svelte";
  import { onMount } from 'svelte';
  import { 
    getActiveEmployees, 
    addEmployee, 
    getEmployeeCount,
    searchEmployees,
    filterEmployeesByType
  } from '../lib/database.js';

  let showAddEmployeeModal = false;
  let loading = false;
  let error = null;

  let totalEmployees = 0;
  let filter = "All";
  let searchQuery = "";
  let employees = [];

  // Form data
  let newName = "";
  let newId = "";
  let newType = "";
  let newRate = "";

  // Load employees on mount
  onMount(async () => {
    await loadEmployees();
    await loadEmployeeCount();
  });

  async function loadEmployees() {
    try {
      loading = true;
      error = null;
      
      if (searchQuery.trim()) {
        employees = await searchEmployees(searchQuery);
      } else if (filter !== "All") {
        employees = await filterEmployeesByType(filter);
      } else {
        employees = await getActiveEmployees();
      }
    } catch (err) {
      error = err.message;
      console.error('Error loading employees:', err);
    } finally {
      loading = false;
    }
  }

  async function loadEmployeeCount() {
    try {
      totalEmployees = await getEmployeeCount();
    } catch (err) {
      console.error('Error loading employee count:', err);
    }
  }

  async function handleSearch() {
    await loadEmployees();
  }

  async function handleFilterChange() {
    await loadEmployees();
  }

  async function handleAddEmployee() {
    try {
      loading = true;
      error = null;

      if (!newName || !newId || !newType || !newRate) {
        error = "Please fill in all fields";
        return;
      }

      const employeeData = {
        employee_id: newId,
        employee_name: newName,
        employee_type: newType,
        rate_per_hour: parseFloat(newRate)
      };

      await addEmployee(employeeData);
      
      // Reset form
      newName = "";
      newId = "";
      newType = "";
      newRate = "";
      showAddEmployeeModal = false;

      // Reload data
      await loadEmployees();
      await loadEmployeeCount();
    } catch (err) {
      error = err.message;
      console.error('Error adding employee:', err);
    } finally {
      loading = false;
    }
  }
</script>

<Layout currentPage="employee">
  <h1 class="text-2xl md:text-3xl font-bold mb-6">Employee Management</h1>

  <!-- Total Employee and Average Hourly Rates Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white rounded-xl p-6 shadow flex flex-col justify-between">
      <h3 class="text-lg font-semibold">Total Employees</h3>
      <p class="text-4xl font-bold my-4">{totalEmployees}</p>
      <button
        on:click={() => (showAddEmployeeModal = true)}
        class="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded w-full shadow-md"
      >
        Add Employee
      </button>
    </div>

    <div class="bg-white rounded-xl p-6 shadow flex flex-col justify-between">
      <h3 class="text-lg font-semibold mb-4">Average Hourly Rates</h3>
      <div class="h-40 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
        [Chart Placeholder]
      </div>
    </div>
  </div>

  
  <!-- Error Display -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <!-- Filter and Search -->
  <div class="flex flex-wrap items-center gap-4 mb-4">
    <div class="flex items-center gap-2">
      <label for="filter-select" class="font-medium">Filter:</label>
      <select id="filter-select" bind:value={filter} on:change={handleFilterChange} class="border rounded px-3 py-2">
        <option>All</option>
        <option>Foreman</option>
        <option>Skilled</option>
        <option>Labor</option>
      </select>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label for="search-input" class="font-medium">Search:</label>
      <input
        id="search-input"
        type="text"
        bind:value={searchQuery}
        placeholder="Enter name or ID..."
        class="border rounded px-3 py-2 w-48 sm:w-60"
      />
      <button
        on:click={handleSearch}
        class="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded shadow-md"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  </div>

  <!-- Table for Saved Records -->
  <div class="bg-white rounded-xl p-4 sm:p-6 shadow overflow-x-auto">
    <h3 class="text-lg font-semibold mb-4">Saved Records</h3>
    
    {#if loading}
      <div class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="mt-2 text-gray-600">Loading employees...</p>
      </div>
    {:else}
      <table class="w-full min-w-[600px] border-collapse text-sm">
        <thead class="bg-[#001f3f] text-white">
          <tr>
            <th class="p-3 text-left rounded-tl-lg">ID</th>
            <th class="p-3 text-left">Name</th>
            <th class="p-3 text-left">Type</th>
            <th class="p-3 text-left">Hourly Rate</th>
            <th class="p-3 text-left rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each employees as emp, i}
            <tr class="record-row">
              <td class="p-3">{emp.employee_id}</td>
              <td class="p-3">{emp.employee_name}</td>
              <td class="p-3">{emp.employee_type}</td>
              <td class="p-3">₱{emp.rate_per_hour.toFixed(2)}</td>
              <td class="p-3">
                <button
                  class="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded shadow-md"
                >
                  Edit
                </button>
              </td>
            </tr>
          {/each}

          {#if employees.length === 0}
            <tr>
              <td colspan="5" class="text-center p-4 italic text-gray-500">
                No record found.
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Modal for adding employee -->
  {#if showAddEmployeeModal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          class="absolute top-2 right-3 text-xl font-bold text-gray-600 hover:text-black"
          on:click={() => (showAddEmployeeModal = false)}
        >
          ×
        </button>

        <h2 class="text-xl font-bold mb-4">New Employee</h2>

        <div class="mb-3">
          <label for="employee-id" class="block font-semibold mb-1">Employee ID *</label>
          <input id="employee-id" bind:value={newId} placeholder="e.g., EMP001" class="w-full border px-3 py-2 rounded" />
        </div>

        <div class="mb-3">
          <label for="employee-name" class="block font-semibold mb-1">Name *</label>
          <input id="employee-name" bind:value={newName} placeholder="Full Name" class="w-full border px-3 py-2 rounded" />
        </div>

        <!-- For Type or Position -->
        <div class="mb-3">
          <label for="employee-type" class="block font-semibold mb-1">Type *</label>
          <select id="employee-type" bind:value={newType} class="w-full border px-3 py-2 rounded">
            <option disabled selected value="">Select type</option>
            <option>Foreman</option>
            <option>Skilled</option>
            <option>Labor</option>
          </select>
        </div>

        <!-- For Hourly Rate -->
        <div class="mb-3">
          <label for="employee-rate" class="block font-semibold mb-1">Hourly Rate (₱) *</label>
          <input id="employee-rate" type="number" step="0.01" bind:value={newRate} placeholder="0.00" class="w-full border px-3 py-2 rounded" />
        </div>

        <button
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full shadow-md"
          on:click={handleAddEmployee}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  {/if}
</Layout>

<style>
  .record-row {
    background-color: rgb(107 114 128 / var(--tw-border-opacity, 1));
    color: white;
  }
</style>
