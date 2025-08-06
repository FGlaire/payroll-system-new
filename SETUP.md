# Payroll System Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- Supabase account and project

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
Run the SQL scripts provided in your Supabase SQL editor to create the necessary tables and functions.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Database Schema

### Tables Created:
- `employee_master` - Employee information
- `payroll_transactions` - Payroll transaction records

### Views Created:
- `active_employees` - Active employees with overtime multipliers
- `payroll_summary` - Payroll transactions with employee details
- `payroll_register` - Summary by pay period
- `employee_payroll_history` - Employee payroll history

### Functions Created:
- `calculate_payroll()` - Calculate payroll amounts
- `insert_payroll_transaction()` - Insert payroll transaction
- `get_overtime_multiplier()` - Get overtime multiplier by employee type

## Features

### Employee Management
- Add new employees
- View all active employees
- Filter by employee type
- Search by name or ID

### Payslip Generation
- Validate employee ID
- Input regular hours, overtime, allowances, and deductions
- Generate payslip with calculations
- Download as PDF

### Payroll History
- View all payroll transactions
- Filter by employee type
- Search by employee name or ID

## Notes
- The system uses the database functions for payroll calculations
- Overtime multipliers are applied based on employee type
- All data is stored in Supabase for persistence 