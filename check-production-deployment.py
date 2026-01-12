#!/usr/bin/env python3
"""
Check for common production deployment issues
"""

import os
import json
import re
from pathlib import Path

def check_file_syntax():
    """Check for syntax issues in key files"""
    
    print("🔍 Checking File Syntax")
    print("=" * 40)
    
    files_to_check = [
        "frontend/src/pages/SuperAdminPage.js",
        "frontend/src/components/TopBanner.js", 
        "frontend/src/pages/InventoryPage.js",
        "frontend/src/pages/TablesPage.js",
        "frontend/src/utils/printUtils.js",
        "frontend/src/utils/qrCodeUtils.js",
        "backend/server.py"
    ]
    
    issues = []
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for common syntax issues
                file_issues = check_common_syntax_issues(file_path, content)
                if file_issues:
                    issues.extend(file_issues)
                else:
                    print(f"✅ {file_path}: No issues found")
                    
            except Exception as e:
                issues.append(f"❌ {file_path}: Error reading file - {e}")
        else:
            issues.append(f"❌ {file_path}: File not found")
    
    return issues

def check_common_syntax_issues(file_path, content):
    """Check for common syntax issues that cause build failures"""
    
    issues = []
    lines = content.split('\n')
    
    # JavaScript/JSX specific checks
    if file_path.endswith('.js'):
        # Check for unmatched braces
        open_braces = content.count('{')
        close_braces = content.count('}')
        if open_braces != close_braces:
            issues.append(f"❌ {file_path}: Unmatched braces ({open_braces} open, {close_braces} close)")
        
        # Check for unmatched parentheses
        open_parens = content.count('(')
        close_parens = content.count(')')
        if open_parens != close_parens:
            issues.append(f"❌ {file_path}: Unmatched parentheses ({open_parens} open, {close_parens} close)")
        
        # Check for multiple export default statements
        export_defaults = content.count('export default')
        if export_defaults > 1:
            issues.append(f"❌ {file_path}: Multiple export default statements ({export_defaults})")
        
        # Check for unterminated JSX
        jsx_opens = len(re.findall(r'<[A-Z][^>]*[^/]>', content))
        jsx_closes = len(re.findall(r'</[A-Z][^>]*>', content))
        jsx_self_closing = len(re.findall(r'<[A-Z][^>]*/>', content))
        
        # Check for empty SelectItem values (common React issue)
        if 'SelectItem' in content and 'value=""' in content:
            issues.append(f"❌ {file_path}: SelectItem with empty value found (not allowed)")
        
        # Check for incomplete JSX elements
        for i, line in enumerate(lines, 1):
            if '<' in line and '>' not in line and not line.strip().endswith('\\'):
                issues.append(f"❌ {file_path}:{i}: Potentially incomplete JSX element")
    
    # Python specific checks
    elif file_path.endswith('.py'):
        # Check for basic Python syntax
        try:
            compile(content, file_path, 'exec')
        except SyntaxError as e:
            issues.append(f"❌ {file_path}:{e.lineno}: Python syntax error - {e.msg}")
    
    return issues

def check_package_json():
    """Check package.json for issues"""
    
    print("\n📦 Checking package.json")
    print("=" * 40)
    
    package_path = "package.json"
    if not os.path.exists(package_path):
        return ["❌ package.json not found"]
    
    try:
        with open(package_path, 'r') as f:
            package_data = json.load(f)
        
        issues = []
        
        # Check for required scripts
        scripts = package_data.get('scripts', {})
        required_scripts = ['build', 'start']
        
        for script in required_scripts:
            if script not in scripts:
                issues.append(f"❌ Missing required script: {script}")
            else:
                print(f"✅ Script '{script}': {scripts[script]}")
        
        # Check for build script issues
        if 'build' in scripts:
            build_script = scripts['build']
            if 'craco build' in build_script:
                print("✅ Using craco build")
            elif 'react-scripts build' in build_script:
                print("✅ Using react-scripts build")
            else:
                issues.append(f"⚠️  Unusual build script: {build_script}")
        
        return issues
        
    except json.JSONDecodeError as e:
        return [f"❌ package.json syntax error: {e}"]
    except Exception as e:
        return [f"❌ Error reading package.json: {e}"]

