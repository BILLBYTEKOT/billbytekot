#!/usr/bin/env python3
"""
Fix encoding and syntax issues in React components
"""
import os
import re
import sys

def fix_file_encoding_and_syntax(file_path):
    """Fix encoding and syntax issues in a specific file"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"🔧 Fixing {file_path}...")
    
    try:
        # Try to read with different encodings
        content = None
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                    content = f.read()
                print(f"✅ Successfully read {file_path} with {encoding} encoding")
                break
            except Exception as e:
                print(f"⚠️  Failed to read with {encoding}: {e}")
                continue
        
        if content is None:
            print(f"❌ Could not read {file_path} with any encoding")
            return False
        
        original_content = content
        
        # Fix encoding issues - replace problematic characters
        content = content.replace('\x81', '')
        content = content.replace('\x8f', '')
        content = content.replace('\x90', '')
        content = content.replace('\x9d', '')
        
        # Remove any other non-printable characters except newlines and tabs
        content = ''.join(char for char in content if ord(char) >= 32 or char in '\n\t\r')
        
        # Fix import statements - ensure they end with semicolons
        lines = content.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Fix import statements missing semicolons
            if line.strip().startswith('import ') and not line.strip().endswith(';') and not line.strip().endswith(','):
                if '{' in line and '}' in line:
                    line = line.rstrip() + ';'
            
            # Fix SelectItem empty values
            if 'SelectItem' in line and 'value=""' in line:
                line = line.replace('value=""', 'value="none"')
            if 'SelectItem' in line and "value=''" in line:
                line = line.replace("value=''", 'value="none"')
            
            fixed_lines.append(line)
        
        content = '\n'.join(fixed_lines)
        
        # Remove unused imports in TopBanner.js
        if 'TopBanner.js' in file_path:
            # Clean up the import statement to remove unused imports
            import_pattern = r'import \{ ([^}]+) \} from [\'"]lucide-react[\'"];'
            match = re.search(import_pattern, content)
            if match:
                imports = match.group(1)
                # Remove unused imports
                used_imports = []
                for imp in imports.split(','):
                    imp = imp.strip()
                    if imp in ['Gift', 'PartyPopper', 'Percent']:
                        continue  # Skip unused imports
                    used_imports.append(imp)
                
                new_import = f"import {{ {', '.join(used_imports)} }} from 'lucide-react';"
                content = re.sub(import_pattern, new_import, content)
        
        # Write back with UTF-8 encoding
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(content)
            print(f"✅ Fixed encoding and syntax in {file_path}")
            return True
        else:
            print(f"ℹ️  No changes needed for {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    print("🔧 Starting Encoding and Syntax Fix...")
    print("=" * 50)
    
    files_to_fix = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/components/TopBanner.js',
        'frontend/src/pages/InventoryPage.js',
        'frontend/src/pages/TablesPage.js',
        'frontend/src/utils/printUtils.js'
    ]
    
    fixes_applied = 0
    
    for file_path in files_to_fix:
        if fix_file_encoding_and_syntax(file_path):
            fixes_applied += 1
    
    print("\n" + "=" * 50)
    print(f"✅ Encoding and Syntax Fix Complete!")
    print(f"📁 Files fixed: {fixes_applied}")
    
    print("\n💡 Next steps:")
    print("   1. Run production deployment check")
    print("   2. Test build process")
    print("   3. Deploy if all tests pass")

if __name__ == "__main__":
    main()