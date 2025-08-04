<script>
  import Layout from "../components/Layout.svelte";

  let filter = "All";
  let search = "";

  // TODO: REMOVE THIS DUMMY DATA. Fetch payroll history from san nakalagay na table sa supabase
  let payrollHistory = [
    {
      id: 1,
      name: "Rullan, Andrei",
      type: "Foreman",
      days: 24,
      overtime: 5,
      rate: 125,
      cashAdvance: 1000,
      total: 4550,
    },
    {
      id: 2,
      name: "Bacolod, John",
      type: "Skilled",
      days: 22,
      overtime: 4,
      rate: 87.5,
      cashAdvance: 800,
      total: 3700,
    },
  ];

  // fetch data from Supabase plsss

  $: filteredHistory = payrollHistory.filter((entry) => {
    return (
      (filter === "All" || entry.type === filter) &&
      (entry.name.toLowerCase().includes(search.toLowerCase()) ||
        entry.id.toString().includes(search))
    );
  });
</script>

<Layout currentPage="history">
  <h1 class="text-3xl font-bold mb-6">Payroll History</h1>

  <!-- Filter and Search Row na hahanapin sa supabase tables -->
  <div class="flex justify-between items-center mb-4">
    <div class="flex items-center gap-2">
      <label class="text-md font-medium">Filter:</label>
      <select
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
      <label class="text-md font-medium">Search:</label>
      <input
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

  <!-- Table for Employees na ok na payslip -->
  <div class="bg-white rounded-lg p-4 shadow overflow-x-auto">
    <h3 class="text-lg font-semibold mb-4">Employee</h3>

    <table class="w-full text-left border-collapse">
      <thead class="bg-[#002244] text-white">
        <tr>
          <th class="px-4 py-2 rounded-tl-lg">ID</th>
          <th class="px-4 py-2">Name</th>
          <th class="px-4 py-2">Type</th>
          <th class="px-4 py-2">No. of Days</th>
          <th class="px-4 py-2">Overtime</th>
          <th class="px-4 py-2">Hourly Rate</th>
          <th class="px-4 py-2">Cash Advance</th>
          <th class="px-4 py-2">Total</th>
          <th class="px-4 py-2 rounded-tr-lg">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredHistory as record, index (record.id)}
          <tr class="record-row {index === filteredHistory.length - 1 ? 'rounded-bl-lg rounded-br-lg' : ''}">
            <td class="px-4 py-2">{record.id}</td>
            <td class="px-4 py-2">{record.name}</td>
            <td class="px-4 py-2">{record.type}</td>
            <td class="px-4 py-2">{record.days}</td>
            <td class="px-4 py-2">{record.overtime}</td>
            <td class="px-4 py-2">₱{record.rate.toFixed(2)}</td>
            <td class="px-4 py-2">₱{record.cashAdvance.toFixed(2)}</td>
            <td class="px-4 py-2">₱{record.total.toFixed(2)}</td>
            <td class="px-4 py-2">
              <button class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm shadow-md">
                View
              </button>
            </td>
          </tr>
        {/each}

        {#if filteredHistory.length === 0}
          <tr>
            <td colspan="9" class="px-4 py-4">
              <div class="bg-gray-200 text-gray-600 italic text-center rounded-lg py-2">
                No matching records found.
              </div>
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</Layout>

<style>
  .record-row {
    background-color: rgb(107 114 128 / var(--tw-border-opacity, 1));
    color: white;
  }
</style>
