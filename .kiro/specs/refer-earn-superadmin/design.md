# Design Document: Refer & Earn with SuperAdmin Enhancements

## Overview

This design document outlines the implementation of a comprehensive Refer & Earn system for BillByteKOT, integrated with enhanced SuperAdmin panel capabilities. The system enables existing users to earn rewards by referring new users, while providing administrators with complete visibility into referral analytics, pricing management, promotional campaigns, and detailed user business information.

The implementation follows a modular approach that integrates seamlessly with the existing codebase without disrupting current functionality.

## Architecture

```mermaid
graph TB
    subgraph Frontend
        A[Refer & Earn Page] --> B[Share Component]
        A --> C[Wallet Component]
        A --> D[Statistics Component]
        E[Signup Page] --> F[Optional Referral Input]
        G[SuperAdmin Panel] --> H[Referrals Tab]
        G --> I[Pricing Tab]
        G --> J[Promotions Tab]
        G --> K[User Details Modal]
    end
    
    subgraph Backend API
        L[/api/referral/code] --> M[Referral Service]
        N[/api/referral/validate] --> M
        O[/api/referral/apply] --> M
        P[/api/referral/complete] --> M
        Q[/api/referral/summary] --> M
        R[/api/wallet/*] --> S[Wallet Service]
        T[/api/super-admin/referrals] --> U[SuperAdmin Service]
        V[/api/super-admin/pricing] --> U
        W[/api/super-admin/campaigns] --> U
    end
    
    subgraph Database
        X[(users collection)]
        Y[(referrals collection)]
        Z[(wallet_transactions collection)]
        AA[(pricing_config collection)]
        AB[(campaigns collection)]
    end
    
    M --> X
    M --> Y
    S --> Z
    S --> X
    U --> Y
    U --> AA
    U --> AB
```

## Components and Interfaces

### Backend Components

#### 1. Referral Service (backend/referral_service.py)

```python
class ReferralService:
    """Handles all referral-related operations"""
    
    async def generate_referral_code(user_id: str) -> str:
        """Generate unique 8-character alphanumeric code"""
        pass
    
    async def validate_referral_code(code: str, new_user_email: str, new_user_phone: str) -> ValidationResult:
        """Validate referral code and check for fraud"""
        pass
    
    async def apply_referral(code: str, new_user_id: str) -> ReferralRecord:
        """Create referral record when new user signs up"""
        pass
    
    async def complete_referral(new_user_id: str, payment_id: str) -> RewardResult:
        """Process referral reward after payment completion"""
        pass
    
    async def get_user_referral_summary(user_id: str) -> ReferralSummary:
        """Get referral statistics for a user"""
        pass
    
    async def reverse_reward(referral_id: str, reason: str) -> bool:
        """Reverse reward if payment is refunded"""
        pass
```

#### 2. Wallet Service (backend/wallet_service.py)

```python
class WalletService:
    """Handles wallet balance and transactions"""
    
    async def credit_wallet(user_id: str, amount: float, transaction_type: str, reference_id: str) -> Transaction:
        """Credit amount to user wallet"""
        pass
    
    async def debit_wallet(user_id: str, amount: float, transaction_type: str, reference_id: str) -> Transaction:
        """Debit amount from user wallet"""
        pass
    
    async def get_balance(user_id: str) -> WalletBalance:
        """Get current wallet balance"""
        pass
    
    async def get_transaction_history(user_id: str, limit: int = 50) -> List[Transaction]:
        """Get wallet transaction history"""
        pass
    
    async def apply_to_subscription(user_id: str, subscription_amount: float) -> ApplyResult:
        """Apply wallet balance to subscription payment"""
        pass
```

#### 3. SuperAdmin Referral Endpoints (backend/super_admin.py additions)

```python
# New endpoints to add to existing super_admin.py

@super_admin_router.get("/referrals")
async def get_all_referrals(
    username: str, password: str,
    status: Optional[str] = None,
    skip: int = 0, limit: int = 20
) -> ReferralListResponse:
    """Get paginated list of all referrals with optional status filter"""
    pass

@super_admin_router.get("/referrals/analytics")
async def get_referral_analytics(username: str, password: str) -> ReferralAnalytics:
    """Get referral program analytics"""
    pass

@super_admin_router.get("/referrals/export")
async def export_referrals(username: str, password: str, format: str = "csv") -> FileResponse:
    """Export referral data as CSV"""
    pass

@super_admin_router.get("/pricing")
async def get_pricing_config(username: str, password: str) -> PricingConfig:
    """Get current pricing configuration"""
    pass

@super_admin_router.put("/pricing")
async def update_pricing_config(username: str, password: str, config: PricingConfig) -> PricingConfig:
    """Update pricing configuration"""
    pass

@super_admin_router.get("/users/{user_id}/business-details")
async def get_user_business_details(user_id: str, username: str, password: str) -> BusinessDetails:
    """Get comprehensive business details for a user"""
    pass

@super_admin_router.get("/users/navigation")
async def get_user_navigation(username: str, password: str, current_user_id: str) -> NavigationResult:
    """Get previous and next user IDs for navigation"""
    pass
```

