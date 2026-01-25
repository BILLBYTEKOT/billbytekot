// ✅ KOT Data Format Handler
// Handles import/export of data in .kot format for offline storage

import { offlineStorage } from './offlineStorage';
import { toast } from 'sonner';

class KOTDataFormat {
  constructor() {
    this.version = '1.0';
    this.formatName = 'BillByteKOT Data Format';
  }

  // Export all data to .kot format
  async exportToKOT(options = {}) {
    try {
      const {
        includeOrders = true,
        includeMenu = true,
        includeTables = true,
        includeSettings = true,
        dateRange = null,
        restaurantName = 'Restaurant'
      } = options;

      console.log('📁 Starting KOT export...');
      toast.loading('Exporting data...', { id: 'kot-export' });

      const exportData = {
        format: this.formatName,
        version: this.version,
        exported_at: new Date().toISOString(),
        restaurant_name: restaurantName,
        export_options: options,
        data: {}
      };

      // Export orders
      if (includeOrders) {
        let orders = await offlineStorage.getOrders();
        
        // Filter by date range if specified
        if (dateRange) {
          const { startDate, endDate } = dateRange;
          orders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
          });
        }
        
        exportData.data.orders = orders;
        console.log(`📋 Exported ${orders.length} orders`);
      }

      // Export menu items
      if (includeMenu) {
        const menuItems = await offlineStorage.getMenuItems();
        exportData.data.menu_items = menuItems;
        console.log(`🍽️ Exported ${menuItems.length} menu items`);
      }

      // Export tables
      if (includeTables) {
        const tables = await offlineStorage.getTables();
        exportData.data.tables = tables;
        console.log(`🪑 Exported ${tables.length} tables`);
      }

      // Export settings
      if (includeSettings) {
        const settings = await offlineStorage.getBusinessSettings();
        exportData.data.settings = settings;
        console.log('⚙️ Exported business settings');
      }

