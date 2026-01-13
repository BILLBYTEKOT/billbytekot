# Requirements Document

## Introduction

This document specifies the requirements for implementing a comprehensive Refer & Earn system for BillByteKOT, along with enhanced SuperAdmin panel capabilities including referral tracking, pricing management, promotional campaigns, and detailed user business views. The system aims to increase customer acquisition through referral rewards while providing administrators with complete visibility and control over all aspects of the platform.

## Glossary

- **Referrer**: An existing BillByteKOT user who shares their referral code with potential new users
- **Referee**: A new user who signs up using a referral code
- **Referral_Code**: A unique alphanumeric code assigned to each user for sharing
- **Wallet_Balance**: Virtual currency balance credited to users as referral rewards
- **SuperAdmin_Panel**: Administrative interface for platform management and analytics
- **Pricing_Configuration**: System settings that control subscription pricing and discounts
- **Promotional_Campaign**: Time-limited offers and discounts configured by administrators

## Requirements

### Requirement 1: Referral Code Generation

**User Story:** As an existing user, I want to have a unique referral code, so that I can share it with potential new users and earn rewards.

#### Acceptance Criteria

1. WHEN a user account is created, THE System SHALL generate a unique alphanumeric referral code of 8 characters
2. THE Referral_Code SHALL be stored in the user's profile and remain constant throughout the account lifetime
3. WHEN a user requests their referral code, THE System SHALL return the code within 200ms
4. THE Referral_Code SHALL be case-insensitive for validation purposes

### Requirement 2: Referral Code Sharing

**User Story:** As a referrer, I want to easily share my referral code via multiple channels, so that I can maximize my referral opportunities.

#### Acceptance Criteria

1. WHEN a user accesses the Refer & Earn screen, THE System SHALL display their referral code prominently with a copy button
2. WHEN a user clicks the copy button, THE System SHALL copy the referral code to clipboard and show confirmation
3. WHEN a user clicks WhatsApp share, THE System SHALL open WhatsApp with a pre-formatted referral message
4. WHEN a user clicks SMS share, THE System SHALL open the device SMS app with a pre-formatted message
5. THE Share_Message SHALL include the referral code, discount amount (₹200), and app download link

### Requirement 3: Referral Code Entry on Signup

**User Story:** As a new user, I want to optionally enter a referral code during registration, so that I can receive a discount on my subscription.

#### Acceptance Criteria

1. WHEN a new user is on the signup page, THE System SHALL display an optional referral code input field
2. THE Referral_Code_Field SHALL be clearly marked as optional and not required for registration
3. WHEN a new user enters a referral code, THE System SHALL validate the code exists and is active
4. IF the referral code is invalid, THEN THE System SHALL display an error message "Invalid referral code"
5. IF the referral code belongs to the same user attempting registration, THEN THE System SHALL reject it as self-referral
6. WHEN a valid referral code is applied, THE System SHALL display the discount amount (₹200) to the new user
7. THE System SHALL allow registration to proceed without a referral code
8. THE System SHALL prevent the same mobile number from using multiple referral codes

### Requirement 4: Referral Reward Processing

**User Story:** As a referrer, I want to receive rewards when my referred users complete payment, so that I am incentivized to refer more users.

#### Acceptance Criteria

1. WHEN a referee completes their first subscription payment, THE System SHALL credit ₹300 to the referrer's wallet
2. WHEN a referral reward is credited, THE System SHALL update the referral status to REWARDED
3. WHEN a referral reward is credited, THE System SHALL send a notification to the referrer
4. THE System SHALL maintain an audit trail of all referral transactions
5. IF a referee's payment is refunded within 7 days, THEN THE System SHALL reverse the referrer's reward

### Requirement 5: Wallet Management

**User Story:** As a user with referral rewards, I want to view and use my wallet balance, so that I can apply it towards my subscription renewal.

#### Acceptance Criteria

1. WHEN a user accesses their wallet, THE System SHALL display total earned, used, and available balance
2. WHEN a user renews their subscription, THE System SHALL offer the option to apply wallet balance
3. THE Wallet_Balance SHALL be applicable only for subscription payments, not for refunds
4. WHEN wallet balance is used, THE System SHALL deduct the amount and record the transaction
5. THE System SHALL display wallet transaction history with dates and amounts

