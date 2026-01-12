from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import SubscriptionTier, ApiResponse
from typing import Dict, Any
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

async def get_db():
    from server import db
    return db

@router.get("/tiers")
async def get_subscription_tiers(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get available subscription tiers"""
    try:
        # Define subscription tiers (could be stored in DB)
        tiers = [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "duration_days": 30,
                "features": [
                    "3 test report views per month",
                    "5 votes per month",
                    "1 forum post per month",
                    "Basic community access"
                ],
                "is_trial": False,
                "popular": False,
                "limitations": {
                    "report_views": 3,
                    "votes": 5,
                    "forum_posts": 1
                }
            },
            {
                "id": "premium",
                "name": "Premium",
                "price": 99,
                "duration_days": 30,
                "features": [
                    "Unlimited test report access",
                    "Detailed lab parameters",
                    "Unlimited voting",
                    "Priority voting on new tests",
                    "Unlimited forum participation",
                    "Expert Q&A sessions",
                    "Early access to new features"
                ],
                "is_trial": False,
                "popular": True,
                "trial_available": True,
                "trial_days": 7
            },
            {
                "id": "premium_trial",
                "name": "Premium Trial",
                "price": 0,
                "duration_days": 7,
                "features": [
                    "All Premium features",
                    "7-day free trial",
                    "Cancel anytime"
                ],
                "is_trial": True,
                "popular": False
            }
        ]
        
        return ApiResponse(
            success=True,
            message="Subscription tiers retrieved",
            data={"tiers": tiers}
        )
        
    except Exception as e:
        logger.error(f"Error getting subscription tiers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get subscription tiers")

@router.post("/start-trial")
async def start_premium_trial(
    trial_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Start premium trial for user"""
    try:
        email = trial_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Get user
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if trial already used
        if user.get("trial_used", False):
            raise HTTPException(status_code=400, detail="Trial already used")
        
        # Check if already premium
        if user.get("is_premium", False):
            raise HTTPException(status_code=400, detail="User is already premium")
        
        # Start trial
        trial_end = datetime.utcnow() + timedelta(days=7)
        
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "is_premium": True,
                    "subscription_expires": trial_end,
                    "trial_used": True,
                    "last_active": datetime.utcnow(),
                    # Reset limits for trial
                    "report_views_used": 0,
                    "votes_cast": 0,
                    "forum_posts": 0
                }
            }
        )
        
        # Track engagement
        await db.user_engagement.update_one(
            {"email": email},
            {
                "$set": {"started_trial": True, "updated_at": datetime.utcnow()},
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "start_trial",
                        "details": {"trial_end": trial_end}
                    }
                }
            },
            upsert=True
        )
        
        logger.info(f"Premium trial started for {email}")
        
        return ApiResponse(
            success=True,
            message="Premium trial started successfully!",
            data={
                "email": email,
                "trial_end": trial_end,
                "days_remaining": 7,
                "features_unlocked": [
                    "Unlimited report access",
                    "Detailed lab parameters",
                    "Unlimited voting",
                    "Priority voting"
                ]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting trial: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start trial")

@router.get("/status/{email}")
async def get_subscription_status(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user's subscription status"""
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        is_premium = user.get("is_premium", False)
        subscription_expires = user.get("subscription_expires")
        trial_used = user.get("trial_used", False)
        
        # Check if subscription expired
        if is_premium and subscription_expires and subscription_expires < datetime.utcnow():
            # Expire the subscription
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "is_premium": False,
                        "subscription_expires": None
                    }
                }
            )
            is_premium = False
            subscription_expires = None
        
        # Calculate days remaining
        days_remaining = 0
        if is_premium and subscription_expires:
            days_remaining = max(0, (subscription_expires - datetime.utcnow()).days)
        
        # Get current usage
        usage_stats = {
            "report_views": {
                "used": user.get("report_views_used", 0),
                "limit": "unlimited" if is_premium else user.get("report_views_limit", 3)
            },
            "votes": {
                "used": user.get("votes_cast", 0),
                "limit": "unlimited" if is_premium else user.get("votes_limit", 5)
            },
            "forum_posts": {
                "used": user.get("forum_posts", 0),
                "limit": "unlimited" if is_premium else user.get("forum_posts_limit", 1)
            }
        }
        
        status_data = {
            "email": email,
            "is_premium": is_premium,
            "subscription_expires": subscription_expires,
            "days_remaining": days_remaining,
            "trial_used": trial_used,
            "trial_available": not trial_used and not is_premium,
            "usage_stats": usage_stats,
            "upgrade_recommended": not is_premium and (
                user.get("report_views_used", 0) >= user.get("report_views_limit", 3) * 0.8 or
                user.get("votes_cast", 0) >= user.get("votes_limit", 5) * 0.8
            )
        }
        
        return ApiResponse(
            success=True,
            message="Subscription status retrieved",
            data=status_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")

@router.post("/create-payment-order")
async def create_payment_order(
    order_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create Razorpay order for subscription payment"""
    try:
        email = order_data.get("email")
        tier_id = order_data.get("tier_id")
        
        if not email or not tier_id:
            raise HTTPException(status_code=400, detail="Email and tier_id are required")
        
        # Get user
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get tier details (simplified - in real app, get from DB)
        tier_prices = {
            "premium": 99,
            "premium_annual": 999
        }
        
        if tier_id not in tier_prices:
            raise HTTPException(status_code=400, detail="Invalid tier")
        
        amount = tier_prices[tier_id]
        
        # Here you would integrate with Razorpay
        # For now, return mock order data
        order_id = f"order_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{email.split('@')[0]}"
        
        # Store pending order
        pending_order = {
            "order_id": order_id,
            "email": email,
            "tier_id": tier_id,
            "amount": amount,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        await db.pending_orders.insert_one(pending_order)
        
        return ApiResponse(
            success=True,
            message="Payment order created",
            data={
                "order_id": order_id,
                "amount": amount,
                "currency": "INR",
                "tier_id": tier_id,
                "razorpay_key": "rzp_test_key"  # Replace with actual key
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@router.post("/verify-payment")
async def verify_payment(
    payment_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify payment and activate subscription"""
    try:
        order_id = payment_data.get("order_id")
        payment_id = payment_data.get("payment_id")
        signature = payment_data.get("signature")
        
        if not all([order_id, payment_id, signature]):
            raise HTTPException(status_code=400, detail="Missing payment verification data")
        
        # Get pending order
        pending_order = await db.pending_orders.find_one({"order_id": order_id})
        if not pending_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Here you would verify the Razorpay signature
        # For now, assume verification is successful
        
        email = pending_order["email"]
        tier_id = pending_order["tier_id"]
        
        # Activate subscription
        subscription_end = datetime.utcnow() + timedelta(days=30)  # 1 month
        
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "is_premium": True,
                    "subscription_expires": subscription_end,
                    "last_active": datetime.utcnow(),
                    # Reset usage limits
                    "report_views_used": 0,
                    "votes_cast": 0,
                    "forum_posts": 0
                }
            }
        )
        
        # Update order status
        await db.pending_orders.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "status": "completed",
                    "payment_id": payment_id,
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        # Track conversion
        await db.user_engagement.update_one(
            {"email": email},
            {
                "$set": {"converted_to_paid": True, "updated_at": datetime.utcnow()},
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "convert_to_paid",
                        "details": {
                            "tier_id": tier_id,
                            "amount": pending_order["amount"],
                            "payment_id": payment_id
                        }
                    }
                }
            },
            upsert=True
        )
        
        logger.info(f"Subscription activated for {email}")
        
        return ApiResponse(
            success=True,
            message="Payment verified and subscription activated!",
            data={
                "email": email,
                "tier_id": tier_id,
                "subscription_expires": subscription_end,
                "features_unlocked": [
                    "Unlimited report access",
                    "Detailed lab parameters",
                    "Unlimited voting",
                    "Priority voting",
                    "Expert Q&A sessions"
                ]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")

@router.get("/upgrade-prompts/{email}")
async def get_upgrade_prompts(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get personalized upgrade prompts based on user behavior"""
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("is_premium", False):
            return ApiResponse(
                success=True,
                message="User is already premium",
                data={"prompts": []}
            )
        
        prompts = []
        
        # Check usage patterns
        report_views_used = user.get("report_views_used", 0)
        report_views_limit = user.get("report_views_limit", 3)
        votes_cast = user.get("votes_cast", 0)
        votes_limit = user.get("votes_limit", 5)
        
        # Report view limit prompt
        if report_views_used >= report_views_limit:
            prompts.append({
                "type": "limit_reached",
                "title": "Unlock Unlimited Report Access",
                "message": "You've used all your free report views. Upgrade to see detailed lab results for all products.",
                "cta": "Start 7-Day Free Trial",
                "urgency": "high"
            })
        elif report_views_used >= report_views_limit * 0.8:
            prompts.append({
                "type": "limit_warning",
                "title": "Almost Out of Free Views",
                "message": f"You have {report_views_limit - report_views_used} report views left. Upgrade for unlimited access.",
                "cta": "Upgrade Now",
                "urgency": "medium"
            })
        
        # Voting limit prompt
        if votes_cast >= votes_limit:
            prompts.append({
                "type": "voting_limit",
                "title": "Vote for More Products",
                "message": "You've reached your voting limit. Premium members get unlimited votes and priority influence.",
                "cta": "Upgrade to Premium",
                "urgency": "medium"
            })
        
        # Engagement-based prompts
        engagement = await db.user_engagement.find_one({"email": email})
        if engagement and len(engagement.get("actions", [])) >= 10:
            prompts.append({
                "type": "engagement_reward",
                "title": "You're an Active Member!",
                "message": "As a valued community member, get 50% off your first month of Premium.",
                "cta": "Claim Discount",
                "urgency": "low",
                "discount": 50
            })
        
        # Trial availability
        if not user.get("trial_used", False):
            prompts.append({
                "type": "trial_offer",
                "title": "Try Premium Free for 7 Days",
                "message": "Experience unlimited access to all features. Cancel anytime.",
                "cta": "Start Free Trial",
                "urgency": "low"
            })
        
        return ApiResponse(
            success=True,
            message="Upgrade prompts retrieved",
            data={
                "prompts": prompts,
                "user_stats": {
                    "report_views_used": report_views_used,
                    "report_views_limit": report_views_limit,
                    "votes_cast": votes_cast,
                    "votes_limit": votes_limit,
                    "trial_available": not user.get("trial_used", False)
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting upgrade prompts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get upgrade prompts")