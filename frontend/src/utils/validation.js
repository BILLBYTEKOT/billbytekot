// ✅ Frontend-Only Validation System
// No server changes needed - all validation happens locally

class OrderValidator {
  static validateOrder(order) {
    const errors = [];
    const warnings = [];

    // Required field validation
    const requiredFields = ['id', 'items', 'table_number'];
    requiredFields.forEach(field => {
      if (!order[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Data type validation
    if (order.table_number && typeof order.table_number !== 'number') {
      errors.push('Table number must be a number');
    }

    if (order.items && !Array.isArray(order.items)) {
      errors.push('Items must be an array');
    }

    // Business logic validation
    if (order.table_number && order.table_number <= 0) {
      errors.push('Table number must be positive');
    }

    if (order.items && order.items.length === 0) {
      warnings.push('Order has no items');
    }

    // Item validation
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item, index) => {
        if (!item.id) {
          errors.push(`Item ${index}: Missing id`);
        }
        if (!item.name) {
          errors.push(`Item ${index}: Missing name`);
        }
        if (typeof item.price !== 'number' || item.price < 0) {
          errors.push(`Item ${index}: Invalid price`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index}: Invalid quantity`);
        }
      });
    }

    // Total validation
    if (order.items && order.total !== undefined) {
      const calculatedTotal = order.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      if (Math.abs(calculatedTotal - order.total) > 0.01) {
        errors.push(`Total mismatch: calculated ${calculatedTotal.toFixed(2)}, provided ${order.total}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static sanitizeOrder(order) {
    const sanitized = { ...order };

    // Ensure proper types
    if (sanitized.table_number) {
      sanitized.table_number = Number(sanitized.table_number);
    }

    if (sanitized.total) {
      sanitized.total = Number(sanitized.total);
    }

    // Sanitize items
    if (sanitized.items && Array.isArray(sanitized.items)) {
      sanitized.items = sanitized.items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      }));
    }

    // Add timestamps
    if (!sanitized.created_at) {
      sanitized.created_at = new Date().toISOString();
    }

    if (!sanitized.last_modified) {
      sanitized.last_modified = Date.now();
    }

    return sanitized;
  }
}

class MenuItemValidator {
  constructor() {
    this.existingIds = new Set();
  }

  loadExistingItems(menuItems) {
    this.existingIds.clear();
    menuItems.forEach(item => {
      this.existingIds.add(item.id);
    });
  }

  validateMenuItem(item, isUpdate = false, originalId = null) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['id', 'name', 'price'];
    requiredFields.forEach(field => {
      if (!item[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Data type validation
    if (item.price && typeof item.price !== 'number') {
      errors.push('Price must be a number');
    }

    if (item.price && item.price < 0) {
      errors.push('Price cannot be negative');
    }

    // Duplicate ID validation
    if (item.id) {
      const isDuplicate = this.existingIds.has(item.id);
      
      if (isDuplicate && !(isUpdate && originalId === item.id)) {
        errors.push(`Menu item ID '${item.id}' already exists`);
        
        // Suggest alternative
        const suggestedId = this.generateUniqueId(item.id);
        warnings.push(`Suggested unique ID: ${suggestedId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateUniqueId(baseId) {
    let counter = 1;
    let newId = `${baseId}_${counter}`;
    
    while (this.existingIds.has(newId)) {
      counter++;
      newId = `${baseId}_${counter}`;
    }
    
    return newId;
  }

  addMenuItem(item) {
    if (item.id) {
      this.existingIds.add(item.id);
    }
  }
}

// Global validator instances
export const orderValidator = new OrderValidator();
export const menuValidator = new MenuItemValidator();

export { OrderValidator, MenuItemValidator };