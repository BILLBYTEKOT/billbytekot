# 🚀 Bulk Upload Integration Guide

## Quick Start

The BulkUpload component is ready to use. Just import it into your Menu and Inventory pages.

---

## Integration Steps

### 1. Menu Page Integration

**File:** `frontend/src/pages/MenuPage.js`

Add at the top with other imports:
```javascript
import BulkUpload from '../components/BulkUpload';
```

Add in the JSX (before or after the menu items list):
```javascript
<BulkUpload 
  type="menu" 
  onSuccess={() => {
    // Refresh menu items after successful upload
    fetchMenuItems();
  }}
/>
```

### 2. Inventory Page Integration

**File:** `frontend/src/pages/InventoryPage.js`

Add at the top with other imports:
```javascript
import BulkUpload from '../components/BulkUpload';
```

Add in the JSX (before or after the inventory list):
```javascript
<BulkUpload 
  type="inventory" 
  onSuccess={() => {
    // Refresh inventory after successful upload
    fetchInventory();
  }}
/>
```

---

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | string | 'menu' | Either 'menu' or 'inventory' |
| onSuccess | function | undefined | Callback after successful upload |

---

## Features

✅ Download CSV templates
✅ Drag & drop file upload
✅ CSV validation
✅ Error reporting per row
✅ Success count display
✅ Role-based access control
✅ Auto-refresh after upload

---

## CSV Templates

### Menu Template
```csv
name,category,price,description,available
Margherita Pizza,Pizza,299,Classic cheese pizza,true
Chicken Burger,Burgers,199,Grilled chicken burger,true
Coke,Beverages,50,Chilled coke,true
```

### Inventory Template
```csv
item_name,quantity,unit,min_quantity,price_per_unit
Tomatoes,50,kg,10,80
Cheese,20,kg,5,400
Chicken,30,kg,10,250
```

---

## Backend Endpoints

All endpoints are already implemented in `backend/server.py`:

- `POST /api/menu/bulk-upload` - Upload menu CSV
- `POST /api/inventory/bulk-upload` - Upload inventory CSV
- `GET /api/templates/menu-csv` - Download menu template
- `GET /api/templates/inventory-csv` - Download inventory template

---

## Error Handling

The component handles:
- Invalid file types (only CSV allowed)
- Missing required fields
- Invalid data types
- Duplicate items
- Network errors

Errors are displayed per row with line numbers.

---

## Example Usage

```javascript
import BulkUpload from '../components/BulkUpload';

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  
  const fetchMenuItems = async () => {
    // Your fetch logic
  };
  
  return (
    <div>
      <h1>Menu Management</h1>
      
      {/* Bulk Upload Component */}
      <BulkUpload 
        type="menu" 
        onSuccess={fetchMenuItems}
      />
      
      {/* Menu Items List */}
      <div>
        {menuItems.map(item => (
          <MenuItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
```

---

## Styling

The component uses your existing UI components:
- `Button` from './ui/button'
- `Card`, `CardContent`, `CardHeader`, `CardTitle` from './ui/card'
- `toast` from 'sonner'

It will automatically match your app's theme.

---

## Testing

1. **Download Template:**
   - Click "Download Template" button
   - Verify CSV downloads

2. **Upload Valid CSV:**
   - Fill template with valid data
   - Upload file
   - Verify success message
   - Check items appear in list

3. **Upload Invalid CSV:**
   - Add invalid data (missing name, negative price)
   - Upload file
   - Verify error messages show

4. **Permission Test:**
   - Login as waiter/cashier
   - Verify upload is blocked
   - Login as admin/manager
   - Verify upload works

---

## Troubleshooting

**Issue:** Upload button disabled
- **Solution:** Make sure a CSV file is selected

**Issue:** "Permission denied" error
- **Solution:** Only admin and manager roles can bulk upload

**Issue:** "Only CSV files allowed"
- **Solution:** File must have .csv extension

**Issue:** Items not appearing after upload
- **Solution:** Call onSuccess callback to refresh the list

---

## Production Checklist

- [ ] Import BulkUpload in MenuPage
- [ ] Import BulkUpload in InventoryPage
- [ ] Add onSuccess callbacks
- [ ] Test with sample CSV
- [ ] Test error handling
- [ ] Test with different roles
- [ ] Deploy and verify

---

**Status:** Ready to integrate ✅
**Estimated Integration Time:** 5 minutes per page
**Dependencies:** All included ✅
