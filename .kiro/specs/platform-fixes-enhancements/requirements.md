# Requirements Document

## Introduction

This document outlines the requirements for fixing multiple platform issues including sale promotion activation on the landing page, superadmin user business details visibility, user listing functionality, campaign-driven pricing updates, and inventory management enhancements with purchase tracking.

## Glossary

- **Landing_Page**: The public-facing homepage that displays promotional offers and sale banners
- **Sale_Offer**: A time-limited promotional discount configured through the superadmin panel
- **Campaign**: A marketing promotion with specific dates, discounts, and display settings
- **SuperAdmin_Panel**: Administrative interface for managing users, promotions, and system settings
- **Business_Details**: User's restaurant/business configuration including name, address, GSTIN, FSSAI
- **Inventory_System**: Stock management module for tracking items, suppliers, and purchases
- **Purchase_Order**: A record of inventory items purchased from suppliers
- **Pricing_Configuration**: System-wide pricing settings that can be modified by active campaigns

## Requirements

### Requirement 1: Sale Promotion Activation on Landing Page

**User Story:** As a visitor, I want to see active sale promotions on the landing page, so that I can take advantage of special offers.

#### Acceptance Criteria

1. WHEN a sale offer is enabled in the superadmin panel, THE Landing_Page SHALL display the SaleBanner component with the configured offer details
2. WHEN the sale offer has an "early adopter" theme configured, THE Landing_Page SHALL render the banner with the early adopter visual styling
3. WHEN fetching sale offer data from `/public/sale-offer` endpoint, THE Landing_Page SHALL handle both enabled and disabled states gracefully
4. IF the sale offer API returns an error, THEN THE Landing_Page SHALL continue to render without the promotional banner
5. WHEN a sale offer is active, THE SaleOfferSection component SHALL display countdown timer, pricing, and call-to-action button
6. WHEN the sale offer expires (based on valid_until or end_date), THE Landing_Page SHALL automatically hide the promotional content

### Requirement 2: SuperAdmin User Business Details Visibility

**User Story:** As a superadmin, I want to view complete business details for any user, so that I can provide support and verify business information.

#### Acceptance Criteria

1. WHEN a superadmin clicks the "View Details" button for a user, THE SuperAdmin_Panel SHALL fetch and display the user's complete business details
2. THE Business_Details modal SHALL display: restaurant name, business type, phone, email, address, GSTIN, and FSSAI license
3. WHEN business details are loading, THE SuperAdmin_Panel SHALL display a loading indicator
4. IF the business details API returns an error, THEN THE SuperAdmin_Panel SHALL display an appropriate error message
5. THE Business_Details modal SHALL include Previous/Next navigation buttons to browse between users
6. WHEN navigating between users, THE SuperAdmin_Panel SHALL update the business details without closing the modal

### Requirement 3: SuperAdmin User Listing Functionality

**User Story:** As a superadmin, I want to view all registered users with their details, so that I can manage the user base effectively.

#### Acceptance Criteria

1. WHEN the superadmin navigates to the Users tab, THE SuperAdmin_Panel SHALL fetch and display all users from the `/super-admin/users/list` endpoint
2. THE user list SHALL display: username, email, role, subscription status, subscription expiry, and activity metrics
3. WHEN the users API returns an empty list, THE SuperAdmin_Panel SHALL display a "No users found" message
4. IF the users API returns an error, THEN THE SuperAdmin_Panel SHALL display an error state with retry option
5. THE SuperAdmin_Panel SHALL support filtering users by status (all, active, trial, expired)
6. THE SuperAdmin_Panel SHALL support searching users by username or email
7. THE SuperAdmin_Panel SHALL support sorting users by created date, subscription expiry, or username

### Requirement 4: Campaign-Driven Pricing Updates

**User Story:** As a business owner, I want pricing pages to reflect active campaign discounts, so that customers see accurate promotional pricing.

#### Acceptance Criteria

1. WHEN a campaign is active, THE Subscription_Page SHALL display the campaign price instead of regular price
2. WHEN a campaign is active, THE Pricing_Display SHALL show both original price (strikethrough) and discounted price
3. WHEN fetching pricing from `/public/pricing` endpoint, THE System SHALL return campaign-adjusted prices if a campaign is active
4. WHEN a campaign ends, THE Pricing_Display SHALL automatically revert to regular pricing
5. THE Inventory_Page pricing display SHALL reflect any active campaign discounts for subscription-related features

