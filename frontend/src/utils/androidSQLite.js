/**
 * Android SQLite Bridge for BillByteKOT
 * Provides native SQLite access for Android WebView
 */

class AndroidSQLiteBridge {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.hasNativeInterface = typeof window.AndroidInterface !== 'undefined';
    this.hasCordova = typeof window.cordova !== 'undefined';
    this.db = null;
  }

  async initialize() {
    if (!this.isAndroid) {
      throw new Error('AndroidSQLiteBridge can only be used on Android devices');
    }

    try {
      if (this.hasNativeInterface) {
        // Custom Android WebView Interface
        console.log('🤖 Using native Android SQLite interface');
        await this.initializeNativeInterface();
      } else if (this.hasCordova && window.sqlitePlugin) {
        // Cordova SQLite Plugin
        console.log('📱 Using Cordova SQLite plugin');
        await this.initializeCordovaPlugin();
      } else {
        throw new Error('No Android SQLite interface available');
      }

      console.log('✅ Android SQLite bridge initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Android SQLite bridge:', error);
      throw error;
    }
  }

  async initializeNativeInterface() {
    // Initialize native Android SQLite interface
    this.db = {
      executeSql: async (sql, params = []) => {
        return new Promise((resolve, reject) => {
          try {
            const result = window.AndroidInterface.executeSql(sql, JSON.stringify(params));
            const parsedResult = JSON.parse(result);
            
            if (parsedResult.error) {
              reject(new Error(parsedResult.error));
            } else {
              resolve(parsedResult);
            }
          } catch (error) {
            reject(error);
          }
        });
      },

      transaction: (callback) => {
        return new Promise((resolve, reject) => {
          try {
            window.AndroidInterface.beginTransaction();
            
            const tx = {
              executeSql: async (sql, params = []) => {
                return await this.db.executeSql(sql, params);
              }
            };

            callback(tx);
            window.AndroidInterface.commitTransaction();
            resolve();
          } catch (error) {
            window.AndroidInterface.rollbackTransaction();
            reject(error);
          }
        });
      }
    };
  }

  async initializeCordovaPlugin() {
    // Initialize Cordova SQLite plugin
    this.db = window.sqlitePlugin.openDatabase({
      name: 'BillByteKOT.db',
      location: 'default',
      androidDatabaseProvider: 'system'
    });

    // Promisify the executeSql method
    const originalExecuteSql = this.db.executeSql.bind(this.db);
    this.db.executeSql = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        originalExecuteSql(
          sql,
          params,
          (result) => resolve(result),
          (error) => reject(error)
        );
      });
    };

    // Promisify the transaction method
    const originalTransaction = this.db.transaction.bind(this.db);
    this.db.transaction = (callback) => {
      return new Promise((resolve, reject) => {
        originalTransaction(
          callback,
          (error) => reject(error),
          () => resolve()
        );
      });
    };
  }

  async executeSql(sql, params = []) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.executeSql(sql, params);
      return this.formatResult(result);
    } catch (error) {
      console.error('❌ SQL execution failed:', { sql, params, error });
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return await this.db.transaction(callback);
  }

  formatResult(result) {
    // Standardize result format across different SQLite implementations
    if (this.hasNativeInterface) {
      return result;
    } else if (this.hasCordova) {
      return {
        rows: Array.from({ length: result.rows.length }, (_, i) => result.rows.item(i)),
        rowsAffected: result.rowsAffected,
        insertId: result.insertId
      };
    }
  }

  // Utility methods for common operations
  async createTable(tableName, schema) {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
    return await this.executeSql(sql);
  }

  async insert(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return await this.executeSql(sql, values);
  }

  async update(tableName, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    return await this.executeSql(sql, values);
  }

  async delete(tableName, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    return await this.executeSql(sql, whereParams);
  }

  async select(tableName, options = {}) {
    const {
      columns = '*',
      where = '',
      whereParams = [],
      orderBy = '',
      limit = '',
      offset = ''
    } = options;

    let sql = `SELECT ${columns} FROM ${tableName}`;
    
    if (where) sql += ` WHERE ${where}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;

    const result = await this.executeSql(sql, whereParams);
    return result.rows || [];
  }

  async count(tableName, where = '', whereParams = []) {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (where) sql += ` WHERE ${where}`;

    const result = await this.executeSql(sql, whereParams);
    return result.rows[0]?.count || 0;
  }

  // Backup and restore methods
  async exportDatabase() {
    try {
      if (this.hasNativeInterface && window.AndroidInterface.exportDatabase) {
        const exportPath = await window.AndroidInterface.exportDatabase();
        return exportPath;
      } else {
        console.warn('⚠️ Database export not supported on this platform');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to export database:', error);
      throw error;
    }
  }

  async importDatabase(filePath) {
    try {
      if (this.hasNativeInterface && window.AndroidInterface.importDatabase) {
        const success = await window.AndroidInterface.importDatabase(filePath);
        return success;
      } else {
        console.warn('⚠️ Database import not supported on this platform');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to import database:', error);
      throw error;
    }
  }

  // Performance optimization methods
  async vacuum() {
    try {
      await this.executeSql('VACUUM');
      console.log('✅ Database vacuumed successfully');
    } catch (error) {
      console.error('❌ Failed to vacuum database:', error);
    }
  }

  async analyze() {
    try {
      await this.executeSql('ANALYZE');
      console.log('✅ Database analyzed successfully');
    } catch (error) {
      console.error('❌ Failed to analyze database:', error);
    }
  }

  async getDbSize() {
    try {
      if (this.hasNativeInterface && window.AndroidInterface.getDatabaseSize) {
        return await window.AndroidInterface.getDatabaseSize();
      } else {
        console.warn('⚠️ Database size check not supported on this platform');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get database size:', error);
      return null;
    }
  }

  // Connection management
  async close() {
    try {
      if (this.hasCordova && this.db && this.db.close) {
        await this.db.close();
      } else if (this.hasNativeInterface && window.AndroidInterface.closeDatabase) {
        await window.AndroidInterface.closeDatabase();
      }
      
      this.db = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Failed to close database:', error);
    }
  }

  // Status methods
  isInitialized() {
    return this.db !== null;
  }

  getConnectionInfo() {
    return {
      isAndroid: this.isAndroid,
      hasNativeInterface: this.hasNativeInterface,
      hasCordova: this.hasCordova,
      isInitialized: this.isInitialized()
    };
  }
}

// Export singleton instance
export const androidSQLite = new AndroidSQLiteBridge();
export default androidSQLite;