### Frontend Components

#### 1. ReferEarnPage Component (frontend/src/pages/ReferEarnPage.js)

```javascript
const ReferEarnPage = () => {
    // State
    const [referralCode, setReferralCode] = useState('');
    const [referralStats, setReferralStats] = useState(null);
    const [walletBalance, setWalletBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    
    // Sections
    // - Header with referral code and copy button
    // - Share buttons (WhatsApp, SMS, Copy Link)
    // - Rewards summary cards
    // - Transaction history
    // - Program rules
};
```

#### 2. SuperAdmin Referrals Tab (addition to SuperAdminPage.js)

```javascript
const ReferralsTab = () => {
    // State
    const [referrals, setReferrals] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Features
    // - Paginated referral list
    // - Status filter dropdown
    // - Analytics cards
    // - Export button
};
```

#### 3. SuperAdmin Pricing Tab (addition to SuperAdminPage.js)

```javascript
const PricingTab = () => {
    // State
    const [pricing, setPricing] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // Features
    // - Regular price input
    // - Campaign price input
    // - Trial days configuration
    // - Referral discount settings
    // - Save button
};
```

#### 4. User Business Details Modal (addition to SuperAdminPage.js)

```javascript
const BusinessDetailsModal = ({ userId, onClose, onNavigate }) => {
    // State
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Features
    // - Business information display
    // - Subscription status
    // - Usage statistics
    // - Previous/Next navigation buttons
};
```

## Data Models

### Referral Record

```javascript
{
    id: String,                    // UUID
    referrer_user_id: String,      // User who shared the code
    referee_user_id: String,       // New user who used the code
    referral_code: String,         // The code used
    status: String,                // PENDING | COMPLETED | REWARDED | REVERSED
    referee_discount: Number,      // 200 (₹200 discount for new user)
    referrer_reward: Number,       // 300 (₹300 reward for referrer)
    payment_id: String,            // Payment that triggered reward
    created_at: DateTime,
    completed_at: DateTime,
    rewarded_at: DateTime,
    reversed_at: DateTime,
    reverse_reason: String
}
```

### Wallet Transaction

```javascript
{
    id: String,                    // UUID
    user_id: String,
    type: String,                  // CREDIT | DEBIT
    amount: Number,
    transaction_type: String,      // REFERRAL_REWARD | SUBSCRIPTION_PAYMENT | REVERSAL
    reference_id: String,          // Referral ID or Payment ID
    balance_after: Number,
    description: String,
    created_at: DateTime
}
```

### User Schema Updates

```javascript
// Add to existing user schema
{
    referral_code: String,         // Unique 8-char code
    wallet_balance: Number,        // Current wallet balance (default: 0)
    referred_by: String,           // Referral code used during signup (optional)
    total_referrals: Number,       // Count of successful referrals
    total_referral_earnings: Number // Total earned from referrals
}
```

### Pricing Configuration

