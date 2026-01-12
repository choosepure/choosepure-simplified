from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import User, UserComplete, UserStats, ApiResponse
from typing import Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

async def get_db():
    from server import db
    return db

@router.get("/dashboard/{email}")
async def get_user_dashboard(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user dashboard data"""
    try:
        # Get user data
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's voting history
        user_votes = await db.voting_options.find(
            {"voters": email}
        ).to_list(length=100)
        
        # Calculate community impact (simplified)
        total_community_members = await db.users.count_documents({})
        tests_influenced = len([v for v in user_votes if v["status"] in ["funded", "testing", "completed"]])
        
        # Get recent community activity
        recent_activity = []
        
        # Recent test completions
        completed_tests = await db.sample_reports.find().sort("created_at", -1).limit(3).to_list(3)
        for test in completed_tests:
            recent_activity.append({
                "type": "test_completed",
                "message": f"New test result: {test['product_name']} ({test['purity_score']}/10)",
                "timestamp": test["created_at"]
            })
        
        # Recent voting activity
        active_votes = await db.voting_options.find({"status": "voting"}).sort("votes", -1).limit(2).to_list(2)
        for vote in active_votes:
            recent_activity.append({
                "type": "voting_update",
                "message": f"Trending vote: {vote['product_name']} ({vote['votes']} votes)",
                "timestamp": datetime.utcnow()
            })
        
        # Sort by timestamp
        recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Build dashboard data
        dashboard_data = {
            "user_info": {
                "email": user["email"],
                "name": user.get("name"),
                "member_since": user["created_at"],
                "last_active": user.get("last_active"),
                "onboarding_step": user.get("onboarding_step", 1)
            },
            "stats": {
                "votes_cast": len(user_votes),
                "tests_influenced": tests_influenced,
                "community_impact": total_community_members,  # Simplified metric
                "report_views_remaining": max(0, user.get("report_views_limit", 3) - user.get("report_views_used", 0)),
                "is_premium": user.get("is_premium", False)
            },
            "recent_votes": [
                {
                    "product_name": vote["product_name"],
                    "status": vote["status"],
                    "votes": vote["votes"],
                    "funding_progress": round((vote["funding_raised"] / vote["funding_target"]) * 100, 1)
                }
                for vote in user_votes[:5]
            ],
            "recent_activity": recent_activity[:5],
            "limits": {
                "report_views": {
                    "used": user.get("report_views_used", 0),
                    "limit": user.get("report_views_limit", 3),
                    "remaining": max(0, user.get("report_views_limit", 3) - user.get("report_views_used", 0))
                },
                "votes": {
                    "used": user.get("votes_cast", 0),
                    "limit": user.get("votes_limit", 5),
                    "remaining": max(0, user.get("votes_limit", 5) - user.get("votes_cast", 0))
                }
            },
            "upgrade_prompt": {
                "show": not user.get("is_premium", False) and (
                    user.get("report_views_used", 0) >= user.get("report_views_limit", 3) or
                    user.get("votes_cast", 0) >= user.get("votes_limit", 5)
                ),
                "reason": "free_limit_reached" if user.get("report_views_used", 0) >= user.get("report_views_limit", 3) else "vote_limit_reached"
            }
        }
        
        return ApiResponse(
            success=True,
            message="Dashboard data retrieved",
            data=dashboard_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")

@router.post("/complete-profile/{email}")
async def complete_user_profile(
    email: str,
    profile_data: UserComplete,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Complete user profile with additional information"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user profile
        update_data = {
            "name": profile_data.name,
            "last_active": datetime.utcnow(),
            "onboarding_step": max(user.get("onboarding_step", 1), 4)  # Profile completed
        }
        
        if profile_data.mobile:
            update_data["mobile"] = profile_data.mobile
        if profile_data.location:
            update_data["location"] = profile_data.location
        
        await db.users.update_one(
            {"email": email},
            {"$set": update_data}
        )
        
        # Track engagement
        await db.user_engagement.update_one(
            {"email": email},
            {
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "complete_profile",
                        "details": {
                            "name": profile_data.name,
                            "has_mobile": bool(profile_data.mobile),
                            "has_location": bool(profile_data.location)
                        }
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        logger.info(f"Profile completed for {email}")
        
        return ApiResponse(
            success=True,
            message="Profile completed successfully",
            data={
                "email": email,
                "name": profile_data.name,
                "profile_complete": True
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete profile")

@router.post("/track-report-view/{email}")
async def track_report_view(
    email: str,
    report_data: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Track when user views a report (for freemium limits)"""
    try:
        # Get user
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user has reached view limit
        views_used = user.get("report_views_used", 0)
        views_limit = user.get("report_views_limit", 3)
        is_premium = user.get("is_premium", False)
        
        if not is_premium and views_used >= views_limit:
            # Track that user hit the limit
            await db.user_engagement.update_one(
                {"email": email},
                {
                    "$set": {"hit_free_limit": True, "updated_at": datetime.utcnow()},
                    "$push": {
                        "actions": {
                            "timestamp": datetime.utcnow(),
                            "action": "hit_free_limit",
                            "details": {"limit_type": "report_views", "report_id": report_data.get("report_id")}
                        }
                    }
                },
                upsert=True
            )
            
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "view_limit_reached",
                    "message": "You've reached your free report view limit. Upgrade to premium for unlimited access.",
                    "views_used": views_used,
                    "views_limit": views_limit,
                    "upgrade_required": True
                }
            )
        
        # Increment view count for non-premium users
        if not is_premium:
            await db.users.update_one(
                {"email": email},
                {
                    "$inc": {"report_views_used": 1},
                    "$set": {"last_active": datetime.utcnow()}
                }
            )
            views_used += 1
        
        # Track the view
        await db.user_engagement.update_one(
            {"email": email},
            {
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "view_report",
                        "details": report_data
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        return ApiResponse(
            success=True,
            message="Report view tracked",
            data={
                "views_used": views_used,
                "views_remaining": max(0, views_limit - views_used) if not is_premium else "unlimited",
                "is_premium": is_premium,
                "show_upgrade_prompt": not is_premium and views_used >= views_limit - 1
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking report view: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track report view")

@router.get("/profile/{email}")
async def get_user_profile(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user profile information"""
    try:
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get engagement data
        engagement = await db.user_engagement.find_one({"email": email})
        
        profile_data = {
            "email": user["email"],
            "name": user.get("name"),
            "mobile": user.get("mobile"),
            "location": user.get("location"),
            "role": user.get("role", "member"),
            "member_since": user["created_at"],
            "last_active": user.get("last_active"),
            "is_premium": user.get("is_premium", False),
            "subscription_expires": user.get("subscription_expires"),
            "trial_used": user.get("trial_used", False),
            "onboarding_step": user.get("onboarding_step", 1),
            "profile_complete": bool(user.get("name")),
            "engagement_score": len(engagement.get("actions", [])) if engagement else 0
        }
        
        return ApiResponse(
            success=True,
            message="Profile retrieved",
            data=profile_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.get("/community-stats")
async def get_community_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get community statistics for display"""
    try:
        # Get basic counts
        total_members = await db.users.count_documents({})
        total_votes = await db.voting_options.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$votes"}}}
        ]).to_list(1)
        total_votes = total_votes[0]["total"] if total_votes else 0
        
        completed_tests = await db.sample_reports.count_documents({})
        active_voting = await db.voting_options.count_documents({"status": "voting"})
        
        # Get recent activity for community feed
        recent_reports = await db.sample_reports.find().sort("created_at", -1).limit(3).to_list(3)
        recent_activity = [
            {
                "type": "test_completed",
                "message": f"New test: {report['product_name']} scored {report['purity_score']}/10",
                "timestamp": report["created_at"]
            }
            for report in recent_reports
        ]
        
        return ApiResponse(
            success=True,
            message="Community statistics retrieved",
            data={
                "total_members": total_members,
                "total_votes_cast": total_votes,
                "completed_tests": completed_tests,
                "active_voting_options": active_voting,
                "recent_activity": recent_activity
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting community stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get community statistics")