def check_environment_files():
    """Check for environment file issues"""
    
    print("\n🌍 Checking Environment Files")
    print("=" * 40)
    
    env_files = [
        "backend/.env",
        ".env",
        ".env.local",
        ".env.production"
    ]
    
    issues = []
    found_env = False
    
    for env_file in env_files:
        if os.path.exists(env_file):
            found_env = True
            print(f"✅ Found: {env_file}")
            
            # Check for common env issues
            try:
                with open(env_file, 'r') as f:
                    env_content = f.read()
                
                # Check for quotes in env values (can cause issues)
                lines = env_content.split('\n')
                for i, line in enumerate(lines, 1):
                    if '=' in line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        if value.startswith('"') and not value.endswith('"'):
                            issues.append(f"⚠️  {env_file}:{i}: Unmatched quotes in {key}")
                        
            except Exception as e:
                issues.append(f"❌ Error reading {env_file}: {e}")
    
    if not found_env:
        issues.append("⚠️  No environment files found")
    
    return issues

def check_import_statements():
    """Check for problematic import statements"""
    
    print("\n📥 Checking Import Statements")
    print("=" * 40)
    
    js_files = [
        "frontend/src/pages/SuperAdminPage.js",
        "frontend/src/components/TopBanner.js",
        "frontend/src/pages/InventoryPage.js",
        "frontend/src/pages/TablesPage.js"
    ]
    
    issues = []
    
    for file_path in js_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                
                # Check for import issues
                import_lines = [line for line in content.split('\n') if line.strip().startswith('import')]
                
                for line in import_lines:
                    # Check for missing semicolons
                    if not line.strip().endswith(';'):
                        issues.append(f"⚠️  {file_path}: Import missing semicolon: {line.strip()}")
                    
                    # Check for relative imports that might be broken
                    if '../' in line and line.count('../') > 3:
                        issues.append(f"⚠️  {file_path}: Deep relative import: {line.strip()}")
                
                print(f"✅ {file_path}: {len(import_lines)} imports checked")
                
            except Exception as e:
                issues.append(f"❌ Error checking imports in {file_path}: {e}")
    
    return issues

def check_build_files():
    """Check for build-related files"""
    
    print("\n🏗️  Checking Build Files")
    print("=" * 40)
    
    build_files = [
        "craco.config.js",
        "webpack.config.js", 
        "tsconfig.json",
        "public/index.html"
    ]
    
    issues = []
    
    for file_path in build_files:
        if os.path.exists(file_path):
            print(f"✅ Found: {file_path}")
            
            # Basic syntax check for JS files
            if file_path.endswith('.js'):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    # Check for basic syntax issues
                    if content.count('{') != content.count('}'):
                        issues.append(f"❌ {file_path}: Unmatched braces")
                        
                except Exception as e:
                    issues.append(f"❌ Error reading {file_path}: {e}")
        else:
            print(f"ℹ️  Not found: {file_path}")
    
    return issues

def main():
    """Run all deployment checks"""
    
    print("🚀 Production Deployment Check")
    print("=" * 60)
    
    all_issues = []
    
    # Run all checks
    all_issues.extend(check_file_syntax())
    all_issues.extend(check_package_json())
    all_issues.extend(check_environment_files())
    all_issues.extend(check_import_statements())
    all_issues.extend(check_build_files())
    
    # Summary
    print("\n🎯 Summary")
    print("=" * 40)
    
    if all_issues:
        print(f"❌ Found {len(all_issues)} potential issues:")
        for issue in all_issues:
            print(f"   {issue}")
        
        print("\n🔧 Recommended Actions:")
        print("1. Fix syntax errors and unmatched braces/parentheses")
        print("2. Remove multiple export default statements")
        print("3. Fix SelectItem empty values")
        print("4. Check environment file formatting")
        print("5. Verify all import statements")
        
        return False
    else:
        print("✅ No deployment issues found!")
        print("🚀 Ready for production deployment")
        return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)