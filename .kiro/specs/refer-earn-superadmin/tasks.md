# Implementation Plan: Refer & Earn with SuperAdmin Enhancements

## Overview

This implementation plan breaks down the Refer & Earn feature and SuperAdmin enhancements into discrete, incremental tasks. Each task builds on previous work and integrates seamlessly with the existing BillByteKOT codebase without disrupting current functionality.

## Tasks

- [x] 1. Create Referral Database Schema and Backend Service
  - [x] 1.1 Add referral fields to user schema in server.py
    - Add referral_code, wallet_balance, referred_by, total_referrals, total_referral_earnings fields
    - Ensure backward compatibility with existing users
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create referrals collection indexes in MongoDB
    - Create index on referral_code for fast lookups
    - Create index on referrer_user_id and referee_user_id
    - _Requirements: 1.3_

  - [x] 1.3 Implement referral code generation function
    - Generate unique 8-character alphanumeric code
    - Ensure uniqueness check against existing codes
    - _Requirements: 1.1, 1.4_

  - [x] 1.4 Write property test for referral code generation
    - **Property 1: Referral Code Uniqueness and Format**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Implement Referral API Endpoints
  - [x] 2.1 Create GET /api/referral/code endpoint
    - Return user's referral code
    - Generate code if not exists
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Create POST /api/referral/validate endpoint
    - Validate referral code exists and is active
    - Check for self-referral
    - Check for duplicate mobile number
    - Return discount amount on success
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.8_

  - [x] 2.3 Write property test for referral validation
    - **Property 4: Referral Code Validation Correctness**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.8**

  - [x] 2.4 Create POST /api/referral/apply endpoint
    - Create referral record with PENDING status
    - Link referee to referrer
    - _Requirements: 3.3, 4.4_

  - [x] 2.5 Create POST /api/referral/complete endpoint
    - Process referral after payment completion
    - Credit referrer wallet with ₹300
    - Update referral status to REWARDED
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 2.6 Write property test for referral reward processing
    - **Property 5: Referral Reward Processing Integrity**
    - **Validates: Requirements 4.1, 4.2, 4.4**

  - [x] 2.7 Create GET /api/referral/summary endpoint
    - Return total referrals, status breakdown, earnings
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.8 Write property test for referral statistics
    - **Property 9: Referral Statistics Accuracy**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 3. Implement Wallet Service
  - [x] 3.1 Create wallet_transactions collection and model
    - Define transaction schema with type, amount, reference
    - _Requirements: 5.4, 5.5_

  - [x] 3.2 Implement wallet credit function
    - Add amount to user wallet_balance
    - Create transaction record
    - _Requirements: 4.1, 5.4_

  - [x] 3.3 Implement wallet debit function
    - Deduct amount from wallet_balance
    - Validate sufficient balance
    - Create transaction record
    - _Requirements: 5.3, 5.4_

  - [x] 3.4 Write property test for wallet balance consistency
    - **Property 7: Wallet Balance Consistency**
    - **Validates: Requirements 5.1, 5.4**

  - [x] 3.5 Create GET /api/wallet/balance endpoint
    - Return total earned, used, available balance
    - _Requirements: 5.1_

  - [x] 3.6 Create GET /api/wallet/transactions endpoint
    - Return paginated transaction history
    - _Requirements: 5.5_

  - [x] 3.7 Create POST /api/wallet/apply-to-subscription endpoint
    - Apply wallet balance to subscription payment
    - _Requirements: 5.2, 5.3_

- [x] 4. Checkpoint - Backend Referral System Complete
  - Ensure all referral and wallet tests pass
  - Verify API endpoints work correctly
  - Ask the user if questions arise

- [x] 5. Implement Fraud Prevention
  - [x] 5.1 Add duplicate mobile number check
    - Query referrals collection for existing mobile
    - Reject if already used
    - _Requirements: 11.1_

  - [x] 5.2 Add self-referral detection
    - Check email, phone, device fingerprint match
    - _Requirements: 11.2_

  - [x] 5.3 Implement rate limiting for referral applications
    - Track applications per IP per hour
    - Reject if exceeds 10 per hour
    - _Requirements: 11.4_

  - [x] 5.4 Write property test for fraud prevention
    - **Property 18: Fraud Prevention - Duplicate Mobile**
    - **Property 19: Fraud Prevention - Self Referral**
    - **Property 20: Rate Limiting Enforcement**
    - **Validates: Requirements 11.1, 11.2, 11.4**

