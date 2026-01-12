from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import UserEngagement, ApiResponse
from typing import Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

async def get_db():
    from server import db
    return db

@router.post("/track-action")
async def track_user_action(
    action_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Track user actions for onboarding funnel analysis"""
    try:
        email = action_data.get("email")
        action = action_data.get("action")
        details = action_data.get("details", {})
        
        if not email or not action:
            raise HTTPException(status_code=400, detail="Email and action are required")
        
        # Find or create user engagement record
        engagement = await db.user_engagement.find_one({"email": email})
        
        if not engagement:
            engagement = {
                "email": email,
                "page_views": {},
                "actions": [],
                "viewed_samples": False,
                "understood_process": False,
                "cast_first_vote": False,
                "explored_dashboard": False,
                "hit_free_limit": False,
                "started_trial": False,
                "converted_to_paid": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        # Update engagement based on action
        engagement["actions"].append({
            "timestamp": datetime.utcnow(),
            "action": action,
            "details": details
        })
        
        # Update funnel flags
        if action == "view_sample_reports":
            engagement["viewed_samples"] = True
        elif action == "view_how_it_works":
            engagement["understood_process"] = True
        elif action == "cast_vote":
            engagement["cast_first_vote"] = True
        elif action == "view_dashboard":
            engagement["explored_dashboard"] = True
        elif action == "hit_free_limit":
            engagement["hit_free_limit"] = True
        elif action == "start_trial":
            engagement["started_trial"] = True
        elif action == "convert_to_paid":
            engagement["converted_to_paid"] = True
        
        # Track page views
        page = details.get("page")
        if page:
            if page not in engagement["page_views"]:
                engagement["page_views"][page] = 0
            engagement["page_views"][page] += 1
        
        engagement["updated_at"] = datetime.utcnow()
        
        # Upsert engagement record
        await db.user_engagement.update_one(
            {"email": email},
            {"$set": engagement},
            upsert=True
        )
        
        logger.info(f"Tracked action '{action}' for user {email}")
        
        return ApiResponse(
            success=True,
            message="Action tracked successfully",
            data={"action": action, "email": email}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking user action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track action")

@router.get("/funnel-stats")
async def get_funnel_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get onboarding funnel statistics"""
    try:
        # Aggregate funnel data
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_users": {"$sum": 1},
                    "viewed_samples": {"$sum": {"$cond": ["$viewed_samples", 1, 0]}},
                    "understood_process": {"$sum": {"$cond": ["$understood_process", 1, 0]}},
                    "cast_first_vote": {"$sum": {"$cond": ["$cast_first_vote", 1, 0]}},
                    "explored_dashboard": {"$sum": {"$cond": ["$explored_dashboard", 1, 0]}},
                    "hit_free_limit": {"$sum": {"$cond": ["$hit_free_limit", 1, 0]}},
                    "started_trial": {"$sum": {"$cond": ["$started_trial", 1, 0]}},
                    "converted_to_paid": {"$sum": {"$cond": ["$converted_to_paid", 1, 0]}}
                }
            }
        ]
        
        result = await db.user_engagement.aggregate(pipeline).to_list(1)
        
        if result:
            stats = result[0]
            total = stats["total_users"]
            
            # Calculate conversion rates
            funnel_stats = {
                "total_users": total,
                "conversion_rates": {
                    "landing_to_samples": (stats["viewed_samples"] / total * 100) if total > 0 else 0,
                    "samples_to_process": (stats["understood_process"] / stats["viewed_samples"] * 100) if stats["viewed_samples"] > 0 else 0,
                    "process_to_vote": (stats["cast_first_vote"] / stats["understood_process"] * 100) if stats["understood_process"] > 0 else 0,
                    "vote_to_dashboard": (stats["explored_dashboard"] / stats["cast_first_vote"] * 100) if stats["cast_first_vote"] > 0 else 0,
                    "limit_to_trial": (stats["started_trial"] / stats["hit_free_limit"] * 100) if stats["hit_free_limit"] > 0 else 0,
                    "trial_to_paid": (stats["converted_to_paid"] / stats["started_trial"] * 100) if stats["started_trial"] > 0 else 0
                },
                "absolute_numbers": {
                    "viewed_samples": stats["viewed_samples"],
                    "understood_process": stats["understood_process"],
                    "cast_first_vote": stats["cast_first_vote"],
                    "explored_dashboard": stats["explored_dashboard"],
                    "hit_free_limit": stats["hit_free_limit"],
                    "started_trial": stats["started_trial"],
                    "converted_to_paid": stats["converted_to_paid"]
                }
            }
        else:
            funnel_stats = {
                "total_users": 0,
                "conversion_rates": {},
                "absolute_numbers": {}
            }
        
        return ApiResponse(
            success=True,
            message="Funnel statistics retrieved",
            data=funnel_stats
        )
        
    except Exception as e:
        logger.error(f"Error getting funnel stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get funnel statistics")

@router.get("/user-journey/{email}")
async def get_user_journey(email: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get specific user's onboarding journey"""
    try:
        engagement = await db.user_engagement.find_one({"email": email})
        
        if not engagement:
            raise HTTPException(status_code=404, detail="User journey not found")
        
        # Calculate journey progress
        journey_steps = [
            {"step": "viewed_samples", "completed": engagement.get("viewed_samples", False)},
            {"step": "understood_process", "completed": engagement.get("understood_process", False)},
            {"step": "cast_first_vote", "completed": engagement.get("cast_first_vote", False)},
            {"step": "explored_dashboard", "completed": engagement.get("explored_dashboard", False)},
            {"step": "hit_free_limit", "completed": engagement.get("hit_free_limit", False)},
            {"step": "started_trial", "completed": engagement.get("started_trial", False)},
            {"step": "converted_to_paid", "completed": engagement.get("converted_to_paid", False)}
        ]
        
        completed_steps = sum(1 for step in journey_steps if step["completed"])
        progress_percentage = (completed_steps / len(journey_steps)) * 100
        
        return ApiResponse(
            success=True,
            message="User journey retrieved",
            data={
                "email": email,
                "journey_steps": journey_steps,
                "progress_percentage": progress_percentage,
                "completed_steps": completed_steps,
                "total_steps": len(journey_steps),
                "page_views": engagement.get("page_views", {}),
                "total_actions": len(engagement.get("actions", [])),
                "created_at": engagement.get("created_at"),
                "last_activity": engagement.get("updated_at")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user journey: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user journey")

@router.post("/complete-onboarding")
async def complete_onboarding(
    completion_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Mark user onboarding as complete"""
    try:
        email = completion_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Update user record
        await db.users.update_one(
            {"email": email},
            {"$set": {"onboarding_step": 999, "last_active": datetime.utcnow()}},
            upsert=True
        )
        
        # Track completion action
        await db.user_engagement.update_one(
            {"email": email},
            {
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "complete_onboarding",
                        "details": completion_data
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return ApiResponse(
            success=True,
            message="Onboarding completed successfully",
            data={"email": email}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")