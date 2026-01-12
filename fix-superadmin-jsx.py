#!/usr/bin/env python3
"""
Fix specific JSX structure issues in SuperAdminPage.js
"""
import re

def fix_superadmin_jsx():
    """Fix JSX structure issues in SuperAdminPage.js"""
    
    file_path = 'frontend/src/pages/SuperAdminPage.js'
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix the specific pattern: div with premature closing
        # Pattern: <div ...></div> followed by JSX content that should be inside
        
        # Fix 1: The main login div issue
        content = re.sub(
            r'(<div className="min-h-screen[^>]*>)</div>\s*\n(\s*<Card)',
            r'\1\n\2',
            content
        )
        
        # Fix 2: Other similar patterns
        content = re.sub(
            r'(<div className="[^"]*grid[^"]*">)</div>\s*\n(\s*<[^/])',
            r'\1\n\2',
            content
        )
        
        # Fix 3: Modal divs with premature closing
        content = re.sub(
            r'(<div className="fixed inset-0[^>]*>)</div>\s*\n(\s*<Card)',
            r'\1\n\2',
            content
        )
        
        # Fix 4: General pattern of self-closing divs followed by content
        content = re.sub(
            r'(<div className="[^"]*">)</div>\s*\n(\s*<(?!/))',
            r'\1\n\2',
            content
        )
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed JSX structure issues in {file_path}")
            return True
        else:
            print(f"ℹ️  No JSX structure changes needed for {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    print("🔧 Fixing SuperAdminPage JSX structure...")
    
    if fix_superadmin_jsx():
        print("✅ SuperAdminPage JSX structure fixed!")
    else:
        print("ℹ️  No changes made to SuperAdminPage")
    
    print("\n💡 Next step: Test build with 'npm run build'")

if __name__ == "__main__":
    main()