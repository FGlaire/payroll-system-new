<script>
// @ts-nocheck

  import Layout from "../components/Layout.svelte";

  let showAddEmployeeModal = false;
  let idMode = "Manual";

  let totalEmployees = 3;
  let filter = "All";
  let searchQuery = "";

  // TODO: REMOVE THIS DUMMY DATA (paltan nung nafetch sa supabase)
  let employees = [
    { id: 1, name: "Rullan, Andrei", type: "Foreman", rate: 125 },
    { id: 2, name: "Bacolod, John", type: "Skilled", rate: 87.5 },
    { id: 3, name: "Dancis, Jessica", type: "Labor", rate: 75 },
  ];

  // TODO: These states its ok to keep, but you may reset them after DB operations
  let newName = "";
  let newId = "";
  let newType = "";
  let newRate = "";
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

  
  <!-- Filter and Search Connect pa sa Db-->
  <div class="flex flex-wrap items-center gap-4 mb-4">
    <div class="flex items-center gap-2">
      <label class="font-medium">Filter:</label>
      <select bind:value={filter} class="border rounded px-3 py-2">
        <option>All</option>
        <option>Foreman</option>
        <option>Skilled</option>
        <option>Labor</option>
      </select>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label class="font-medium">Search:</label>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Enter name or ID..."
        class="border rounded px-3 py-2 w-48 sm:w-60"
      />
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded shadow-md"
      >
        Search
      </button>
    </div>
  </div>

  <!-- Table for Saved Records galing Db-->
  <div class="bg-white rounded-xl p-4 sm:p-6 shadow overflow-x-auto">
    <h3 class="text-lg font-semibold mb-4">Saved Records</h3>
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
        <!-- TODO: REPLACE employees loop with Supabase-fetched data -->
        {#each employees as emp, i}
          <tr class="record-row">
            <td class="p-3">{emp.id}</td>
            <td class="p-3">{emp.name}</td>
            <td class="p-3">{emp.type}</td>
            <td class="p-3">₱{emp.rate.toFixed(2)}</td>
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
          <label class="block font-semibold mb-1">Name</label>
          <input bind:value={newName} class="w-full border px-3 py-2 rounded" />
        </div>

        <!-- For ID, since automatic na sa database yung id pedeng tanggalin na lang manual -->
        <div class="mb-3">
          <label class="block font-semibold mb-1">ID</label>
          <select bind:value={idMode} class="w-full border px-3 py-2 rounded">
            <option>Manual</option>
            <option>Automatic</option>
          </select>
        </div>

        {#if idMode === "Manual"}
          <div class="mb-3">
            <label class="block font-semibold mb-1 text-red-600">
              *Create new ID number
            </label>
            <input bind:value={newId} class="w-full border px-3 py-2 rounded" />
          </div>
        {:else}
          <p class="text-sm text-gray-600 mb-3">
            ID will be generated automatically.
          </p>
        {/if}

        <!-- For Type or Position -->
        <div class="mb-3">
          <label class="block font-semibold mb-1">Type</label>
          <select bind:value={newType} class="w-full border px-3 py-2 rounded">
            <option disabled selected value="">Select type</option>
            <option>Foreman</option>
            <option>Skilled</option>
            <option>Labor</option>
          </select>
        </div>

        <!-- For Hourly Rate gawing number please -->
        <div class="mb-3">
          <label class="block font-semibold mb-1">Hourly Rate</label>
          <input bind:value={newRate} class="w-full border px-3 py-2 rounded" />
        </div>

        <button
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full shadow-md"
          on:click={() => {
            // TODO: REPLACE this logic with Supabase INSERT call
            const idToUse =
              idMode === "Manual"
                ? newId
                : Math.max(...employees.map((e) => e.id)) + 1;
            employees = [
              ...employees,
              {
                id: idToUse,
                name: newName,
                type: newType,
                rate: parseFloat(newRate),
              },
            ];
            totalEmployees = employees.length;
            showAddEmployeeModal = false;

            newName = "";
            newId = "";
            newType = "";
            newRate = "";
            idMode = "Manual";
          }}
        >
          Save
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
