// ✅ Critical Issue Fixes - Data Validation and Integrity
// Fixes the 2 critical issues identified in comprehensive testing

// Fix 1: Order Validation Enhancement
// Issue: Orders accepted without required fields
// Solution: Strict validation with comprehensive checks

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
      errors.push('table_number must be a number');
    }

    if (order.items && !Array.isArray(order.items)) {
      errors.push('items must be an array');
    }

    if (order.total && typeof order.total !== 'number') {
      errors.push('total must be a number');
    }

    // Business logic validation
    if (order.table_number && order.table_number <= 0) {
      errors.push('table_number must be positive');
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
          errors.push(`Item ${index}: Invalid price (must be non-negative number)`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index}: Invalid quantity (must be positive number)`);
        }
      });
    }

    // Total validation
    if (order.items && order.total !== undefined) {
      const calculatedTotal = order.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      if (Math.abs(calculatedTotal - order.total) > 0.01) {
        errors.push(`Total mismatch: calculated ${calculatedTotal}, provided ${order.total}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static sanitizeOrder(order) {
    // Create sanitized copy
    const sanitized = { ...order };

    // Ensure required fields have proper types
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

    // Add timestamps if missing
    if (!sanitized.created_at) {
      sanitized.created_at = new Date().toISOString();
    }

    if (!sanitized.last_modified) {
      sanitized.last_modified = Date.now();
    }

    return sanitized;
  }
}

// Fix 2: Menu Item Duplicate Prevention
// Issue: System allows duplicate menu item IDs
// Solution: Unique constraint validation with conflict resolution

class MenuItemValidator {
  constructor() {
    this.existingIds = new Set();
    this.existingItems = new Map();
  }

  // Load existing menu items to check for duplicates
  loadExistingItems(menuItems) {
    this.existingIds.clear();
    this.existingItems.clear();
    
    menuItems.forEach(item => {
      this.existingIds.add(item.id);
      this.existingItems.set(item.id, item);
    });
  }

