#!/usr/bin/env python3
"""
Fix JSX syntax issues in React components
"""
import os
import re
import sys

def fix_jsx_syntax_issues():
    """Fix common JSX syntax issues that cause build failures"""
    
    files_to_fix = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/components/TopBanner.js',
        'frontend/src/pages/InventoryPage.js',
        'frontend/src/pages/TablesPage.js'
    ]
    
    fixes_applied = []
    
    for file_path in files_to_fix:
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            continue
            
        print(f"🔧 Fixing {file_path}...")
        
        try:
            # Read file with proper encoding
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            original_content = content
            
            # Fix 1: Remove unused imports in TopBanner.js
            if 'TopBanner.js' in file_path:
                # Remove unused imports
                content = re.sub(r'import.*?Gift.*?from.*?;?\n', '', content)
                content = re.sub(r'import.*?PartyPopper.*?from.*?;?\n', '', content)
                content = re.sub(r'import.*?Percent.*?from.*?;?\n', '', content)
                
                # Clean up import statement
                content = re.sub(
                    r'import \{ ([^}]*), Gift, ([^}]*), PartyPopper, ([^}]*), Percent, ([^}]*) \}',
                    r'import { \1, \2, \3, \4 }',
                    content
                )
                
                # Remove extra commas in imports
                content = re.sub(r', ,', ',', content)
                content = re.sub(r'\{ ,', '{ ', content)
                content = re.sub(r', \}', ' }', content)
            
            # Fix 2: Ensure proper JSX element closing
            # Look for incomplete JSX elements and fix them
            
            # Fix unclosed div tags
            content = re.sub(r'<div([^>]*)>\s*$', r'<div\1></div>', content, flags=re.MULTILINE)
            
            # Fix unclosed span tags
            content = re.sub(r'<span([^>]*)>\s*$', r'<span\1></span>', content, flags=re.MULTILINE)
            
            # Fix missing semicolons in import statements
            content = re.sub(r'(import \{[^}]+\}[^;]+)(\n)', r'\1;\2', content)
            
            # Fix SelectItem empty values
            content = re.sub(r'<SelectItem value=""', '<SelectItem value="none"', content)
            content = re.sub(r'<SelectItem value=\'\'', '<SelectItem value="none"', content)
            
            # Fix incomplete JSX elements by ensuring proper closing
            lines = content.split('\n')
            fixed_lines = []
            
            for i, line in enumerate(lines):
                # Check for incomplete JSX elements
                if '<' in line and '>' in line:
                    # Count opening and closing tags
                    open_tags = len(re.findall(r'<[^/][^>]*[^/]>', line))
                    close_tags = len(re.findall(r'</[^>]*>', line))
                    self_closing = len(re.findall(r'<[^>]*/>', line))
                    
                    # If we have unmatched opening tags, this might be incomplete
                    if open_tags > close_tags + self_closing:
                        # Look ahead to see if there's a closing tag
                        found_closing = False
                        for j in range(i + 1, min(i + 5, len(lines))):
                            if '</' in lines[j]:
                                found_closing = True
                                break
                        
                        if not found_closing and not line.strip().endswith('>'):
                            # This might be an incomplete line, try to fix it
                            if line.strip().endswith(',') or line.strip().endswith('{'):
                                # This is likely a continuation line, keep as is
                                pass
                            else:
                                # Try to close the tag if it looks incomplete
                                if '<' in line and not line.strip().endswith('>'):
                                    line = line.rstrip() + '>'
                
                fixed_lines.append(line)
            
            content = '\n'.join(fixed_lines)
            
            # Fix 3: Ensure proper component structure
            # Make sure all components have proper export
            if not re.search(r'export default \w+;?\s*$', content, re.MULTILINE):
                # Find the component name
                component_match = re.search(r'const (\w+) = ', content)
                if component_match:
                    component_name = component_match.group(1)
                    if not content.strip().endswith(f'export default {component_name};'):
                        content = content.rstrip() + f'\n\nexport default {component_name};\n'
            
            # Write back the fixed content
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixes_applied.append(file_path)
                print(f"✅ Fixed {file_path}")
            else:
                print(f"ℹ️  No changes needed for {file_path}")
                
        except Exception as e:
            print(f"❌ Error fixing {file_path}: {e}")
    
    return fixes_applied

def main():
    print("🔧 Starting JSX Syntax Fix...")
    print("=" * 50)
    
    fixes = fix_jsx_syntax_issues()
    
    print("\n" + "=" * 50)
    print(f"✅ JSX Syntax Fix Complete!")
    print(f"📁 Files fixed: {len(fixes)}")
    
    if fixes:
        print("\n🔧 Fixed files:")
        for file_path in fixes:
            print(f"   ✅ {file_path}")
    
    print("\n💡 Next steps:")
    print("   1. Run build test to verify fixes")
    print("   2. Check for any remaining syntax errors")
    print("   3. Deploy if all tests pass")

if __name__ == "__main__":
    main()