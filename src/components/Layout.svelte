<script>
  import { push } from 'svelte-spa-router';
  export let currentPage = "";

  let payrollOpen = true;
  let financialOpen = false;
  let sidebarOpen = false;

  const isActive = (/** @type {string} */ page) => page === currentPage;

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="flex flex-col h-screen">
  <!-- Header with hamburger pag maliit screen -->
  <header class="flex items-center justify-between bg-black text-white w-full h-[75.2px] px-4 py-4 box-border shadow z-50">
  <div class="flex items-center gap-4">
    <button class="lg:hidden focus:outline-none" on:click={toggleSidebar}>
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <img src="/fusion_build_logo_1.png" alt="FusionBuild Logo" class="h-10 w-auto" />
  </div>
</header>



  {#if sidebarOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" on:click={toggleSidebar}></div>
  {/if}

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar of all pages within Payroll Dropdown -->
    <aside class={`w-64 bg-black text-white p-4 shadow-lg fixed top-16 left-0 h-[calc(100vh-64px)] overflow-y-auto z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:translate-x-0 lg:block`}>
      <ul class="space-y-1">
        <li class="block py-2 px-4 rounded cursor-pointer hover:bg-[#001f3f] hover:text-yellow-400" class:text-yellow-400={isActive('dashboard')}>Dashboard</li>
        <li class="block py-2 px-4 rounded cursor-pointer hover:bg-[#001f3f] hover:text-yellow-400" class:text-yellow-400={isActive('projects')}>Projects</li>

        <!-- Financial Overview Dropdown -->
        <li>
          <button class="block w-full py-2 px-4 rounded flex justify-between items-center hover:bg-[#001f3f] hover:text-yellow-400" on:click={() => (financialOpen = !financialOpen)}>
            Financial Overview
            <span>{financialOpen ? "▲" : "▼"}</span>
          </button>

          {#if financialOpen}
            <ul class="ml-2 mt-1 space-y-1">
              <li class="py-2 text-sm text-gray-400 italic">to be connect sa existing</li>
            </ul>
          {/if}
        </li>

        <!-- Payroll Dropdown -->
        <li>
          <button class="block w-full py-2 px-4 rounded flex justify-between items-center hover:bg-[#001f3f] hover:text-yellow-400" on:click={() => (payrollOpen = !payrollOpen)}>
            Payroll
            <span>{payrollOpen ? "▲" : "▼"}</span>
          </button>

          {#if payrollOpen}
            <ul class="ml-2 mt-1 space-y-1">
              <li class="block py-2 px-4 rounded cursor-pointer hover:bg-[#001f3f] hover:text-yellow-400" class:text-yellow-400={isActive('employee')} on:click={() => { push('/'); toggleSidebar(); }}>Employee Management</li>
              <li class="block py-2 px-4 rounded cursor-pointer hover:bg-[#001f3f] hover:text-yellow-400" class:text-yellow-400={isActive('payslip')} on:click={() => { push('/payslip'); toggleSidebar(); }}>Payslip</li>
              <li class="block py-2 px-4 rounded cursor-pointer hover:bg-[#001f3f] hover:text-yellow-400" class:text-yellow-400={isActive('history')} on:click={() => { push('/history'); toggleSidebar(); }}>Payroll History</li>
            </ul>
          {/if}
        </li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 bg-gray-100 p-8 overflow-auto ml-0 lg:ml-64">
      <slot />
    </main>
  </div>
</div>