      // Add metadata
      exportData.metadata = {
        total_orders: exportData.data.orders?.length || 0,
        total_menu_items: exportData.data.menu_items?.length || 0,
        total_tables: exportData.data.tables?.length || 0,
        export_size_bytes: JSON.stringify(exportData).length,
        checksum: this.generateChecksum(exportData.data)
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billbyte_backup_${new Date().toISOString().split('T')[0]}.kot`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!', { id: 'kot-export' });
      console.log('✅ KOT export completed');
      
      return exportData;

    } catch (error) {
      console.error('❌ KOT export failed:', error);
      toast.error('Export failed: ' + error.message, { id: 'kot-export' });
      throw error;
    }
  }

  // Import data from .kot format
  async importFromKOT(file, options = {}) {
    try {
      const {
        overwriteExisting = false,
        mergeStrategy = 'skip', // 'skip', 'overwrite', 'merge'
        validateData = true
      } = options;

      console.log('📁 Starting KOT import...');
      toast.loading('Importing data...', { id: 'kot-import' });

      // Read file
      const text = await file.text();
      const kotData = JSON.parse(text);

      // Validate format
      if (!this.validateKOTFormat(kotData)) {
        throw new Error('Invalid .kot file format');
      }

      // Validate data integrity
      if (validateData && !this.validateDataIntegrity(kotData)) {
        throw new Error('Data integrity check failed');
      }

      const { data } = kotData;
      const importStats = {
        orders: 0,
        menuItems: 0,
        tables: 0,
        settings: 0,
        skipped: 0,
        errors: 0
      };

      // Import orders
      if (data.orders?.length) {
        const result = await this.importOrders(data.orders, mergeStrategy);
        importStats.orders = result.imported;
        importStats.skipped += result.skipped;
        importStats.errors += result.errors;
      }

      // Import menu items
      if (data.menu_items?.length) {
        const result = await this.importMenuItems(data.menu_items, overwriteExisting);
        importStats.menuItems = result.imported;
        importStats.skipped += result.skipped;
      }

      // Import tables
      if (data.tables?.length) {
        const result = await this.importTables(data.tables, overwriteExisting);
        importStats.tables = result.imported;
        importStats.skipped += result.skipped;
      }

      // Import settings
      if (data.settings) {
        await offlineStorage.saveBusinessSettings(data.settings);
        importStats.settings = 1;
      }

      const totalImported = importStats.orders + importStats.menuItems + importStats.tables + importStats.settings;
      
      toast.success(`Import completed! ${totalImported} items imported`, { id: 'kot-import' });
      console.log('✅ KOT import completed:', importStats);
      
      return {
        success: true,
        stats: importStats,
        metadata: kotData.metadata
      };

    } catch (error) {
      console.error('❌ KOT import failed:', error);
      toast.error('Import failed: ' + error.message, { id: 'kot-import' });
      throw error;
    }
  }

  // Import orders with conflict resolution
  async importOrders(orders, mergeStrategy) {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        const existingOrder = await offlineStorage.performDBOperation('orders', 'get', order.id);
        
        if (existingOrder) {
          switch (mergeStrategy) {
            case 'skip':
              skipped++;
              continue;
            case 'overwrite':
              await offlineStorage.saveOrder({ ...order, sync_status: 'pending' });
              imported++;
              break;
            case 'merge':
              const mergedOrder = this.mergeOrders(existingOrder, order);
              await offlineStorage.saveOrder(mergedOrder);
              imported++;
              break;
          }
        } else {
          await offlineStorage.saveOrder({ ...order, sync_status: 'pending' });
          imported++;
        }
      } catch (error) {
        console.error(`Failed to import order ${order.id}:`, error);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }

  // Import menu items
  async importMenuItems(menuItems, overwriteExisting) {
    let imported = 0;
    let skipped = 0;

    if (overwriteExisting) {
      await offlineStorage.saveMenuItems(menuItems);
      imported = menuItems.length;
    } else {
      const existingItems = await offlineStorage.getMenuItems();
      const existingIds = new Set(existingItems.map(item => item.id));
      
      const newItems = menuItems.filter(item => !existingIds.has(item.id));
      
      for (const item of newItems) {
        await offlineStorage.performDBOperation('menu_items', 'add', item);
        imported++;
      }
      
      skipped = menuItems.length - imported;
    }

    return { imported, skipped };
  }

  // Import tables
  async importTables(tables, overwriteExisting) {
    let imported = 0;
    let skipped = 0;

    if (overwriteExisting) {
      await offlineStorage.saveTables(tables);
      imported = tables.length;
    } else {
      const existingTables = await offlineStorage.getTables();
      const existingIds = new Set(existingTables.map(table => table.id));
      
      const newTables = tables.filter(table => !existingIds.has(table.id));
      
      for (const table of newTables) {
        await offlineStorage.performDBOperation('tables', 'add', table);
        imported++;
      }
      
      skipped = tables.length - imported;
    }

    return { imported, skipped };
  }

  // Merge two orders (prefer newer data)
  mergeOrders(existing, imported) {
    const existingTime = new Date(existing.last_modified || existing.created_at).getTime();
    const importedTime = new Date(imported.last_modified || imported.created_at).getTime();
    
    // Use the newer order as base
    const base = importedTime > existingTime ? imported : existing;
    const other = importedTime > existingTime ? existing : imported;
    
    return {
      ...base,
      // Preserve local sync status
      sync_status: existing.sync_status || 'pending',
      last_modified: Math.max(existingTime, importedTime)
    };
  }

  // Validate KOT format
  validateKOTFormat(kotData) {
    const requiredFields = ['format', 'version', 'exported_at', 'data'];
    
    for (const field of requiredFields) {
      if (!kotData.hasOwnProperty(field)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    if (kotData.format !== this.formatName) {
      console.error('Invalid format name');
      return false;
    }
    
    return true;
  }

  // Validate data integrity
  validateDataIntegrity(kotData) {
    try {
      const { data, metadata } = kotData;
      
      if (!metadata || !metadata.checksum) {
        console.warn('No checksum found, skipping integrity check');
        return true;
      }
      
      const calculatedChecksum = this.generateChecksum(data);
      
      if (calculatedChecksum !== metadata.checksum) {
        console.error('Checksum mismatch - data may be corrupted');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Data integrity validation failed:', error);
      return false;
    }
  }

  // Generate simple checksum for data integrity
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  // Get export statistics
  async getExportStats() {
    try {
      const [orders, menuItems, tables, settings] = await Promise.all([
        offlineStorage.getOrders(),
        offlineStorage.getMenuItems(),
        offlineStorage.getTables(),
        offlineStorage.getBusinessSettings()
      ]);

      return {
        orders: orders.length,
        menuItems: menuItems.length,
        tables: tables.length,
        hasSettings: Object.keys(settings).length > 0,
        totalSize: this.estimateDataSize({ orders, menuItems, tables, settings })
      };
    } catch (error) {
      console.error('Failed to get export stats:', error);
      return null;
    }
  }

  // Estimate data size in bytes
  estimateDataSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  // Create backup with compression
  async createCompressedBackup(options = {}) {
    try {
      const kotData = await this.exportToKOT(options);
      
      // Simple compression by removing whitespace
      const compressedData = JSON.stringify(kotData);
      
      const blob = new Blob([compressedData], { 
        type: 'application/json' 
      });
      
      return blob;
    } catch (error) {
      console.error('Failed to create compressed backup:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const kotDataFormat = new KOTDataFormat();
export default KOTDataFormat;