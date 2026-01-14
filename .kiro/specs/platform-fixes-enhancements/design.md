# Design Document: Platform Fixes and Enhancements

## Overview

This design addresses multiple platform issues: sale promotion activation on the landing page with multiple theme support, superadmin user management improvements, campaign-driven pricing updates, and inventory management enhancements including purchase order tracking.

## Architecture

The solution follows the existing architecture patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  LandingPage.js                                                  │
│  ├── TopBanner (promotional)                                     │
│  ├── SaleBanner (top, hero, corner, side positions)             │
│  ├── SaleOfferSection (main promotional section)                │
│  └── CampaignBanner (campaign-specific)                         │
├─────────────────────────────────────────────────────────────────┤
│  SuperAdminPage.js                                               │
│  ├── Users Tab (list, filter, search, sort)                     │
│  ├── Business Details Modal                                      │
│  └── Promotions Tab (sale offer, campaigns, themes)             │
├─────────────────────────────────────────────────────────────────┤
│  InventoryPage.js                                                │
│  ├── Inventory Tab (items CRUD)                                  │
│  ├── Suppliers Tab                                               │
│  ├── Categories Tab                                              │
│  ├── Movements Tab                                               │
│  └── Purchases Tab (NEW)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│  Public Endpoints:                                               │
│  ├── GET /public/sale-offer                                      │
│  ├── GET /public/pricing                                         │
│  └── GET /public/active-campaigns                                │
├─────────────────────────────────────────────────────────────────┤
│  SuperAdmin Endpoints:                                           │
│  ├── GET /super-admin/users/list                                 │
│  ├── GET /super-admin/users/{id}/details                         │
│  ├── PUT /super-admin/sale-offer                                 │
│  └── GET/POST /super-admin/campaigns                             │
├─────────────────────────────────────────────────────────────────┤
│  Inventory Endpoints:                                            │
│  ├── GET/POST /inventory                                         │
│  ├── GET/POST /inventory/purchases (NEW)                         │
│  └── GET /inventory/purchases/history (NEW)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Sale Banner Theme System

```javascript
// Theme configuration object
const SALE_THEMES = {
  default: {
    bg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
    text: 'text-white',
    accent: 'bg-yellow-400 text-black',
    icon: Sparkles,
    badge: 'SPECIAL OFFER'
  },
  early_adopter: {
    bg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    text: 'text-white',
    accent: 'bg-yellow-300 text-emerald-900',
    icon: Rocket,
    badge: 'EARLY ADOPTER',
    pattern: '🚀'
  },
  diwali: {
    bg: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500',
    text: 'text-white',
    accent: 'bg-yellow-300 text-orange-900',
    icon: Sparkles,
    pattern: '🪔'
  },
  // ... other themes
};

// SaleBanner component interface
interface SaleBannerProps {
  position: 'top' | 'hero' | 'corner' | 'side' | 'inline';
  saleData?: SaleOffer;
  onDismiss?: () => void;
}

interface SaleOffer {
  enabled: boolean;
  title: string;
  subtitle: string;
  discount_percent: number;
  original_price: number;
  sale_price: number;
  theme: string;
  end_date: string;
  valid_until: string;
  badge_text: string;
  cta_text: string;
}
```

### 2. Landing Page Promotional Data Flow

```javascript
// Centralized promotional data fetching in LandingPage
const useSaleOfferData = () => {
  const [saleOffer, setSaleOffer] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotionalData = async () => {
      try {
        const [saleRes, pricingRes] = await Promise.all([
          axios.get(`${API}/public/sale-offer`),
          axios.get(`${API}/public/pricing`)
        ]);
        setSaleOffer(saleRes.data.enabled ? saleRes.data : null);
        setPricing(pricingRes.data);
      } catch (error) {
        console.error('Failed to fetch promotional data');
      } finally {
        setLoading(false);
      }
    };
    fetchPromotionalData();
  }, []);

  return { saleOffer, pricing, loading };
};
```

### 3. SuperAdmin User Details Interface

```javascript
// Business details response structure
interface UserBusinessDetails {
  id: string;
  username: string;
  email: string;
  role: string;
  restaurant_name: string;
  business_type: string;
  phone: string;
  address: string;
  gstin: string;
  fssai: string;
  subscription_active: boolean;
  subscription_expires_at: string;
  created_at: string;
  payment_history: PaymentRecord[];
}

// Navigation response for Previous/Next
interface UserNavigationResponse {
  previous_user_id: string | null;
  next_user_id: string | null;
  current_position: number;
  total_users: number;
}
```

### 4. Inventory Purchase Order System

```javascript
// Purchase order data model
interface PurchaseOrder {
  id: string;
  supplier_id: string;
  purchase_date: string;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  notes: string;
  items: PurchaseOrderItem[];
  created_at: string;
}

interface PurchaseOrderItem {
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}
```

## Data Models

### Sale Offer (MongoDB)
```javascript
{
  type: "sale_offer",
  enabled: Boolean,
  title: String,
  subtitle: String,
  discount_percent: Number,
  original_price: Number,
  sale_price: Number,
  theme: String,  // 'default', 'early_adopter', 'diwali', etc.
  end_date: String,
  valid_until: String,
  badge_text: String,
  bg_color: String,
  cta_text: String,
  urgency_text: String
}
```

