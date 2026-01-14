# Implementation Plan: Platform Fixes and Enhancements

## Overview

This implementation plan addresses sale promotion activation, superadmin user management, campaign pricing, and inventory enhancements. Tasks are organized to build incrementally with early validation.

## Tasks

- [x] 1. Fix Sale Offer Theme System and Landing Page Integration
  - [x] 1.1 Add early_adopter theme to SaleBanner themes configuration
    - Add theme config with: emerald/teal/cyan gradient, Rocket icon, "EARLY ADOPTER" badge, 🚀 pattern
    - Ensure all 10 themes are properly defined in the themes object
    - _Requirements: 7.1, 7.3_

  - [x] 1.2 Fix Landing Page sale offer data fetching
    - Update LandingPage to fetch from `/public/sale-offer` on mount
    - Pass saleOffer data to all banner components (SaleBanner, SaleOfferSection, CampaignBanner)
    - Handle enabled=false and API errors gracefully
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 1.3 Add floating banners to Landing Page
    - Add SaleBanner with position="corner" (bottom-right)
    - Add SaleBanner with position="side" (right-center, desktop only)
    - Pass saleOffer data to floating banners
    - _Requirements: 9.1, 9.2_

  - [x] 1.4 Write property test for theme rendering consistency
    - **Property 1: Sale Offer Theme Rendering Consistency**
    - **Validates: Requirements 1.1, 1.2, 7.4, 7.5**

- [x] 2. Fix SuperAdmin User Listing and Business Details
  - [x] 2.1 Debug and fix fetchUsers function in SuperAdminPage
    - Verify `/super-admin/users/list` endpoint returns all users
    - Ensure users state is properly set from API response
    - Add error handling with retry option
    - _Requirements: 3.1, 3.4_

  - [x] 2.2 Fix viewBusinessDetails function
    - Verify `/super-admin/users/{id}/details` endpoint works
    - Ensure all business fields are fetched and displayed
    - Fix Previous/Next navigation data fetching
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [x] 2.3 Verify user filtering, searching, and sorting
    - Test getFilteredUsers function with all filter options
    - Verify search matches username and email
    - Verify sorting by created_at, subscription_expires_at, username
    - _Requirements: 3.5, 3.6, 3.7_

  - [x] 2.4 Write property tests for user filtering and sorting
    - **Property 5: User Filtering Correctness**
    - **Property 6: User Search Correctness**
    - **Property 7: User Sorting Correctness**
    - **Validates: Requirements 3.5, 3.6, 3.7**

- [x] 3. Checkpoint - Verify Sale Offer and User Management
  - Ensure all tests pass, ask the user if questions arise.
  - Test sale offer activation in superadmin and verify landing page displays it
  - Test user listing and business details viewing

- [x] 4. Fix Campaign-Driven Pricing Updates
  - [x] 4.1 Update backend pricing endpoint to include campaign logic
    - Verify `/public/pricing` returns campaign_active status
    - Ensure campaign_price is calculated correctly when active
    - Check campaign date validation (start_date, end_date)
    - _Requirements: 4.3, 4.4_

  - [x] 4.2 Update SubscriptionPage to use campaign pricing
    - Fetch pricing from `/public/pricing`
    - Display campaign price when campaign_active=true
    - Show original price with strikethrough
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Write property test for campaign pricing calculation
    - **Property 8: Campaign Pricing Calculation**
    - **Property 9: Campaign Date-Based Pricing**
    - **Validates: Requirements 4.3, 4.4**

- [x] 5. Fix Inventory Item Addition
  - [x] 5.1 Debug inventory creation API call
    - Add proper Authorization header to POST /inventory
    - Verify token is being sent correctly
    - Add detailed error logging for debugging
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 5.2 Fix form validation in InventoryPage
    - Validate all required fields before submission
    - Display specific error messages for each validation failure
    - Ensure numeric fields are properly parsed
    - _Requirements: 5.2_

  - [x] 5.3 Fix inventory list refresh after creation
    - Call fetchInventory after successful creation
    - Close dialog and reset form on success
    - Update lowStock list after changes
    - _Requirements: 5.5, 5.6_

  - [x] 5.4 Write property test for inventory validation
    - **Property 10: Inventory Validation Completeness**
    - **Property 11: Inventory Edit Pre-population**
    - **Validates: Requirements 5.2, 5.6**

- [x] 6. Checkpoint - Verify Pricing and Inventory Fixes
  - Ensure all tests pass, ask the user if questions arise.
  - Test campaign pricing on subscription page
  - Test inventory item creation with different roles

- [x] 7. Add Inventory Purchase Order Feature
  - [x] 7.1 Create backend purchase order endpoints
    - POST /inventory/purchases - Create purchase order
    - GET /inventory/purchases - List purchase orders
    - GET /inventory/purchases/{id} - Get purchase order details
    - Implement stock quantity update on purchase save
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Add Purchases tab to InventoryPage
    - Add "Purchases" tab to TabsList
    - Create PurchasesTabContent component
    - Display purchase history with required fields
    - _Requirements: 6.1, 6.6_

  - [x] 7.3 Create purchase order form
    - Supplier dropdown from existing suppliers
    - Multi-item line entry with quantity and unit cost
    - Auto-calculate total amount
    - Purchase date picker
    - _Requirements: 6.2, 6.4, 6.5_

  - [x] 7.4 Implement purchase order submission
    - Submit to POST /inventory/purchases
    - Refresh inventory list after successful save
    - Display success/error messages
    - _Requirements: 6.3_

  - [x] 7.5 Write property tests for purchase orders
    - **Property 12: Purchase Order Stock Update**
    - **Property 13: Purchase Order Total Calculation**
    - **Validates: Requirements 6.3, 6.7**

- [x] 8. Add Theme Selector to SuperAdmin Sale Offer
  - [x] 8.1 Add theme dropdown to sale offer configuration
    - Create dropdown with all 10 theme options
    - Show theme preview/description for each option
    - Save selected theme to sale offer config
    - _Requirements: 7.2_

  - [x] 8.2 Update sale offer save to include theme
    - Include theme field in PUT /super-admin/sale-offer
    - Verify theme is persisted and returned by API
    - _Requirements: 7.2, 7.4_

- [x] 9. Ensure Banner Data Consistency
  - [x] 9.1 Centralize sale offer data in LandingPage
    - Create useSaleOfferData hook for data fetching
    - Pass same data object to all banner components
    - Ensure countdown timers use same end_date
    - _Requirements: 8.1, 8.2_

  - [x] 9.2 Implement promotional priority logic
    - Check for both sale offer and campaign
    - Prioritize sale offer when both exist
    - Fall back to campaign if no sale offer
    - _Requirements: 8.5, 8.6_

  - [x] 9.3 Write property test for banner data consistency
    - **Property 14: Banner Data Consistency**
    - **Property 15: Promotional Priority**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.6**

- [x] 10. Implement Banner Dismissal Persistence
  - [x] 10.1 Add localStorage dismissal tracking
    - Store dismissal timestamp in localStorage
    - Check timestamp on component mount
    - Hide banner if dismissed within 24 hours
    - _Requirements: 9.3, 9.4_

  - [x] 10.2 Write property test for dismissal persistence
    - **Property 17: Banner Dismissal Persistence**
    - **Validates: Requirements 9.4**

- [-] 11. Final Checkpoint - Complete Integration Testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete sale offer flow: create in superadmin → display on landing page
  - Test all theme options render correctly
  - Test inventory purchase order creates and updates stock
  - Verify all floating banners display and dismiss correctly

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