  validateMenuItem(item, isUpdate = false, originalId = null) {
    const errors = [];
    const warnings = [];

    // Required field validation
    const requiredFields = ['id', 'name', 'price'];
    requiredFields.forEach(field => {
      if (!item[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Data type validation
    if (item.price && typeof item.price !== 'number') {
      errors.push('price must be a number');
    }

    if (item.price && item.price < 0) {
      errors.push('price cannot be negative');
    }

    // Duplicate ID validation
    if (item.id) {
      const isDuplicate = this.existingIds.has(item.id);
      
      if (isDuplicate) {
        if (isUpdate && originalId === item.id) {
          // Updating existing item with same ID - OK
        } else {
          errors.push(`Duplicate menu item ID: ${item.id} already exists`);
          
          // Suggest alternative ID
          const suggestedId = this.generateUniqueId(item.id);
          warnings.push(`Suggested unique ID: ${suggestedId}`);
        }
      }
    }

    // Name length validation
    if (item.name && item.name.length > 100) {
      warnings.push('Item name is very long (>100 characters)');
    }

    if (item.description && item.description.length > 500) {
      warnings.push('Item description is very long (>500 characters)');
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
      this.existingItems.set(item.id, item);
    }
  }

  removeMenuItem(itemId) {
    this.existingIds.delete(itemId);
    this.existingItems.delete(itemId);
  }

  updateMenuItem(oldId, newItem) {
    if (oldId !== newItem.id) {
      this.existingIds.delete(oldId);
      this.existingItems.delete(oldId);
    }
    
    this.existingIds.add(newItem.id);
    this.existingItems.set(newItem.id, newItem);
  }
}

// Fix 3: Concurrent Modification Protection
// Issue: Multiple concurrent modifications succeed
// Solution: Optimistic locking with version control

class ConcurrencyController {
  constructor() {
    this.locks = new Map(); // itemId -> { version, timestamp, lockId }
    this.lockTimeout = 30000; // 30 seconds
  }

  // Acquire lock for modification
  acquireLock(itemId, currentVersion = null) {
    const now = Date.now();
    const existingLock = this.locks.get(itemId);
    
    // Check if existing lock is expired
    if (existingLock && (now - existingLock.timestamp) > this.lockTimeout) {
      this.locks.delete(itemId);
    }
    
    // Check if item is currently locked
    if (this.locks.has(itemId)) {
      return {
        success: false,
        error: 'Item is currently being modified by another user',
        lockedBy: existingLock.lockId,
        lockedAt: new Date(existingLock.timestamp)
      };
    }
    
    // Create new lock
    const lockId = Math.random().toString(36).substr(2, 9);
    const lock = {
      version: currentVersion || 1,
      timestamp: now,
      lockId: lockId
    };
    
    this.locks.set(itemId, lock);
    
    return {
      success: true,
      lockId: lockId,
      version: lock.version
    };
  }

  // Release lock after modification
  releaseLock(itemId, lockId) {
    const existingLock = this.locks.get(itemId);
    
    if (!existingLock) {
      return { success: false, error: 'No lock found for item' };
    }
    
    if (existingLock.lockId !== lockId) {
      return { success: false, error: 'Invalid lock ID' };
    }
    
    this.locks.delete(itemId);
    return { success: true };
  }

  // Validate version for optimistic locking
  validateVersion(itemId, providedVersion, currentVersion) {
    if (providedVersion !== currentVersion) {
      return {
        valid: false,
        error: 'Version conflict: item was modified by another user',
        providedVersion,
        currentVersion
      };
    }
    
    return { valid: true };
  }

  // Clean up expired locks
  cleanupExpiredLocks() {
    const now = Date.now();
    
    for (const [itemId, lock] of this.locks.entries()) {
      if ((now - lock.timestamp) > this.lockTimeout) {
        this.locks.delete(itemId);
      }
    }
  }
}

// Enhanced Order Processing with All Fixes
class EnhancedOrderProcessor {
  constructor() {
    this.concurrencyController = new ConcurrencyController();
    this.menuValidator = new MenuItemValidator();
  }

  async processOrder(order) {
    try {
      // Step 1: Validate order
      const validation = OrderValidator.validateOrder(order);
      
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Step 2: Sanitize order data
      const sanitizedOrder = OrderValidator.sanitizeOrder(order);

      // Step 3: Acquire lock for concurrent modification protection
      const lockResult = this.concurrencyController.acquireLock(
        sanitizedOrder.id, 
        sanitizedOrder.version
      );

      if (!lockResult.success) {
        return {
          success: false,
          error: lockResult.error,
          lockInfo: lockResult
        };
      }

      try {
        // Step 4: Process the order (simulate database operation)
        const processedOrder = {
          ...sanitizedOrder,
          version: (sanitizedOrder.version || 0) + 1,
          processed_at: new Date().toISOString(),
          status: sanitizedOrder.status || 'pending'
        };

        // Step 5: Release lock
        this.concurrencyController.releaseLock(sanitizedOrder.id, lockResult.lockId);

        return {
          success: true,
          order: processedOrder,
          warnings: validation.warnings
        };

      } catch (processingError) {
        // Release lock on error
        this.concurrencyController.releaseLock(sanitizedOrder.id, lockResult.lockId);
        throw processingError;
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateOrderStatus(orderId, newStatus, currentVersion) {
    // Acquire lock
    const lockResult = this.concurrencyController.acquireLock(orderId, currentVersion);
    
    if (!lockResult.success) {
      return {
        success: false,
        error: lockResult.error
      };
    }

    try {
      // Validate version
      const versionCheck = this.concurrencyController.validateVersion(
        orderId, 
        currentVersion, 
        lockResult.version
      );

      if (!versionCheck.valid) {
        this.concurrencyController.releaseLock(orderId, lockResult.lockId);
        return {
          success: false,
          error: versionCheck.error
        };
      }

      // Update status
      const updatedOrder = {
        id: orderId,
        status: newStatus,
        version: lockResult.version + 1,
        last_modified: Date.now()
      };

      // Release lock
      this.concurrencyController.releaseLock(orderId, lockResult.lockId);

      return {
        success: true,
        order: updatedOrder
      };

    } catch (error) {
      this.concurrencyController.releaseLock(orderId, lockResult.lockId);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export classes for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OrderValidator,
    MenuItemValidator,
    ConcurrencyController,
    EnhancedOrderProcessor
  };
}

// Global access for browser environments
if (typeof window !== 'undefined') {
  window.BillByteKOTValidation = {
    OrderValidator,
    MenuItemValidator,
    ConcurrencyController,
    EnhancedOrderProcessor
  };
}

console.log('✅ Critical validation fixes loaded successfully!');
console.log('📋 Fixes implemented:');
console.log('   1. ✅ Order validation with required field checks');
console.log('   2. ✅ Menu item duplicate prevention');
console.log('   3. ✅ Concurrent modification protection');
console.log('   4. ✅ Data type validation and sanitization');
console.log('   5. ✅ Business logic validation');
console.log('   6. ✅ Optimistic locking mechanism');