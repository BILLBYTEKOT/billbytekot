# Requirements Document

## Introduction

This document specifies requirements for comprehensive restaurant management enhancements including:
1. Real-time table status synchronization with direct database updates (bypassing cache for critical operations)
2. Immediate table occupancy updates when orders are created or bills are completed
3. Menu loading performance improvements with loading states
4. Inventory management enhancements with supplier and category management
5. Expense tracking and management system
6. Day Book/Cash Flow reporting

Root cause analysis indicates:
- Table status updates may be delayed due to Redis cache not invalidating properly
- Menu loading appears slow due to lack of loading indicators
- Inventory lacks supplier/category creation functionality
- No expense tracking capability exists currently

## Glossary

- **Table_Manager**: The system component responsible for managing table occupancy status
- **Direct_DB_Update**: Database operation that bypasses cache for immediate consistency
- **Cache_Invalidation**: Process of clearing cached data to force fresh retrieval
- **Loading_State**: UI indicator showing data is being fetched
- **Supplier**: A vendor who provides inventory items to the restaurant
- **Inventory_Category**: A classification group for inventory items
- **Expense**: A financial outflow for restaurant operations
- **Day_Book**: A daily record of all cash inflows and outflows
- **Cash_Flow_Report**: A summary of money movement in the business

## Requirements

### Requirement 1: Immediate Table Status Updates

**User Story:** As a restaurant staff member, I want table status to update immediately when orders are created or bills are completed, so that I can see accurate table availability in real-time.

#### Acceptance Criteria

1. WHEN an order is created for a table, THE Table_Manager SHALL immediately update the table status to "occupied" in the database
2. WHEN a bill is completed/paid, THE Table_Manager SHALL immediately update the table status to "available" in the database
3. WHEN a table status is updated, THE System SHALL invalidate the table cache and broadcast the change
4. THE System SHALL use direct database updates for table status changes, bypassing read cache
5. WHEN the Tables_Page loads, THE System SHALL fetch fresh data from the database
6. IF a table status update fails, THEN THE System SHALL retry once and display an error if still failing

### Requirement 2: Menu Loading Performance

**User Story:** As a staff member, I want to see a loading indicator when the menu is loading, so that I know the system is working and can wait appropriately.

#### Acceptance Criteria

1. WHEN the menu is being fetched, THE System SHALL display a loading spinner or skeleton UI
2. WHEN the menu fetch completes, THE System SHALL immediately display the menu items
3. IF the menu fetch fails, THEN THE System SHALL display an error message with a retry button
4. THE System SHALL cache menu items locally for faster subsequent loads
5. WHEN navigating to new order, THE System SHALL show loading state within 100ms of user action

### Requirement 3: Inventory Management Enhancements

**User Story:** As a restaurant manager, I want to create suppliers and categories for inventory items, so that I can organize and track my inventory effectively.

#### Acceptance Criteria

1. WHEN a user accesses the Inventory_Page, THE System SHALL display options to manage suppliers and categories
2. WHEN a user creates a new supplier, THE System SHALL save the supplier with name, contact, and address fields
3. WHEN a user creates a new category, THE System SHALL save the category with name and description fields
4. WHEN saving an inventory item, THE System SHALL allow selection of existing suppliers and categories
5. WHEN saving an inventory item, THE System SHALL persist all item data correctly to the database
6. IF saving an inventory item fails, THEN THE System SHALL display a specific error message
7. THE System SHALL validate required fields before saving inventory items

### Requirement 4: Expense Management

**User Story:** As a restaurant owner, I want to track and manage business expenses, so that I can monitor costs and maintain profitability.

#### Acceptance Criteria

1. WHEN a user accesses the Expense_Page, THE System SHALL display a list of recorded expenses
2. WHEN a user creates an expense, THE System SHALL save expense with date, amount, category, description, and payment method
3. THE System SHALL provide expense categories (Rent, Utilities, Salaries, Supplies, Maintenance, Marketing, Other)
4. WHEN viewing expenses, THE System SHALL allow filtering by date range and category
5. THE System SHALL calculate and display total expenses for the selected period
6. WHEN editing an expense, THE System SHALL update the record and recalculate totals
7. WHEN deleting an expense, THE System SHALL remove the record and recalculate totals

### Requirement 5: Day Book / Cash Flow Report

**User Story:** As a restaurant owner, I want to view a daily cash flow report, so that I can track all money movement and reconcile accounts.

#### Acceptance Criteria

1. WHEN a user accesses the Day_Book report, THE System SHALL display all cash inflows and outflows for the selected date
2. THE System SHALL categorize inflows as: Sales (Cash), Sales (Card), Sales (UPI), Other Income
3. THE System SHALL categorize outflows as: Expenses, Supplier Payments, Refunds, Other Payments
4. THE System SHALL calculate opening balance, total inflows, total outflows, and closing balance
5. WHEN selecting a date range, THE System SHALL aggregate data across all selected dates
6. THE System SHALL allow exporting the Day_Book report to PDF or Excel format
7. THE System SHALL display running balance throughout the day showing cash position at any point

