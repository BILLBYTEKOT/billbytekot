#!/usr/bin/env python3
"""
Update MongoDB Atlas Connection with New Credentials
===================================================

This script updates the RestoBill AI backend with the new MongoDB Atlas
cluster credentials and tests the connection.

New Credentials:
- Username: shivshankarkumar281_db_user
- Password: RNdGNCCyBtj1d5Ar
- Cluster: retsro-ai.un0np9m.mongodb.net
- App Name: retsro-ai

Usage:
    python update-mongo-credentials.py [--test] [--update-env] [--deploy]
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus


# Color codes for output
class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    END = "\033[0m"


def log(message, color=Colors.WHITE):
    """Print colored log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")


def log_success(message):
    log(f"✅ {message}", Colors.GREEN)


def log_error(message):
    log(f"❌ {message}", Colors.RED)


def log_warning(message):
    log(f"⚠️  {message}", Colors.YELLOW)


def log_info(message):
    log(f"ℹ️  {message}", Colors.BLUE)


def log_header(message):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{message}{Colors.END}")
    print(f"{Colors.CYAN}{'=' * 60}{Colors.END}")


# New MongoDB Atlas credentials
NEW_ATLAS_USERNAME = "shivshankarkumar281_db_user"
NEW_ATLAS_PASSWORD = "RNdGNCCyBtj1d5Ar"
NEW_ATLAS_CLUSTER = "retsro-ai.un0np9m.mongodb.net"
NEW_APP_NAME = "retsro-ai"
DATABASE_NAME = "restrobill"


def build_connection_string(include_app_name=True):
    """Build the new MongoDB connection string"""

    # URL encode credentials to handle special characters
    encoded_username = quote_plus(NEW_ATLAS_USERNAME)
    encoded_password = quote_plus(NEW_ATLAS_PASSWORD)

    # Base connection string
    base_url = (
        f"mongodb+srv://{encoded_username}:{encoded_password}@{NEW_ATLAS_CLUSTER}/"
    )

    # Connection parameters optimized for Render deployment
    params = [
        "retryWrites=true",
        "w=majority",
        "authSource=admin",
        "readPreference=primary",
        "serverSelectionTimeoutMS=10000",
        "connectTimeoutMS=15000",
        "socketTimeoutMS=20000",
    ]

    if include_app_name:
        params.append(f"appName={NEW_APP_NAME}")

    return f"{base_url}?{'&'.join(params)}"


def get_connection_variants():
    """Get different connection string variants to test"""

    base_url = f"mongodb+srv://{quote_plus(NEW_ATLAS_USERNAME)}:{quote_plus(NEW_ATLAS_PASSWORD)}@{NEW_ATLAS_CLUSTER}/{DATABASE_NAME}"

    variants = {
        "optimized": {
            "name": "Render Optimized",
            "url": f"{base_url}?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName={NEW_APP_NAME}",
            "client_options": {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 15000,
                "socketTimeoutMS": 20000,
                "maxPoolSize": 5,
                "minPoolSize": 1,
            },
        },
        "tls_bypass": {
            "name": "TLS Bypass",
            "url": f"{base_url}?retryWrites=true&w=majority&tls=true&tlsInsecure=true&authSource=admin&appName={NEW_APP_NAME}",
            "client_options": {
                "tls": True,
                "tlsInsecure": True,
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 15000,
                "socketTimeoutMS": 20000,
            },
        },
        "minimal": {
            "name": "Minimal",
            "url": f"{base_url}?retryWrites=true&w=majority&appName={NEW_APP_NAME}",
            "client_options": {
                "serverSelectionTimeoutMS": 8000,
                "connectTimeoutMS": 12000,
                "socketTimeoutMS": 15000,
            },
        },
        "production": {
            "name": "Production Ready",
            "url": f"{base_url}?retryWrites=true&w=majority&authSource=admin&readPreference=primaryPreferred&maxIdleTimeMS=120000&appName={NEW_APP_NAME}",
            "client_options": {
                "serverSelectionTimeoutMS": 15000,
                "connectTimeoutMS": 20000,
                "socketTimeoutMS": 30000,
                "maxPoolSize": 10,
                "minPoolSize": 2,
                "maxIdleTimeMS": 120000,
            },
        },
    }

    return variants


