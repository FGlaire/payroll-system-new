<script>
  import Layout from "../components/Layout.svelte";
  import { onMount, onDestroy } from 'svelte';
  import { 
    getActiveEmployees, 
    addEmployee, 
    updateEmployee,
    deactivateEmployee,
    getEmployeeCount,
    searchEmployees,
    filterEmployeesByType
  } from '../lib/database.js';
  import Chart from 'chart.js/auto';
  import { supabase } from '../lib/supabase.js';

  let showAddEmployeeModal = false;
  let showEditEmployeeModal = false;
  let showTrashModal = false;
  let loading = false;
  let error = null;

  let totalEmployees = 0;
  let filter = "All";
  let searchQuery = "";
  let employees = [];
  let deletedEmployees = [];

  // Form data
  let newName = "";
  let newId = "";
  let newType = "";
  let newRate = "";

  // Edit form data
  let editingEmployee = null;
  let editName = "";
  let editType = "";
  let editRate = "";

  let chart;
  let chartCanvas;

  function renderChart() {
    if (!chartCanvas) return;
    // Calculate average hourly rates by type
    const types = ['Foreman', 'Skilled', 'Labor', 'Other'];
    const averages = types.map(type => {
      const filtered = employees.filter(e => e.employee_type === type);
      if (!filtered.length) return 0;
      return filtered.reduce((sum, e) => sum + e.rate_per_hour, 0) / filtered.length;
    });
    if (chart) chart.destroy();
    chart = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels: types,
        datasets: [{
          label: 'Average Hourly Rate',
          data: averages,
          backgroundColor: ['#facc15', '#60a5fa', '#f87171', '#a78bfa']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  onMount(() => {
    renderChart();
  });

  $: if (employees.length && chartCanvas) {
    renderChart();
  }

  onDestroy(() => {
    if (chart) chart.destroy();
  });

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

  async function loadDeletedEmployees() {
    // Fetch employees with status 'Inactive', order by updated_at desc
    const { data, error: err } = await supabase
      .from('employee_master')
      .select('*')
      .eq('status', 'Inactive')
      .order('updated_at', { ascending: false });
    if (!err) deletedEmployees = data;
  }

  async function handleRestoreEmployee(employee) {
    try {
      loading = true;
      error = null;
      await updateEmployee(employee.employee_id, { status: 'Active' });
      await loadEmployees();
      await loadEmployeeCount();
      await loadDeletedEmployees();
    } catch (err) {
      error = err.message;
      console.error('Error restoring employee:', err);
    } finally {
      loading = false;
    }
  }

  $: if (showTrashModal) loadDeletedEmployees();

  async function handleSearch() {
    await loadEmployees();
  }

  async function handleFilterChange() {
    await loadEmployees();
  }

  function openEditModal(employee) {
    editingEmployee = employee;
    editName = employee.employee_name;
    editType = employee.employee_type;
    editRate = employee.rate_per_hour.toString();
    showEditEmployeeModal = true;
  }

  async function handleEditEmployee() {
    try {
      loading = true;
      error = null;

      if (!editName || !editType || !editRate) {
        error = "Please fill in all fields";
        return;
      }

      const updates = {
        employee_name: editName,
        employee_type: editType,
        rate_per_hour: parseFloat(editRate)
      };

      await updateEmployee(editingEmployee.employee_id, updates);
      
      // Reset form
      editingEmployee = null;
      editName = "";
      editType = "";
      editRate = "";
      showEditEmployeeModal = false;

      // Reload data
      await loadEmployees();
      await loadEmployeeCount();
    } catch (err) {
      error = err.message;
      console.error('Error updating employee:', err);
    } finally {
      loading = false;
    }
  }

  async function handleDeleteEmployee(employee) {
    if (confirm(`Are you sure you want to delete ${employee.employee_name}? This action can be undone within 30 days.`)) {
      try {
        loading = true;
        error = null;
        
        await deactivateEmployee(employee.employee_id);
        
        // Reload data
        await loadEmployees();
        await loadEmployeeCount();
      } catch (err) {
        error = err.message;
        console.error('Error deleting employee:', err);
      } finally {
        loading = false;
      }
    }
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

  <!-- Average Hourly Rates Chart -->
  <div class="bg-white rounded-xl p-6 shadow flex flex-col justify-between mb-6 w-full">
    <h3 class="text-lg font-semibold mb-4">Average Hourly Rates by Type</h3>
    <canvas bind:this={chartCanvas} height="80"></canvas>
  </div>

  <!-- Total Employees Card -->
  <div class="bg-white rounded-xl p-6 shadow flex flex-col justify-between mb-6 w-full">
    <h3 class="text-lg font-semibold">Total Employees</h3>
    <p class="text-4xl font-bold my-4">{totalEmployees}</p>
    <div class="flex gap-2">
      <button
        on:click={() => (showAddEmployeeModal = true)}
        class="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded shadow-md flex-1"
      >
        Add Employee
      </button>
      <button
        on:click={() => (showTrashModal = true)}
        class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow-md"
      >
        Trash
      </button>
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
        <option>Other</option>
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
                          <td class="p-3 flex gap-2">
              <button
                on:click={() => openEditModal(emp)}
                class="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded shadow-md"
              >
                Edit
              </button>
              <button
                on:click={() => handleDeleteEmployee(emp)}
                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow-md"
              >
                🗑️
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
            <option>Other</option>
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

  <!-- Edit Employee Modal -->
  {#if showEditEmployeeModal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          class="absolute top-2 right-3 text-xl font-bold text-gray-600 hover:text-black"
          on:click={() => (showEditEmployeeModal = false)}
        >
          ×
        </button>

        <h2 class="text-xl font-bold mb-4">Edit Employee</h2>

        <div class="mb-3">
          <label for="edit-employee-id" class="block font-semibold mb-1">Employee ID</label>
          <input id="edit-employee-id" value={editingEmployee.employee_id} class="w-full border px-3 py-2 rounded bg-gray-100" disabled />
        </div>

        <div class="mb-3">
          <label for="edit-employee-name" class="block font-semibold mb-1">Name *</label>
          <input id="edit-employee-name" bind:value={editName} placeholder="Full Name" class="w-full border px-3 py-2 rounded" />
        </div>

        <div class="mb-3">
          <label for="edit-employee-type" class="block font-semibold mb-1">Type *</label>
          <select id="edit-employee-type" bind:value={editType} class="w-full border px-3 py-2 rounded">
            <option>Foreman</option>
            <option>Skilled</option>
            <option>Labor</option>
            <option>Other</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="edit-employee-rate" class="block font-semibold mb-1">Hourly Rate (₱) *</label>
          <input id="edit-employee-rate" type="number" step="0.01" bind:value={editRate} placeholder="0.00" class="w-full border px-3 py-2 rounded" />
        </div>

        <button
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full shadow-md"
          on:click={handleEditEmployee}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  {/if}

  <!-- Trash Modal -->
  {#if showTrashModal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
        <button
          class="absolute top-2 right-3 text-xl font-bold text-gray-600 hover:text-black"
          on:click={() => (showTrashModal = false)}
        >
          ×
        </button>

        <h2 class="text-xl font-bold mb-4">Deleted Employees</h2>
        <p class="text-sm text-gray-600 mb-4">Employees are automatically permanently deleted after 30 days.</p>

        <div class="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 class="font-semibold mb-2">Note:</h3>
          <ul class="text-sm text-gray-700 space-y-1">
            <li>• Deleted employees are moved to "Inactive" status</li>
            <li>• They will be automatically removed from the database after 30 days</li>
            <li>• You can restore them by clicking Restore below</li>
          </ul>
        </div>

        {#if deletedEmployees.length === 0}
          <div class="text-center text-gray-500 italic">No deleted employees.</div>
        {:else}
          <table class="w-full text-sm mb-2">
            <thead>
              <tr class="bg-gray-200">
                <th class="p-2 text-left">ID</th>
                <th class="p-2 text-left">Name</th>
                <th class="p-2 text-left">Type</th>
                <th class="p-2 text-left">Hourly Rate</th>
                <th class="p-2 text-left">Deleted At</th>
                <th class="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each deletedEmployees as emp}
                <tr>
                  <td class="p-2">{emp.employee_id}</td>
                  <td class="p-2">{emp.employee_name}</td>
                  <td class="p-2">{emp.employee_type}</td>
                  <td class="p-2">₱{emp.rate_per_hour.toFixed(2)}</td>
                  <td class="p-2">{emp.updated_at ? emp.updated_at.split('T')[0] : ''}</td>
                  <td class="p-2">
                    <button
                      class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow-md"
                      on:click={() => handleRestoreEmployee(emp)}
                      disabled={loading}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
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
