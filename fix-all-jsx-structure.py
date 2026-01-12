#!/usr/bin/env python3
"""
Fix all JSX structure issues in React components
"""
import os
import re
import sys

def fix_jsx_structure_issues():
    """Fix JSX structure issues that cause build failures"""
    
    files_to_fix = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/pages/InventoryPage.js',
        'frontend/src/pages/TablesPage.js'
    ]
    
    fixes_applied = []
    
    for file_path in files_to_fix:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            continue
            
        print(f"🔧 Fixing JSX structure in {file_path}...")
        
        try:
            # Read file with proper encoding
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            original_content = content
            
            # Fix common JSX structure issues
            
            # 1. Fix self-closing divs that should be opening tags
            # Pattern: <div ...></div> followed by content that should be inside
            content = re.sub(r'<div([^>]*)></div>\s*\n\s*([^<\n]+)', r'<div\1>\n          \2', content)
            
            # 2. Fix self-closing divs with /> that should be opening tags
            # Look for patterns where a self-closing div is followed by content
            lines = content.split('\n')
            fixed_lines = []
            i = 0
            
            while i < len(lines):
                line = lines[i]
                
                # Check if this line has a self-closing div followed by content that should be inside
                if '<div' in line and '/>' in line and i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line starts with content or another element that should be inside
                    if (next_line and not next_line.startswith('</') and 
                        not next_line.startswith('<div') and 
                        not next_line.startswith('{/*') and
                        not next_line.startswith('//') and
                        not next_line.startswith('/*')):
                        # Convert self-closing div to opening div
                        line = line.replace('/>', '>')
                        # We'll need to add a closing div later
                
                # Check for pattern where content appears after a closing div
                if line.strip().endswith('</div>') and i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line has content that should be inside a div
                    if (next_line and 
                        not next_line.startswith('<') and 
                        not next_line.startswith('}') and
                        not next_line.startswith('//') and
                        not next_line.startswith('/*') and
                        not next_line.startswith('{/*')):
                        # This might be a prematurely closed div
                        # Convert </div> to opening div structure
                        indent = len(line) - len(line.lstrip())
                        line = line.replace('</div>', '>')
                        # The content will be added in the next iteration
                
                fixed_lines.append(line)
                i += 1
            
            content = '\n'.join(fixed_lines)
            
            # 3. Fix specific patterns found in the error messages
            
            # Fix the pattern: <div></div> followed by content
            content = re.sub(
                r'(<div[^>]*>)</div>\s*\n(\s*)([^<\n][^\n]*)',
                r'\1\n\2  \3',
                content,
                flags=re.MULTILINE
            )
            
            # Fix self-closing divs that should contain content
            content = re.sub(
                r'(<div[^>]*) />\s*\n(\s*)([^<\n][^\n]*)',
                r'\1>\n\2  \3\n\2</div>',
                content,
                flags=re.MULTILINE
            )
            
            # 4. Ensure proper JSX element nesting
            # Look for adjacent JSX elements that need to be wrapped
            
            # 5. Fix SelectItem empty values
            content = re.sub(r'<SelectItem value=""', '<SelectItem value="none"', content)
            content = re.sub(r'<SelectItem value=\'\'', '<SelectItem value="none"', content)
            
            # Write back the fixed content
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixes_applied.append(file_path)
                print(f"✅ Fixed JSX structure in {file_path}")
            else:
                print(f"ℹ️  No JSX structure changes needed for {file_path}")
                
        except Exception as e:
            print(f"❌ Error fixing {file_path}: {e}")
    
    return fixes_applied

def main():
    print("🔧 Starting JSX Structure Fix...")
    print("=" * 50)
    
    fixes = fix_jsx_structure_issues()
    
    print("\n" + "=" * 50)
    print(f"✅ JSX Structure Fix Complete!")
    print(f"📁 Files fixed: {len(fixes)}")
    
    if fixes:
        print("\n🔧 Fixed files:")
        for file_path in fixes:
            print(f"   ✅ {file_path}")
    
    print("\n💡 Next steps:")
    print("   1. Test build process")
    print("   2. Check for any remaining syntax errors")
    print("   3. Deploy if all tests pass")

if __name__ == "__main__":
    main()