async def test_connection(variant_name, connection_url, client_options):
    """Test a MongoDB connection variant"""

    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        log_info(f"Testing {variant_name} connection...")

        # Create client with timeout
        client = AsyncIOMotorClient(connection_url, **client_options)
        db = client[DATABASE_NAME]

        # Test connection with ping
        await asyncio.wait_for(db.command("ping"), timeout=10.0)

        # Test database operations
        collections = await db.list_collection_names()
        collection_count = len(collections)

        # Test write operation
        test_collection = db.connection_test
        test_doc = {
            "test": True,
            "timestamp": datetime.utcnow(),
            "connection_variant": variant_name,
            "cluster": NEW_ATLAS_CLUSTER,
        }

        result = await test_collection.insert_one(test_doc)
        inserted_id = result.inserted_id

        # Test read operation
        found_doc = await test_collection.find_one({"_id": inserted_id})

        # Clean up test document
        await test_collection.delete_one({"_id": inserted_id})

        # Close connection
        client.close()

        log_success(f"{variant_name}: Connection successful!")
        log_info(f"  Database: {DATABASE_NAME}")
        log_info(f"  Collections: {collection_count}")
        log_info(f"  Write/Read test: Passed")

        return True, connection_url, client_options

    except ImportError:
        log_error("Motor/PyMongo not installed. Run: pip install motor pymongo")
        return False, None, None

    except asyncio.TimeoutError:
        log_error(f"{variant_name}: Connection timeout")
        return False, None, None

    except Exception as e:
        error_msg = str(e)
        if len(error_msg) > 100:
            error_msg = error_msg[:100] + "..."
        log_error(f"{variant_name}: {error_msg}")
        return False, None, None


async def test_all_connections():
    """Test all connection variants"""

    log_header("🧪 Testing New MongoDB Atlas Connection")

    print(f"Cluster: {NEW_ATLAS_CLUSTER}")
    print(f"Username: {NEW_ATLAS_USERNAME}")
    print(f"Database: {DATABASE_NAME}")
    print(f"App Name: {NEW_APP_NAME}")

    variants = get_connection_variants()
    successful_connections = []

    for variant_key, variant_data in variants.items():
        success, url, options = await test_connection(
            variant_data["name"], variant_data["url"], variant_data["client_options"]
        )

        if success:
            successful_connections.append(
                {
                    "name": variant_data["name"],
                    "key": variant_key,
                    "url": url,
                    "options": options,
                }
            )

        print()  # Empty line for readability

    return successful_connections


def create_environment_files(successful_connections):
    """Create updated environment files"""

    if not successful_connections:
        log_error("No successful connections found - cannot create environment files")
        return False

    # Use the first successful connection (usually the optimized one)
    best_connection = successful_connections[0]
    best_url = best_connection["url"]

    log_header("📝 Creating Updated Environment Files")

    # Create .env file
    env_content = f"""# RestoBill AI Backend - Updated MongoDB Atlas Configuration
# Generated: {datetime.now().isoformat()}
# Connection: {best_connection["name"]}

# New MongoDB Atlas Cluster Connection
MONGO_URL={best_url}
DB_NAME={DATABASE_NAME}

# Application Configuration
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
HOST=0.0.0.0
PORT=10000

# Security Settings (CHANGE THESE!)
JWT_SECRET=your-secure-jwt-secret-32-characters-minimum
JWT_ALGORITHM=HS256

# Optional: Payment Gateway
# RAZORPAY_KEY_ID=your_razorpay_key_id
# RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Atlas Cluster Information
# Cluster: {NEW_ATLAS_CLUSTER}
# Username: {NEW_ATLAS_USERNAME}
# Database: {DATABASE_NAME}
# App Name: {NEW_APP_NAME}
# Updated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""

    try:
        env_path = Path(__file__).parent / ".env"
        with open(env_path, "w") as f:
            f.write(env_content)
        log_success(f"Created: {env_path}")
    except Exception as e:
        log_error(f"Failed to create .env file: {e}")
        return False

    # Create Render deployment environment variables template
    render_env_content = f"""# Render Environment Variables for RestoBill AI
# Copy these to your Render Dashboard → Environment Variables

# Required Variables
MONGO_URL={best_url}
DB_NAME={DATABASE_NAME}
JWT_SECRET=your-secure-jwt-secret-32-characters-minimum
ENVIRONMENT=production

# Optional Variables
HOST=0.0.0.0
PORT=10000
DEBUG=false
LOG_LEVEL=info

