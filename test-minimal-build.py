#!/usr/bin/env python3
"""
Test minimal build by temporarily simplifying complex components
"""
import os
import shutil

def create_minimal_components():
    """Create minimal versions of problematic components for testing"""
    
    # Backup original files
    files_to_backup = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/pages/TablesPage.js'
    ]
    
    for file_path in files_to_backup:
        if os.path.exists(file_path):
            backup_path = file_path + '.backup'
            shutil.copy2(file_path, backup_path)
            print(f"✅ Backed up {file_path} to {backup_path}")
    
    # Create minimal SuperAdminPage
    minimal_superadmin = '''import React from 'react';
import Layout from '../components/Layout';

const SuperAdminPage = ({ user }) => {
  return (
    <Layout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">SuperAdmin Dashboard</h1>
        <p className="text-gray-600 mt-2">SuperAdmin functionality is being rebuilt...</p>
      </div>
    </Layout>
  );
};

export default SuperAdminPage;'''

    # Create minimal TablesPage
    minimal_tables = '''import React from 'react';
import Layout from '../components/Layout';

const TablesPage = ({ user }) => {
  return (
    <Layout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Tables Management</h1>
        <p className="text-gray-600 mt-2">Tables functionality is being rebuilt...</p>
      </div>
    </Layout>
  );
};

export default TablesPage;'''

    # Write minimal components
    with open('frontend/src/pages/SuperAdminPage.js', 'w', encoding='utf-8') as f:
        f.write(minimal_superadmin)
    print("✅ Created minimal SuperAdminPage.js")
    
    with open('frontend/src/pages/TablesPage.js', 'w', encoding='utf-8') as f:
        f.write(minimal_tables)
    print("✅ Created minimal TablesPage.js")

def restore_original_components():
    """Restore original components from backup"""
    
    files_to_restore = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/pages/TablesPage.js'
    ]
    
    for file_path in files_to_restore:
        backup_path = file_path + '.backup'
        if os.path.exists(backup_path):
            shutil.copy2(backup_path, file_path)
            os.remove(backup_path)
            print(f"✅ Restored {file_path} from backup")

def main():
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'restore':
        print("🔄 Restoring original components...")
        restore_original_components()
        print("✅ Restoration complete!")
    else:
        print("🔧 Creating minimal components for build test...")
        create_minimal_components()
        print("✅ Minimal components created!")
        print("\n💡 To test build:")
        print("   cd frontend && npm run build")
        print("\n💡 To restore original files:")
        print("   python test-minimal-build.py restore")

if __name__ == "__main__":
    main()