```javascript
{
    id: String,
    regular_price: Number,         // 1999
    campaign_price: Number,        // 1799
    referral_discount: Number,     // 200 (for new users)
    referral_reward: Number,       // 300 (for referrers)
    trial_days: Number,            // 7
    subscription_months: Number,   // 12
    campaign_active: Boolean,
    campaign_name: String,
    campaign_start_date: DateTime,
    campaign_end_date: DateTime,
    updated_at: DateTime,
    updated_by: String
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Referral Code Uniqueness and Format

*For any* user account creation, the generated referral code SHALL be exactly 8 alphanumeric characters and unique across all users in the system.

**Validates: Requirements 1.1, 1.2**

### Property 2: Referral Code Case-Insensitive Validation

*For any* referral code, validating the uppercase version and lowercase version SHALL produce identical results.

**Validates: Requirements 1.4**

### Property 3: Share Message Content Completeness

*For any* generated share message, the message SHALL contain the referral code, the discount amount (₹200), and the app download link.

**Validates: Requirements 2.5**

### Property 4: Referral Code Validation Correctness

*For any* referral code validation request:
- Valid codes SHALL return success with discount amount
- Invalid codes SHALL return error "Invalid referral code"
- Self-referral attempts SHALL be rejected
- Codes for the same mobile number used previously SHALL be rejected

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.8**

### Property 5: Referral Reward Processing Integrity

*For any* completed referee payment:
- The referrer's wallet SHALL be credited exactly ₹300
- The referral status SHALL transition to REWARDED
- An audit transaction record SHALL be created with all required fields

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 6: Reward Reversal on Refund

*For any* referee payment refunded within 7 days, the referrer's wallet balance SHALL be reduced by the reward amount and the referral status SHALL be REVERSED.

**Validates: Requirements 4.5**

### Property 7: Wallet Balance Consistency

*For any* wallet, the available balance SHALL equal total credits minus total debits, and SHALL never be negative.

**Validates: Requirements 5.1, 5.4**

### Property 8: Wallet Transaction History Completeness

*For any* wallet transaction, the history SHALL include transaction type, amount, date, and reference ID.

**Validates: Requirements 5.5**

### Property 9: Referral Statistics Accuracy

*For any* user's referral summary:
- Total referrals SHALL equal count of referral records where user is referrer
- Status breakdown SHALL sum to total referrals
- Total earnings SHALL equal sum of rewards for REWARDED referrals

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 10: SuperAdmin Referral List Filtering

*For any* status filter applied to the referral list, all returned referrals SHALL have the matching status.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 11: Referral Analytics Calculation

*For any* referral analytics query:
- Total referrals SHALL equal count of all referral records
- Conversion rate SHALL equal (REWARDED count / total count) * 100
- Total rewards paid SHALL equal sum of referrer_reward for REWARDED referrals

**Validates: Requirements 7.4**

### Property 12: CSV Export Completeness

*For any* referral CSV export, the file SHALL contain all referral records with referrer name, referee name, status, reward amount, and date columns.

**Validates: Requirements 7.5**

### Property 13: Pricing Configuration Completeness

*For any* pricing configuration, it SHALL contain regular_price, campaign_price, trial_days, and discount percentages.

**Validates: Requirements 8.2**

### Property 14: Pricing Update Persistence

*For any* pricing update, reading the pricing configuration immediately after update SHALL return the updated values.

**Validates: Requirements 8.3**

### Property 15: Campaign Date Overlap Prevention

*For any* new campaign creation, if the date range overlaps with an existing active campaign, the creation SHALL be rejected.

**Validates: Requirements 9.3**

### Property 16: Campaign Activation Logic

*For any* campaign, it SHALL be active if and only if current date is between start_date and end_date (inclusive).

**Validates: Requirements 9.4**

### Property 17: Business Details Completeness

*For any* user business details query, the response SHALL include restaurant_name, address, phone, GSTIN, FSSAI, business_type, subscription_status, and usage statistics.

**Validates: Requirements 10.2, 10.3, 10.4**

### Property 18: Fraud Prevention - Duplicate Mobile

*For any* mobile number that has already received a referral discount, subsequent referral applications with the same mobile SHALL be rejected.

**Validates: Requirements 11.1**

### Property 19: Fraud Prevention - Self Referral

*For any* referral application where the referrer's email, phone, or device fingerprint matches the referee's, the application SHALL be rejected.

**Validates: Requirements 11.2**

### Property 20: Rate Limiting Enforcement

*For any* IP address, more than 10 referral code applications within 1 hour SHALL be rejected.

**Validates: Requirements 11.4**

## Error Handling

### API Error Responses

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| INVALID_REFERRAL_CODE | Referral code does not exist | 400 |
| SELF_REFERRAL | Cannot use own referral code | 400 |
| DUPLICATE_MOBILE | Mobile already used for referral | 400 |
| RATE_LIMITED | Too many requests | 429 |
| INSUFFICIENT_BALANCE | Wallet balance insufficient | 400 |
| REFERRAL_ALREADY_COMPLETED | Referral already processed | 400 |
| CAMPAIGN_OVERLAP | Campaign dates overlap | 400 |

### Error Response Format

```javascript
{
    success: false,
    error: {
        code: "INVALID_REFERRAL_CODE",
        message: "The referral code entered is invalid or expired",
        details: {}
    }
}
```

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Referral code generation (format, uniqueness)
- Validation logic (valid codes, invalid codes, self-referral)
- Wallet operations (credit, debit, balance calculation)
- Statistics calculations
- CSV export formatting

### Property-Based Tests

Property-based tests using Hypothesis (Python) will validate:
- **Property 1**: Referral code format and uniqueness
- **Property 4**: Referral validation correctness
- **Property 7**: Wallet balance consistency
- **Property 9**: Referral statistics accuracy
- **Property 11**: Analytics calculations
- **Property 15**: Campaign date overlap detection
- **Property 18-20**: Fraud prevention rules

Each property test will run minimum 100 iterations with randomly generated inputs.

### Integration Tests

Integration tests will verify:
- End-to-end referral flow (signup → payment → reward)
- SuperAdmin operations (view, filter, export)
- Pricing updates affecting new subscriptions
- Campaign activation/deactivation

### Test Configuration

```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --hypothesis-show-statistics

# Hypothesis settings
hypothesis.settings.default.max_examples = 100
hypothesis.settings.default.deadline = None
```