### Requirement 5: Inventory Item Addition Fix

**User Story:** As a restaurant manager, I want to add new inventory items, so that I can track my stock levels.

#### Acceptance Criteria

1. WHEN a user with admin or cashier role clicks "Add Item", THE Inventory_System SHALL open the item creation dialog
2. WHEN submitting a new inventory item, THE Inventory_System SHALL validate all required fields (name, quantity, unit, min_quantity, price_per_unit)
3. WHEN the inventory API returns a 401 error, THE Inventory_System SHALL display an authentication error message
4. WHEN the inventory API returns a 403 error, THE Inventory_System SHALL display an authorization error message
5. IF the inventory creation succeeds, THEN THE Inventory_System SHALL refresh the inventory list and close the dialog
6. WHEN editing an existing item, THE Inventory_System SHALL pre-populate the form with current values

### Requirement 6: Inventory Purchase Order Feature

**User Story:** As a restaurant manager, I want to record purchase orders for inventory items, so that I can track procurement and costs.

#### Acceptance Criteria

1. THE Inventory_System SHALL provide a "Purchases" tab for managing purchase orders
2. WHEN creating a purchase order, THE System SHALL capture: supplier, items, quantities, unit costs, total amount, and purchase date
3. WHEN a purchase order is saved, THE Inventory_System SHALL automatically update stock quantities for included items
4. THE Purchase_Order form SHALL allow selecting from existing suppliers
5. THE Purchase_Order form SHALL allow adding multiple line items
6. WHEN viewing purchase history, THE System SHALL display: date, supplier, items, total amount, and status
7. THE Inventory_System SHALL calculate and display total purchase value for reporting

### Requirement 7: Multiple Theme Options for Sale Banner

**User Story:** As a marketing admin, I want to select from multiple themes for sale banners, so that I can customize promotions for different occasions.

#### Acceptance Criteria

1. THE SaleBanner component SHALL support multiple theme options: default, early_adopter, diwali, christmas, newyear, flash, blackfriday, summer, republic, holi
2. WHEN configuring a sale offer in superadmin, THE System SHALL provide a dropdown to select from all available themes
3. WHEN the early_adopter theme is selected, THE SaleBanner SHALL display with: "Early Adopter" badge, special gradient colors, and urgency messaging
4. WHEN any theme is selected, THE SaleBanner SHALL apply the corresponding color scheme, icon, and pattern
5. THE Landing_Page SHALL correctly render the selected theme across all banner positions

### Requirement 8: Landing Page Banner Synchronization

**User Story:** As a visitor, I want all promotional banners on the landing page to show consistent information, so that I see the same offer everywhere.

#### Acceptance Criteria

1. WHEN a sale offer is active, THE Landing_Page SHALL update ALL banner components: TopBanner, SaleBanner (top), SaleBanner (hero), SaleBanner (corner), SaleBanner (side), and SaleOfferSection
2. WHEN the sale offer configuration changes, THE Landing_Page SHALL refresh all banner components with updated data
3. THE floating corner banner SHALL display the same discount percentage and pricing as the main sale section
4. THE floating side banner SHALL display the same countdown timer and pricing as other banners
5. WHEN a campaign is running, THE CampaignBanner component SHALL display campaign-specific messaging and countdown
6. IF multiple promotional elements exist (sale offer + campaign), THEN THE Landing_Page SHALL prioritize sale offer display

### Requirement 9: Floating Banner Visibility

**User Story:** As a visitor, I want to see floating promotional banners that follow me as I scroll, so that I don't miss special offers.

#### Acceptance Criteria

1. WHEN a sale offer is active, THE Landing_Page SHALL display a floating corner banner (position: bottom-right)
2. WHEN a sale offer is active, THE Landing_Page SHALL display a floating side banner (position: right-center) on desktop
3. THE floating banners SHALL be dismissible by clicking the close button
4. WHEN a floating banner is dismissed, THE System SHALL remember the dismissal for 24 hours using localStorage
5. THE floating banners SHALL display: discount percentage, sale price, and "Claim Now" button
6. THE floating banners SHALL use the same theme styling as configured in the sale offer
