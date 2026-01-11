"""
Super Admin Panel - Optimized with Split APIs
Split large data fetches into smaller, focused endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
import os

super_admin_router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])

# Super admin credentials
SUPER_ADMIN_USERNAME = os.getenv("SUPER_ADMIN_USERNAME", "superadmin")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "change-this-password-123")

# Database and cache references
_db = None
_redis_cache = None

def set_database(database):
    """Set the database reference from server.py"""
    global _db
    _db = database

def set_redis_cache(redis_cache):
    """Set the Redis cache reference from server.py"""
    global _redis_cache
    _redis_cache = redis_cache

def get_db():
    """Get the database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

def get_cache():
    """Get the Redis cache reference"""
    return _redis_cache

def verify_super_admin(username: str, password: str) -> bool:
    """Verify super admin credentials"""
    return username == SUPER_ADMIN_USERNAME and password == SUPER_ADMIN_PASSWORD

# ============ AUTHENTICATION ============

@super_admin_router.get("/login")
async def super_admin_login(
    username: str = Query(...),
    password: str = Query(...)
):
    """Super admin login verification"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    return {
        "success": True,
        "message": "Super admin authenticated",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============ BASIC STATS (FAST) ============

@super_admin_router.get("/stats/basic")
async def get_basic_stats(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get basic system stats - FAST endpoint"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print("📊 Fetching basic stats...")
        
        # Use count_documents for fast counts
        total_users = await db.users.count_documents({})
        total_orders = await db.orders.count_documents({})
        active_users = await db.users.count_documents({"subscription_active": True})
        
        # Recent activity (last 24 hours)
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_orders = await db.orders.count_documents({
            "created_at": {"$gte": yesterday}
        })
        
        stats = {
            "total_users": total_users,
            "total_orders": total_orders,
            "active_users": active_users,
            "recent_orders": recent_orders,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Basic stats: {total_users} users, {total_orders} orders")
        return stats
        
    except Exception as e:
        print(f"❌ Basic stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ USER LIST (PAGINATED) ============

@super_admin_router.get("/users/list")
async def get_users_list(
    username: str = Query(...),
    password: str = Query(...),
    skip: int = Query(0),
    limit: int = Query(10)  # Small limit for performance
):
    """Get users list - PAGINATED for performance"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    # Limit to 10 for free tier
    limit = min(limit, 10)
    
    try:
        print(f"📊 Fetching users list (skip={skip}, limit={limit})...")
        
        # Get users with minimal fields for list view
        users = await db.users.find(
            {},
            {
                "_id": 0,
                "email": 1,
                "username": 1,
                "role": 1,
                "subscription_active": 1,
                "created_at": 1,
                "bill_count": 1
            }
        ).skip(skip).limit(limit).to_list(limit)
        
        # Only get total count on first page (expensive operation)
        total = await db.users.count_documents({}) if skip == 0 else -1
        
        result = {
            "users": users,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": len(users) == limit,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Users list: {len(users)} users returned")
        return result
        
    except Exception as e:
        print(f"❌ Users list error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ SEARCH USERS (LIGHTWEIGHT) - MUST BE BEFORE /users/{user_email} ============

@super_admin_router.get("/users/search")
async def search_users(
    username: str = Query(...),
    password: str = Query(...),
    q: str = Query(...),
    limit: int = Query(5)
):
    """Search users by email/username - LIGHTWEIGHT"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    if not q.strip():
        return {"users": [], "query": q, "count": 0}
    
    db = get_db()
    limit = min(limit, 5)
    
    try:
        print(f"📊 Searching users: '{q}' (limit={limit})...")
        
        search_filter = {
            "$or": [
                {"email": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}}
            ]
        }
        
        users = await db.users.find(
            search_filter,
            {
                "_id": 0,
                "email": 1,
                "username": 1,
                "role": 1,
                "subscription_active": 1
            }
        ).limit(limit).to_list(limit)
        
        result = {
            "users": users,
            "query": q,
            "count": len(users),
            "limit": limit,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Search results: {len(users)} users found")
        return result
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# ============ USER DETAILS (INDIVIDUAL) ============

@super_admin_router.get("/users/{user_email}")
async def get_user_details(
    user_email: str,
    username: str = Query(...),
    password: str = Query(...)
):
    """Get detailed info for a specific user"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    
    try:
        print(f"📊 Fetching user details for: {user_email}")
        
        user = await db.users.find_one(
            {"email": user_email},
            {"_id": 0, "password": 0, "razorpay_key_secret": 0}
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's recent orders count
        user_orders = await db.orders.count_documents({
            "organization_id": user.get("organization_id")
        })
        
        user["total_orders"] = user_orders
        user["fetched_at"] = datetime.now(timezone.utc).isoformat()
        
        print(f"✅ User details fetched for: {user_email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ User details error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ RECENT ORDERS (LIMITED) ============

@super_admin_router.get("/orders/recent")
async def get_recent_orders(
    username: str = Query(...),
    password: str = Query(...),
    limit: int = Query(20)
):
    """Get recent orders across all users - LIMITED for performance"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    limit = min(limit, 20)
    
    try:
        print(f"📊 Fetching recent orders (limit={limit})...")
        
        orders = await db.orders.find(
            {},
            {
                "_id": 0,
                "id": 1,
                "total": 1,
                "status": 1,
                "created_at": 1,
                "organization_id": 1,
                "customer_name": 1,
                "waiter_name": 1
            }
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        result = {
            "orders": orders,
            "count": len(orders),
            "limit": limit,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ Recent orders: {len(orders)} orders returned")
        return result
        
    except Exception as e:
        print(f"❌ Recent orders error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ REVENUE STATS (AGGREGATED) ============

@super_admin_router.get("/stats/revenue")
async def get_revenue_stats(
    username: str = Query(...),
    password: str = Query(...),
    days: int = Query(7)
):
    """Get revenue statistics - AGGREGATED for performance"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    days = min(days, 30)
    
    try:
        print(f"📊 Fetching revenue stats (last {days} days)...")
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date},
                    "status": {"$in": ["completed", "paid"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$total"},
                    "total_orders": {"$sum": 1},
                    "avg_order_value": {"$avg": "$total"}
                }
            }
        ]
        
        result = await db.orders.aggregate(pipeline).to_list(1)
        
        if result:
            stats = result[0]
            stats.pop("_id", None)
        else:
            stats = {
                "total_revenue": 0,
                "total_orders": 0,
                "avg_order_value": 0
            }
        
        stats.update({
            "days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cached_at": datetime.now(timezone.utc).isoformat()
        })
        
        print(f"✅ Revenue stats: ₹{stats['total_revenue']:.2f} from {stats['total_orders']} orders")
        return stats
        
    except Exception as e:
        print(f"❌ Revenue stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ============ SYSTEM HEALTH ============

@super_admin_router.get("/health")
async def get_system_health(
    username: str = Query(...),
    password: str = Query(...)
):
    """Get system health status - FAST endpoint"""
    if not verify_super_admin(username, password):
        raise HTTPException(status_code=403, detail="Invalid super admin credentials")
    
    db = get_db()
    cache = get_cache()
    
    try:
        print("📊 Checking system health...")
        
        # Test database connection
        db_status = "connected"
        try:
            await db.users.count_documents({}, limit=1)
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        # Test Redis connection
        redis_status = "not_configured"
        if cache:
            if cache.is_connected():
                redis_status = "connected"
            else:
                redis_status = "disconnected"
        
        health = {
            "database": db_status,
            "redis": redis_status,
            "uptime": "running",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        print(f"✅ System health: DB={db_status}, Redis={redis_status}")
        return health
        
    except Exception as e:
        print(f"❌ Health check error: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")