### Purchase Order (MongoDB)
```javascript
{
  _id: ObjectId,
  org_id: ObjectId,
  supplier_id: String,
  purchase_date: ISODate,
  total_amount: Number,
  status: String,
  notes: String,
  items: [
    {
      inventory_item_id: String,
      item_name: String,
      quantity: Number,
      unit_cost: Number,
      total_cost: Number
    }
  ],
  created_at: ISODate,
  created_by: String
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Sale Offer Theme Rendering Consistency

*For any* sale offer configuration with a valid theme (default, early_adopter, diwali, christmas, newyear, flash, blackfriday, summer, republic, holi), when the sale offer is enabled, all banner components (SaleBanner, SaleOfferSection) SHALL apply the corresponding theme's color scheme, icon, and pattern consistently.

**Validates: Requirements 1.1, 1.2, 7.4, 7.5**

### Property 2: Sale Offer Expiration Logic

*For any* sale offer with an end_date or valid_until in the past, the Landing_Page SHALL return enabled=false or hide the promotional content.

**Validates: Requirements 1.6**

### Property 3: User Business Details Completeness

*For any* user with business details, when the Business_Details modal is displayed, it SHALL contain all required fields: restaurant_name, business_type, phone, email, address, gstin, and fssai.

**Validates: Requirements 2.2**

### Property 4: User List Field Completeness

*For any* user in the users list, the rendered row SHALL display: username, email, role, subscription_status, subscription_expires_at, and activity metrics (bill_count, last_login).

**Validates: Requirements 3.2**

### Property 5: User Filtering Correctness

*For any* list of users and a status filter (active, trial, expired), the filtered result SHALL contain only users matching that status, and the count of filtered users SHALL be less than or equal to the total user count.

**Validates: Requirements 3.5**

### Property 6: User Search Correctness

*For any* list of users and a search query, the search result SHALL contain only users where username or email contains the search query (case-insensitive).

**Validates: Requirements 3.6**

### Property 7: User Sorting Correctness

*For any* list of users and a sort field (created_at, subscription_expires_at, username), the sorted result SHALL maintain the correct ascending or descending order based on the sort direction.

**Validates: Requirements 3.7**

### Property 8: Campaign Pricing Calculation

*For any* pricing configuration with an active campaign, the returned campaign_price SHALL equal regular_price minus (regular_price * campaign_discount_percent / 100).

**Validates: Requirements 4.3**

### Property 9: Campaign Date-Based Pricing

*For any* campaign with end_date in the past, the pricing endpoint SHALL return campaign_active=false and display regular pricing.

**Validates: Requirements 4.4**

### Property 10: Inventory Validation Completeness

*For any* inventory item submission, if any required field (name, quantity, unit, min_quantity, price_per_unit) is missing or invalid, the system SHALL reject the submission with a validation error.

**Validates: Requirements 5.2**

### Property 11: Inventory Edit Pre-population

*For any* existing inventory item being edited, the form SHALL be pre-populated with all current values matching the item's stored data.

**Validates: Requirements 5.6**

### Property 12: Purchase Order Stock Update

*For any* purchase order that is saved, the inventory quantities for all included items SHALL increase by the purchased quantity.

**Validates: Requirements 6.3**

### Property 13: Purchase Order Total Calculation

*For any* set of purchase orders, the total purchase value SHALL equal the sum of all individual purchase order amounts.

**Validates: Requirements 6.7**

### Property 14: Banner Data Consistency

*For any* active sale offer, all banner components (TopBanner, SaleBanner corner, SaleBanner side, SaleOfferSection) SHALL display the same discount_percent, sale_price, and original_price values.

**Validates: Requirements 8.1, 8.3, 8.4**

### Property 15: Promotional Priority

*For any* state where both a sale offer and campaign are active, the Landing_Page SHALL display the sale offer content with higher visual priority.

**Validates: Requirements 8.6**

### Property 16: Floating Banner Rendering

*For any* active sale offer, the floating banners (corner, side) SHALL display: discount_percent, sale_price, and a "Claim Now" button, using the configured theme styling.

**Validates: Requirements 9.1, 9.2, 9.5, 9.6**

### Property 17: Banner Dismissal Persistence

*For any* floating banner that is dismissed, localStorage SHALL store the dismissal timestamp, and the banner SHALL not reappear for 24 hours.

**Validates: Requirements 9.4**

## Error Handling

### Frontend Error Handling

1. **API Errors**: All API calls wrapped in try-catch with user-friendly error messages
2. **Network Failures**: Graceful degradation - page renders without promotional content if API fails
3. **Invalid Data**: Defensive rendering with fallback values for missing fields
4. **Authentication Errors**: Redirect to login with appropriate message

### Backend Error Handling

1. **Database Errors**: Return 500 with generic error message, log details
2. **Validation Errors**: Return 422 with specific field errors
3. **Authorization Errors**: Return 403 with permission denied message
4. **Not Found**: Return 404 for missing resources

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. Theme configuration object completeness
2. Date parsing and comparison logic
3. Price calculation functions
4. Form validation rules
5. Filter/search/sort utility functions

### Property-Based Tests

Property-based tests will use Hypothesis (Python) for backend and fast-check (JavaScript) for frontend:

1. **Theme Rendering**: Generate random theme configurations, verify CSS class application
2. **User Filtering**: Generate random user lists and filters, verify filter correctness
3. **Price Calculation**: Generate random pricing configs, verify calculation accuracy
4. **Stock Updates**: Generate random purchase orders, verify inventory updates
5. **Data Consistency**: Generate sale offers, verify all banners show same data

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: platform-fixes-enhancements, Property {N}: {description}**

### Integration Tests

1. End-to-end sale offer activation flow
2. SuperAdmin user management workflow
3. Inventory purchase order creation and stock update
4. Campaign pricing propagation across pages