# Payment Integration (Optional)
# RAZORPAY_KEY_ID=your_razorpay_key_id
# RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# Cluster: {NEW_ATLAS_CLUSTER}
# Connection Test: {best_connection["name"]} - SUCCESS ✅
"""

    try:
        render_path = Path(__file__).parent / "render-environment-variables.txt"
        with open(render_path, "w") as f:
            f.write(render_env_content)
        log_success(f"Created: {render_path}")
    except Exception as e:
        log_error(f"Failed to create render environment file: {e}")

    return True


def update_server_py():
    """Update server.py with new default MongoDB URL"""

    log_header("🔧 Updating server.py Configuration")

    server_path = Path(__file__).parent / "server.py"

    if not server_path.exists():
        log_error("server.py not found!")
        return False

    try:
        # Read current server.py
        with open(server_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Update the default MongoDB URL in server.py
        old_pattern = (
            'mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/restrobill")'
        )
        new_default_url = build_connection_string()
        new_pattern = f'mongo_url = os.getenv("MONGO_URL", "{new_default_url}")'

        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            log_success("Updated default MongoDB URL in server.py")
        else:
            log_warning("Could not find default MongoDB URL pattern to update")
            log_info(
                "You may need to manually update the MONGO_URL environment variable"
            )

        # Write updated content
        with open(server_path, "w", encoding="utf-8") as f:
            f.write(content)

        log_success("server.py updated successfully")
        return True

    except Exception as e:
        log_error(f"Failed to update server.py: {e}")
        return False


def show_deployment_instructions(successful_connections):
    """Show deployment instructions"""

    if not successful_connections:
        return

    log_header("🚀 Deployment Instructions")

    best_connection = successful_connections[0]

    print("1. Update Render Environment Variables:")
    print(f"   - Go to your Render Dashboard")
    print(f"   - Navigate to your restro-ai service")
    print(f"   - Go to Environment tab")
    print(f"   - Update/Add these variables:")
    print(f"")
    print(f"   MONGO_URL={best_connection['url']}")
    print(f"   DB_NAME={DATABASE_NAME}")
    print(f"   JWT_SECRET=your-secure-jwt-secret-here")
    print(f"   ENVIRONMENT=production")
    print(f"")

    print("2. Deploy Updated Code:")
    print(f"   git add .")
    print(f"   git commit -m 'Update MongoDB Atlas credentials'")
    print(f"   git push origin main")
    print(f"")

    print("3. Monitor Deployment:")
    print(f"   - Watch Render logs for: '✅ Database connected: {DATABASE_NAME}'")
    print(f"   - Test: curl https://restro-ai.onrender.com/health")
    print(f"")

    if len(successful_connections) > 1:
        print("Alternative Connection Strings (if primary fails):")
        for conn in successful_connections[1:]:
            print(f"   {conn['name']}: {conn['url']}")


def show_mongodb_atlas_checklist():
    """Show MongoDB Atlas configuration checklist"""

    log_header("📋 MongoDB Atlas Configuration Checklist")

    print("Ensure these settings in your MongoDB Atlas dashboard:")
    print("")

    print("1. Network Access:")
    print("   ✓ Add 0.0.0.0/0 to IP Access List")
    print("   ✓ Or add Render's IP ranges")
    print("")

    print("2. Database Access:")
    print(f"   ✓ User: {NEW_ATLAS_USERNAME}")
    print(f"   ✓ Password: {NEW_ATLAS_PASSWORD}")
    print(f"   ✓ Database User Privileges: readWrite@{DATABASE_NAME}")
    print("   ✓ Or Atlas Admin role (temporary)")
    print("")

    print("3. Cluster Status:")
    print("   ✓ Cluster is running (not paused)")
    print(f"   ✓ Cluster name: retsro-ai")
    print("   ✓ MongoDB version 4.4 or higher")
    print("")

    print("4. Connection Security:")
    print("   ✓ TLS/SSL enabled")
    print("   ✓ No specific certificate requirements")
    print("   ✓ Standard connection method selected")


async def main():
    """Main function"""

    import argparse

    parser = argparse.ArgumentParser(description="Update MongoDB Atlas Credentials")
    parser.add_argument("--test", action="store_true", help="Test connections only")
    parser.add_argument(
        "--update-env", action="store_true", help="Update environment files"
    )
    parser.add_argument("--update-server", action="store_true", help="Update server.py")
    parser.add_argument("--all", action="store_true", help="Run all operations")

    args = parser.parse_args()

    # Default behavior if no arguments
    if not any([args.test, args.update_env, args.update_server, args.all]):
        args.all = True

    log_header("🍽️  RestoBill AI - MongoDB Atlas Credential Update")

    print(f"New Cluster: {NEW_ATLAS_CLUSTER}")
    print(f"Username: {NEW_ATLAS_USERNAME}")
    print(f"Database: {DATABASE_NAME}")
    print(f"App Name: {NEW_APP_NAME}")

    successful_connections = []

    # Test connections
    if args.test or args.all:
        successful_connections = await test_all_connections()

        if successful_connections:
            log_success(
                f"Found {len(successful_connections)} working connection methods"
            )
        else:
            log_error("No successful connections found!")
            log_warning("Check MongoDB Atlas configuration")
            show_mongodb_atlas_checklist()
            return

    # Update environment files
    if (args.update_env or args.all) and successful_connections:
        success = create_environment_files(successful_connections)
        if not success:
            log_error("Failed to create environment files")
            return

    # Update server.py
    if (args.update_server or args.all) and successful_connections:
        success = update_server_py()
        if not success:
            log_warning("Server.py update failed - manual update may be needed")

    # Show deployment instructions
    if successful_connections:
        show_deployment_instructions(successful_connections)
        print()
        show_mongodb_atlas_checklist()

        print(
            f"\n{Colors.BOLD}{Colors.GREEN}🎉 MongoDB Atlas credentials updated successfully!{Colors.END}"
        )
        print(
            f"{Colors.BOLD}Next: Update Render environment variables and deploy{Colors.END}"
        )
    else:
        log_error("Update failed - no working connections found")
        print("\nTroubleshooting steps:")
        print("1. Verify MongoDB Atlas cluster is running")
        print("2. Check Network Access allows 0.0.0.0/0")
        print("3. Confirm database user credentials are correct")
        print("4. Ensure user has proper database permissions")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log_warning("Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        log_error(f"Unexpected error: {e}")
        sys.exit(1)