- [x] 6. Add SuperAdmin Referral Tracking Endpoints
  - [x] 6.1 Create GET /api/super-admin/referrals endpoint
    - Return paginated list of all referrals
    - Support status filter
    - Include referrer name, referee name, status, reward, date
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 6.2 Write property test for referral list filtering
    - **Property 10: SuperAdmin Referral List Filtering**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 6.3 Create GET /api/super-admin/referrals/analytics endpoint
    - Return total referrals, conversion rate, total rewards paid
    - _Requirements: 7.4_

  - [x] 6.4 Write property test for referral analytics
    - **Property 11: Referral Analytics Calculation**
    - **Validates: Requirements 7.4**

  - [x] 6.5 Create GET /api/super-admin/referrals/export endpoint
    - Generate CSV with all referral records
    - _Requirements: 7.5_

  - [x] 6.6 Write property test for CSV export
    - **Property 12: CSV Export Completeness**
    - **Validates: Requirements 7.5**

- [x] 7. Add SuperAdmin Pricing Management Endpoints
  - [x] 7.1 Create pricing_config collection and model
    - Store regular_price, campaign_price, referral settings
    - _Requirements: 8.2_

  - [x] 7.2 Create GET /api/super-admin/pricing endpoint
    - Return current pricing configuration
    - _Requirements: 8.1, 8.2_

  - [x] 7.3 Create PUT /api/super-admin/pricing endpoint
    - Update pricing configuration
    - Maintain pricing history
    - _Requirements: 8.3, 8.4_

  - [x] 7.4 Write property test for pricing configuration
    - **Property 13: Pricing Configuration Completeness**
    - **Property 14: Pricing Update Persistence**
    - **Validates: Requirements 8.2, 8.3**

- [x] 8. Add SuperAdmin Campaign Management Endpoints
  - [x] 8.1 Create campaigns collection and model
    - Store title, discount, dates, theme
    - _Requirements: 9.2_

  - [x] 8.2 Create GET /api/super-admin/campaigns endpoint
    - Return active and past campaigns
    - _Requirements: 9.1_

  - [x] 8.3 Create POST /api/super-admin/campaigns endpoint
    - Create new campaign with date overlap validation
    - _Requirements: 9.3_

  - [x] 8.4 Write property test for campaign date overlap
    - **Property 15: Campaign Date Overlap Prevention**
    - **Validates: Requirements 9.3**

  - [x] 8.5 Implement campaign activation/deactivation logic
    - Auto-activate at start date, deactivate at end date
    - _Requirements: 9.4_

  - [x] 8.6 Write property test for campaign activation
    - **Property 16: Campaign Activation Logic**
    - **Validates: Requirements 9.4**

- [x] 9. Add SuperAdmin User Business Details Endpoint
  - [x] 9.1 Create GET /api/super-admin/users/{user_id}/business-details endpoint
    - Return comprehensive business information
    - Include restaurant name, address, phone, GSTIN, FSSAI
    - Include subscription status, payment history
    - Include menu items count, orders count, revenue
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 9.2 Write property test for business details completeness
    - **Property 17: Business Details Completeness**
    - **Validates: Requirements 10.2, 10.3, 10.4**

  - [x] 9.3 Create GET /api/super-admin/users/navigation endpoint
    - Return previous and next user IDs for navigation
    - _Requirements: 10.5_

- [x] 10. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Verify all SuperAdmin endpoints work correctly
  - Ask the user if questions arise

- [x] 11. Create Frontend Refer & Earn Page
  - [x] 11.1 Create ReferEarnPage.js component
    - Add to App.js routes
    - Create page layout with header
    - _Requirements: 2.1_

  - [x] 11.2 Implement referral code display section
    - Show referral code prominently
    - Add copy to clipboard button with confirmation
    - _Requirements: 2.1, 2.2_

  - [x] 11.3 Implement share buttons
    - WhatsApp share with pre-formatted message
    - SMS share with pre-formatted message
    - Copy link button
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 11.4 Implement rewards summary section
    - Display total referrals, earnings, wallet balance
    - Show status breakdown cards
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 11.5 Implement wallet transaction history
    - Display paginated transaction list
    - Show type, amount, date for each transaction
    - _Requirements: 5.5_

  - [x] 11.6 Add program rules section
    - Display referral program rules
    - Explain reward amounts and conditions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Add Referral Code to Signup Page
  - [x] 12.1 Add optional referral code input field to LoginPage.js
    - Mark field as optional
    - Add validation on blur
    - _Requirements: 3.1, 3.2_

  - [x] 12.2 Implement referral code validation on signup
    - Call validate endpoint when code entered
    - Show discount amount on valid code
    - Show error on invalid code
    - _Requirements: 3.3, 3.4, 3.6_

  - [x] 12.3 Apply referral during registration
    - Send referral code with registration request
    - Create referral record on successful signup
    - _Requirements: 3.7_