### Requirement 6: Referral Statistics Display

**User Story:** As a referrer, I want to see my referral statistics, so that I can track my referral performance.

#### Acceptance Criteria

1. WHEN a user views the Refer & Earn screen, THE System SHALL display total referrals count
2. THE System SHALL display breakdown of referrals by status (PENDING, COMPLETED, REWARDED)
3. THE System SHALL display total earnings from referrals
4. THE System SHALL display available wallet balance prominently

### Requirement 7: SuperAdmin Referral Tracking

**User Story:** As a super admin, I want to view and manage all referrals, so that I can monitor the referral program effectiveness.

#### Acceptance Criteria

1. WHEN a super admin accesses the Referrals tab, THE System SHALL display a paginated list of all referrals
2. THE Referral_List SHALL include referrer name, referee name, status, reward amount, and date
3. WHEN a super admin filters by status, THE System SHALL display only matching referrals
4. THE System SHALL display referral program analytics including total referrals, conversion rate, and total rewards paid
5. WHEN a super admin exports referral data, THE System SHALL generate a CSV file with all referral records

### Requirement 8: SuperAdmin Pricing Management

**User Story:** As a super admin, I want to manage subscription pricing, so that I can adjust prices and run promotional campaigns.

#### Acceptance Criteria

1. WHEN a super admin accesses the Pricing tab, THE System SHALL display current pricing configuration
2. THE Pricing_Configuration SHALL include regular price, campaign price, trial days, and discount percentages
3. WHEN a super admin updates pricing, THE System SHALL save changes and apply them to new subscriptions immediately
4. THE System SHALL maintain pricing history for audit purposes
5. WHEN campaign pricing is enabled, THE System SHALL display campaign price to users during the campaign period

### Requirement 9: SuperAdmin Promotional Campaigns

**User Story:** As a super admin, I want to create and manage promotional campaigns, so that I can drive user acquisition during special periods.

#### Acceptance Criteria

1. WHEN a super admin accesses the Promotions tab, THE System SHALL display active and past campaigns
2. THE Campaign_Configuration SHALL include title, discount percentage, start date, end date, and theme
3. WHEN a super admin creates a campaign, THE System SHALL validate date ranges do not overlap with existing campaigns
4. THE System SHALL automatically activate campaigns at start date and deactivate at end date
5. WHEN a campaign is active, THE System SHALL display promotional banners to users

### Requirement 10: SuperAdmin User Business Details View

**User Story:** As a super admin, I want to view detailed business information for each user, so that I can provide better support and understand user needs.

#### Acceptance Criteria

1. WHEN a super admin clicks "View Details" on a user, THE System SHALL display comprehensive business information
2. THE Business_Details SHALL include restaurant name, address, phone, GSTIN, FSSAI, and business type
3. THE Business_Details SHALL include subscription status, payment history, and usage statistics
4. THE System SHALL display user's menu items count, orders count, and revenue generated
5. WHEN viewing user details, THE System SHALL provide navigation buttons (Previous/Next) to browse through users

### Requirement 11: Fraud Prevention

**User Story:** As a system administrator, I want to prevent referral fraud, so that the referral program remains sustainable.

#### Acceptance Criteria

1. THE System SHALL prevent the same mobile number from being used for multiple referral rewards
2. THE System SHALL detect and block self-referrals based on email, phone, and device fingerprint
3. WHEN suspicious activity is detected, THE System SHALL flag the referral for manual review
4. THE System SHALL implement rate limiting on referral code applications (max 10 per hour per IP)
5. THE System SHALL require minimum payment completion before crediting referral rewards

### Requirement 12: Referral Program Rules Display

**User Story:** As a user, I want to understand the referral program rules, so that I know how to participate effectively.

#### Acceptance Criteria

1. WHEN a user views the Refer & Earn screen, THE System SHALL display program rules clearly
2. THE Rules_Section SHALL explain reward amounts for both referrer (₹300) and referee (₹200 discount)
3. THE Rules_Section SHALL explain when rewards are credited (after successful payment)
4. THE Rules_Section SHALL explain wallet usage terms and conditions
5. THE Rules_Section SHALL be accessible from the main Refer & Earn screen without additional navigation

