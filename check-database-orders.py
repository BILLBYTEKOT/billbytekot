#!/usr/bin/env python3
"""
Direct database check for orders and create test data if needed
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = "mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai"
DB_NAME = "restrobill"

async def check_database():
    """Check database for existing orders and users"""
    print("🔍 Checking MongoDB database...")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Check collections
        collections = await db.list_collection_names()
        print(f"   Collections: {collections}")
        
        # Check users
        users_count = await db.users.count_documents({})
        print(f"   Users: {users_count}")
        
        if users_count > 0:
            # Get first user for testing
            user = await db.users.find_one({}, {"_id": 0, "password": 0})
            if user:
                print(f"   Sample user: {user.get('email', 'Unknown')} (org: {user.get('organization_id', 'None')})")
                org_id = user.get('organization_id')
        else:
            print("   No users found")
            org_id = None
        
        # Check orders
        orders_count = await db.orders.count_documents({})
        print(f"   Total orders: {orders_count}")
        
        if orders_count > 0:
            # Get recent orders
            recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
            print(f"   Recent orders:")
            for order in recent_orders:
                print(f"     - {order.get('id', 'Unknown')}: ${order.get('total', 0)} ({order.get('status', 'Unknown')}) - {order.get('created_at', 'Unknown')}")
        
        # Check active orders
        active_orders_count = await db.orders.count_documents({"status": {"$nin": ["completed", "cancelled"]}})
        print(f"   Active orders: {active_orders_count}")
        
        # Check today's orders
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders_count = await db.orders.count_documents({"created_at": {"$gte": today}})
        print(f"   Today's orders: {today_orders_count}")
        
        # Check tables
        tables_count = await db.tables.count_documents({})
        print(f"   Tables: {tables_count}")
        
        # Check menu items
        menu_count = await db.menu_items.count_documents({})
        print(f"   Menu items: {menu_count}")
        
        # Create test data if needed
        if org_id and orders_count == 0:
            print("\n📝 Creating test data...")
            await create_test_data(db, org_id)
        
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

async def create_test_data(db, org_id):
    """Create test orders and tables"""
    try:
        # Create test tables if none exist
        tables_count = await db.tables.count_documents({"organization_id": org_id})
        if tables_count == 0:
            print("   Creating test tables...")
            test_tables = []
            for i in range(1, 6):  # Create 5 tables
                table = {
                    "id": str(uuid.uuid4()),
                    "organization_id": org_id,
                    "table_number": i,
                    "capacity": 4,
                    "status": "available",
                    "created_at": datetime.now()
                }
                test_tables.append(table)
            
            await db.tables.insert_many(test_tables)
            print(f"   ✅ Created {len(test_tables)} test tables")
        
        # Create test menu items if none exist
        menu_count = await db.menu_items.count_documents({"organization_id": org_id})
        if menu_count == 0:
            print("   Creating test menu items...")
            test_menu = [
                {
                    "id": str(uuid.uuid4()),
                    "organization_id": org_id,
                    "name": "Classic Burger",
                    "price": 12.99,
                    "category": "Main Course",
                    "description": "Juicy beef patty with lettuce, tomato, and cheese",
                    "available": True,
                    "created_at": datetime.now()
                },
                {
                    "id": str(uuid.uuid4()),
                    "organization_id": org_id,
                    "name": "French Fries",
                    "price": 4.99,
                    "category": "Sides",
                    "description": "Crispy golden fries",
                    "available": True,
                    "created_at": datetime.now()
                },
                {
                    "id": str(uuid.uuid4()),
                    "organization_id": org_id,
                    "name": "Coca Cola",
                    "price": 2.99,
                    "category": "Beverages",
                    "description": "Refreshing cola drink",
                    "available": True,
                    "created_at": datetime.now()
                }
            ]
            
            await db.menu_items.insert_many(test_menu)
            print(f"   ✅ Created {len(test_menu)} test menu items")
        
        # Create test orders
        print("   Creating test orders...")
        test_orders = []
        
        # Get a table ID
        table = await db.tables.find_one({"organization_id": org_id})
        table_id = table.get("id") if table else None
        table_number = table.get("table_number", 1) if table else 1
        
        # Create orders for different days
        for days_ago in range(3):  # Last 3 days
            order_date = datetime.now() - timedelta(days=days_ago)
            
            # Create 2-3 orders per day
            for order_num in range(2 + days_ago):
                order_id = str(uuid.uuid4())
                
                # Vary order status
                if days_ago == 0:  # Today - mix of active and completed
                    status = "pending" if order_num == 0 else "completed"
                elif days_ago == 1:  # Yesterday - mostly completed
                    status = "completed"
                else:  # Older - all completed
                    status = "completed"
                
                order = {
                    "id": order_id,
                    "organization_id": org_id,
                    "table_id": table_id,
                    "table_number": table_number,
                    "customer_name": f"Test Customer {order_num + 1}",
                    "customer_phone": f"+123456789{order_num}",
                    "items": [
                        {
                            "id": str(uuid.uuid4()),
                            "name": "Classic Burger",
                            "price": 12.99,
                            "quantity": 1,
                            "category": "Main Course"
                        },
                        {
                            "id": str(uuid.uuid4()),
                            "name": "French Fries",
                            "price": 4.99,
                            "quantity": 1,
                            "category": "Sides"
                        }
                    ],
                    "subtotal": 17.98,
                    "tax": 0.90,
                    "total": 18.88,
                    "status": status,
                    "payment_method": "cash",
                    "payment_received": 20.00 if status == "completed" else 0,
                    "balance_amount": 1.12 if status == "completed" else 18.88,
                    "is_credit": False,
                    "notes": f"Test order {order_num + 1} from {days_ago} days ago",
                    "created_at": order_date,
                    "updated_at": order_date
                }
                
                test_orders.append(order)
        
        if test_orders:
            await db.orders.insert_many(test_orders)
            print(f"   ✅ Created {len(test_orders)} test orders")
            
            # Show summary
            active_count = len([o for o in test_orders if o["status"] not in ["completed", "cancelled"]])
            completed_count = len([o for o in test_orders if o["status"] in ["completed", "cancelled"]])
            today_count = len([o for o in test_orders if o["created_at"].date() == datetime.now().date()])
            
            print(f"   Summary: {active_count} active, {completed_count} completed, {today_count} today")
        
    except Exception as e:
        print(f"❌ Test data creation error: {e}")

async def main():
    """Main function"""
    print("🚀 Database Check and Test Data Creation")
    print("=" * 50)
    
    success = await check_database()
    
    if success:
        print("\n✅ Database check completed successfully")
    else:
        print("\n❌ Database check failed")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)