- [x] 13. Add Menu Item for Refer & Earn
  - [x] 13.1 Add Refer & Earn menu item to Layout.js
    - Add Gift icon and label
    - Link to /refer-earn route
    - _Requirements: 2.1_

- [x] 14. Checkpoint - Frontend Referral System Complete
  - Test referral code display and sharing
  - Test signup with referral code
  - Ask the user if questions arise

- [x] 15. Enhance SuperAdmin Panel - Referrals Tab
  - [x] 15.1 Add Referrals tab to SuperAdminPage.js
    - Add tab button to navigation
    - Create ReferralsTab component
    - _Requirements: 7.1_

  - [x] 15.2 Implement referral list with pagination
    - Display referrer, referee, status, reward, date
    - Add pagination controls
    - _Requirements: 7.1, 7.2_

  - [x] 15.3 Add status filter dropdown
    - Filter by PENDING, COMPLETED, REWARDED, ALL
    - _Requirements: 7.3_

  - [x] 15.4 Add referral analytics cards
    - Display total referrals, conversion rate, rewards paid
    - _Requirements: 7.4_

  - [x] 15.5 Add export to CSV button
    - Download referral data as CSV
    - _Requirements: 7.5_

- [x] 16. Enhance SuperAdmin Panel - Pricing Tab
  - [x] 16.1 Add Pricing tab to SuperAdminPage.js
    - Add tab button to navigation
    - Create PricingTab component
    - _Requirements: 8.1_

  - [x] 16.2 Implement pricing configuration form
    - Regular price input
    - Campaign price input
    - Trial days input
    - Referral discount/reward inputs
    - _Requirements: 8.2_

  - [x] 16.3 Add save pricing button with confirmation
    - Save changes to backend
    - Show success/error toast
    - _Requirements: 8.3_

- [x] 17. Enhance SuperAdmin Panel - Promotions Tab
  - [x] 17.1 Verify Promotions tab exists in SuperAdminPage.js
    - Ensure tab is accessible
    - _Requirements: 9.1_

  - [x] 17.2 Add campaign list display
    - Show active and past campaigns
    - Display title, discount, dates, status
    - _Requirements: 9.1, 9.2_

  - [x] 17.3 Add create campaign modal
    - Form for title, discount, dates, theme
    - Date overlap validation
    - _Requirements: 9.2, 9.3_

- [x] 18. Enhance SuperAdmin Panel - User Details Modal
  - [x] 18.1 Enhance existing business details modal
    - Add comprehensive business information display
    - Show restaurant name, address, phone, GSTIN, FSSAI
    - _Requirements: 10.2_

  - [x] 18.2 Add subscription and usage statistics
    - Display subscription status, payment history
    - Show menu items count, orders count, revenue
    - _Requirements: 10.3, 10.4_

  - [x] 18.3 Add Previous/Next navigation buttons
    - Navigate between users without closing modal
    - _Requirements: 10.5_

- [x] 19. Integrate Referral with Payment Flow
  - [x] 19.1 Apply referral discount during subscription payment
    - Reduce payment amount by ₹200 for referred users
    - _Requirements: 3.6_

  - [x] 19.2 Trigger referral completion on successful payment
    - Call complete endpoint after payment success
    - Credit referrer wallet
    - _Requirements: 4.1, 4.2_

  - [x] 19.3 Add wallet balance option to subscription page
    - Show available wallet balance
    - Allow applying to payment
    - _Requirements: 5.2_

- [x] 20. Final Checkpoint - Complete System
  - Ensure all tests pass
  - Verify end-to-end referral flow works
  - Verify SuperAdmin features work correctly
  - Ask the user if questions arise

## Notes

- All tasks including property-based tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Implementation adds new files/endpoints without modifying existing core functionality

