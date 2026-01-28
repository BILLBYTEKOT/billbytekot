/**
 * Desktop SQLite Bridge for BillByteKOT Electron App
 * Provides native SQLite access for Electron desktop application
 */

class DesktopSQLiteBridge {
  constructor() {
    this.isElectron = this.detectElectron();
    this.db = null;
    this.dbPath = null;
  }

  detectElectron() {
    return (
      typeof window !== 'undefined' &&
      window.process &&
      window.process.type === 'renderer'
    ) || (
      typeof window !== 'undefined' &&
      window.electronAPI
    );
  }

  async initialize(dbPath = 'billbytekot.db') {
    if (!this.isElectron) {
      throw new Error('DesktopSQLiteBridge can only be used in Electron environment');
    }

    try {
      this.dbPath = dbPath;

      if (window.electronAPI && window.electronAPI.sqlite) {
        // Use Electron's main process SQLite bridge
        console.log('🖥️ Using Electron SQLite bridge');
        await this.initializeElectronBridge();
      } else {
        // Fallback to IndexedDB if SQLite not available
        console.log('⚠️ SQLite not available, falling back to IndexedDB');
        throw new Error('Electron SQLite bridge not available');
      }

      console.log('✅ Desktop SQLite bridge initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Desktop SQLite bridge:', error);
      throw error;
    }
  }

  async initializeElectronBridge() {
    // Initialize connection through Electron's main process
    const result = await window.electronAPI.sqlite.initialize(this.dbPath);
    
    if (!result.success) {
      throw new Error(`Failed to initialize SQLite: ${result.error}`);
    }

    this.db = {
      executeSql: async (sql, params = []) => {
        const result = await window.electronAPI.sqlite.execute(sql, params);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      },

      transaction: async (callback) => {
        try {
          await window.electronAPI.sqlite.beginTransaction();
          
          const tx = {
            executeSql: async (sql, params = []) => {
              return await this.db.executeSql(sql, params);
            }
          };

          await callback(tx);
          await window.electronAPI.sqlite.commitTransaction();
        } catch (error) {
          await window.electronAPI.sqlite.rollbackTransaction();
          throw error;
        }
      },

      close: async () => {
        return await window.electronAPI.sqlite.close();
      }
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
    // Standardize result format for consistency
    return {
      rows: result.rows || [],
      rowsAffected: result.rowsAffected || 0,
      insertId: result.insertId || null,
      changes: result.changes || 0
    };
  }

  // Utility methods for common operations
  async createTable(tableName, schema) {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
    return await this.executeSql(sql);
  }

  async insert(tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );

    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return await this.executeSql(sql, values);
  }

  async update(tableName, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [
      ...Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v),
      ...whereParams
    ];

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

  // Advanced query methods
  async exists(tableName, whereClause, whereParams = []) {
    const count = await this.count(tableName, whereClause, whereParams);
    return count > 0;
  }

  async findOne(tableName, whereClause, whereParams = []) {
    const results = await this.select(tableName, {
      where: whereClause,
      whereParams,
      limit: 1
    });
    return results.length > 0 ? results[0] : null;
  }

  async upsert(tableName, data, conflictColumns = ['id']) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const updateClause = Object.keys(data)
      .filter(key => !conflictColumns.includes(key))
      .map(key => `${key} = excluded.${key}`)
      .join(', ');
    
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );

    const sql = `
      INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})
      ON CONFLICT(${conflictColumns.join(', ')}) DO UPDATE SET ${updateClause}
    `;
    
    return await this.executeSql(sql, values);
  }

  // Backup and restore methods
  async backup(backupPath) {
    try {
      if (window.electronAPI && window.electronAPI.sqlite.backup) {
        const result = await window.electronAPI.sqlite.backup(backupPath);
        if (result.success) {
          console.log('✅ Database backup created:', backupPath);
          return backupPath;
        } else {
          throw new Error(result.error);
        }
      } else {
        console.warn('⚠️ Database backup not supported');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to backup database:', error);
      throw error;
    }
  }

  async restore(backupPath) {
    try {
      if (window.electronAPI && window.electronAPI.sqlite.restore) {
        const result = await window.electronAPI.sqlite.restore(backupPath);
        if (result.success) {
          console.log('✅ Database restored from:', backupPath);
          return true;
        } else {
          throw new Error(result.error);
        }
      } else {
        console.warn('⚠️ Database restore not supported');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to restore database:', error);
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

  async reindex() {
    try {
      await this.executeSql('REINDEX');
      console.log('✅ Database reindexed successfully');
    } catch (error) {
      console.error('❌ Failed to reindex database:', error);
    }
  }

  // Database information methods
  async getDbInfo() {
    try {
      const tables = await this.executeSql(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      const dbSize = await this.getDbSize();
      const pageCount = await this.executeSql('PRAGMA page_count');
      const pageSize = await this.executeSql('PRAGMA page_size');
      
      return {
        tables: tables.rows.map(row => row.name),
        size: dbSize,
        pageCount: pageCount.rows[0]?.page_count || 0,
        pageSize: pageSize.rows[0]?.page_size || 0,
        path: this.dbPath
      };
    } catch (error) {
      console.error('❌ Failed to get database info:', error);
      return null;
    }
  }

  async getDbSize() {
    try {
      if (window.electronAPI && window.electronAPI.sqlite.getSize) {
        const result = await window.electronAPI.sqlite.getSize();
        return result.success ? result.size : null;
      } else {
        console.warn('⚠️ Database size check not supported');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get database size:', error);
      return null;
    }
  }

  async getTableInfo(tableName) {
    try {
      const columns = await this.executeSql(`PRAGMA table_info(${tableName})`);
      const indexes = await this.executeSql(`PRAGMA index_list(${tableName})`);
      const rowCount = await this.count(tableName);
      
      return {
        columns: columns.rows,
        indexes: indexes.rows,
        rowCount
      };
    } catch (error) {
      console.error(`❌ Failed to get table info for ${tableName}:`, error);
      return null;
    }
  }

  // Connection management
  async close() {
    try {
      if (this.db && this.db.close) {
        await this.db.close();
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
      isElectron: this.isElectron,
      isInitialized: this.isInitialized(),
      dbPath: this.dbPath,
      hasElectronAPI: !!(window.electronAPI && window.electronAPI.sqlite)
    };
  }

  // Migration methods
  async runMigration(migrationSql) {
    try {
      await this.transaction(async (tx) => {
        const statements = migrationSql.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await tx.executeSql(statement.trim());
          }
        }
      });
      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async getCurrentVersion() {
    try {
      const result = await this.executeSql('PRAGMA user_version');
      return result.rows[0]?.user_version || 0;
    } catch (error) {
      console.error('❌ Failed to get database version:', error);
      return 0;
    }
  }

  async setVersion(version) {
    try {
      await this.executeSql(`PRAGMA user_version = ${version}`);
      console.log(`✅ Database version set to ${version}`);
    } catch (error) {
      console.error('❌ Failed to set database version:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const desktopSQLite = new DesktopSQLiteBridge();
export default desktopSQLite;