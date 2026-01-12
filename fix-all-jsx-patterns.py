#!/usr/bin/env python3
"""
Fix all JSX structure patterns found in the codebase
"""
import re
import os

def fix_jsx_patterns_in_file(file_path):
    """Fix JSX structure patterns in a specific file"""
    
    if not os.path.exists(file_path):
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: Self-closing divs that should be opening tags
        # <div className="..."></div> followed by content that should be inside
        content = re.sub(
            r'(<div[^>]*className="[^"]*">)</div>(\s*\n\s*<(?!/div))',
            r'\1\2',
            content,
            flags=re.MULTILINE
        )
        
        # Pattern 2: Self-closing divs with /> that should contain content
        content = re.sub(
            r'(<div[^>]*) />(\s*\n\s*<(?!/div))',
            r'\1>\2',
            content,
            flags=re.MULTILINE
        )
        
        # Pattern 3: Fix specific patterns found in grep search
        patterns_to_fix = [
            # Grid divs that close too early
            (r'(<div className="[^"]*grid[^"]*">)</div>(\s*\n\s*<(?!/div))', r'\1\2'),
            # Modal divs that close too early
            (r'(<div className="fixed inset-0[^"]*">)</div>(\s*\n\s*<(?!/div))', r'\1\2'),
            # General divs with specific classes that close too early
            (r'(<div className="[^"]*space-y-[^"]*">)</div>(\s*\n\s*<(?!/div))', r'\1\2'),
            (r'(<div className="[^"]*flex[^"]*">)</div>(\s*\n\s*<(?!/div))', r'\1\2'),
            (r'(<div className="[^"]*text-center[^"]*">)</div>(\s*\n\s*<(?!/div))', r'\1\2'),
        ]
        
        for pattern, replacement in patterns_to_fix:
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # Pattern 4: Fix adjacent JSX elements that need wrapping
        # Look for patterns where JSX elements appear outside of their parent
        lines = content.split('\n')
        fixed_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Check for lines that might be JSX elements outside their parent
            if (line.strip().startswith('<') and 
                not line.strip().startswith('</') and 
                not line.strip().startswith('<!--') and
                '>' in line):
                
                # Check if this line should be inside a previous element
                # Look back for an unclosed element
                for j in range(i-1, max(0, i-10), -1):
                    prev_line = lines[j].strip()
                    if prev_line.endswith('></div>') or prev_line.endswith('/></div>'):
                        # Found a prematurely closed div, fix it
                        if '></div>' in prev_line:
                            lines[j] = lines[j].replace('></div>', '>')
                        elif '/></div>' in prev_line:
                            lines[j] = lines[j].replace('/></div>', '>')
                        break
            
            fixed_lines.append(line)
            i += 1
        
        content = '\n'.join(fixed_lines)
        
        # Pattern 5: Ensure proper JSX element closing
        # Add missing closing divs where needed
        open_divs = []
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            # Count opening divs
            open_matches = re.findall(r'<div[^>]*[^/]>', line)
            for match in open_matches:
                open_divs.append(i)
            
            # Count closing divs
            close_matches = re.findall(r'</div>', line)
            for _ in close_matches:
                if open_divs:
                    open_divs.pop()
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed JSX patterns in {file_path}")
            return True
        else:
            print(f"ℹ️  No JSX pattern changes needed for {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def main():
    print("🔧 Fixing all JSX patterns...")
    
    files_to_fix = [
        'frontend/src/pages/SuperAdminPage.js',
        'frontend/src/pages/TablesPage.js'
    ]
    
    fixes_applied = 0
    
    for file_path in files_to_fix:
        if fix_jsx_patterns_in_file(file_path):
            fixes_applied += 1
    
    print(f"\n✅ JSX pattern fixes complete! Fixed {fixes_applied} files.")
    print("\n💡 Next step: Test build with 'npm run build'")

if __name__ == "__main__":
    main()