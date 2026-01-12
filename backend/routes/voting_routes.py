from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import VotingOption, CastVote, QuickSignup, User, ApiResponse
from typing import List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voting", tags=["Voting"])

async def get_db():
    from server import db
    return db

@router.get("/options")
async def get_voting_options(
    status: str = "voting",
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current voting options (no authentication required)"""
    try:
        # Get voting options
        cursor = db.voting_options.find({"status": status}).sort("votes", -1)
        options = await cursor.to_list(length=10)
        
        # Convert ObjectId to string and format for display
        voting_options = []
        for option in options:
            voting_options.append({
                "id": str(option["_id"]),
                "product_name": option["product_name"],
                "category": option["category"],
                "description": option["description"],
                "votes": option["votes"],
                "funding_raised": option["funding_raised"],
                "funding_target": option["funding_target"],
                "funding_percentage": round((option["funding_raised"] / option["funding_target"]) * 100, 1),
                "estimated_test_date": option.get("estimated_test_date"),
                "status": option["status"]
            })
        
        return ApiResponse(
            success=True,
            message=f"Retrieved {len(voting_options)} voting options",
            data={
                "voting_options": voting_options,
                "total": len(voting_options)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting voting options: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voting options")

@router.post("/cast-vote")
async def cast_vote(
    vote_data: CastVote,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cast a vote with email-only registration"""
    try:
        from bson import ObjectId
        
        # Validate voting option exists
        voting_option = await db.voting_options.find_one({"_id": ObjectId(vote_data.voting_option_id)})
        if not voting_option:
            raise HTTPException(status_code=404, detail="Voting option not found")
        
        # Check if user already voted for this option
        if vote_data.email in voting_option.get("voters", []):
            raise HTTPException(status_code=400, detail="You have already voted for this option")
        
        # Create or update user record (email-only initially)
        user = await db.users.find_one({"email": vote_data.email})
        if not user:
            # Create new user with minimal data
            new_user = {
                "email": vote_data.email,
                "role": "member",
                "report_views_used": 0,
                "report_views_limit": 3,
                "votes_cast": 0,
                "votes_limit": 5,
                "forum_posts": 0,
                "forum_posts_limit": 1,
                "is_premium": False,
                "trial_used": False,
                "first_vote_date": datetime.utcnow(),
                "last_active": datetime.utcnow(),
                "onboarding_step": 3,  # Completed voting step
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(new_user)
            user_id = str(result.inserted_id)
            
            # Send welcome email (implement email service)
            # await send_welcome_email(vote_data.email)
            
        else:
            user_id = str(user["_id"])
            
            # Update existing user
            await db.users.update_one(
                {"email": vote_data.email},
                {
                    "$set": {
                        "last_active": datetime.utcnow(),
                        "onboarding_step": max(user.get("onboarding_step", 1), 3)
                    },
                    "$inc": {"votes_cast": 1}
                }
            )
        
        # Check vote limits for non-premium users
        current_user = await db.users.find_one({"email": vote_data.email})
        if not current_user.get("is_premium", False):
            if current_user.get("votes_cast", 0) >= current_user.get("votes_limit", 5):
                raise HTTPException(
                    status_code=403, 
                    detail="Vote limit reached. Upgrade to premium for unlimited voting."
                )
        
        # Update voting option
        await db.voting_options.update_one(
            {"_id": ObjectId(vote_data.voting_option_id)},
            {
                "$inc": {"votes": 1},
                "$addToSet": {"voters": vote_data.email}
            }
        )
        
        # Track engagement
        await db.user_engagement.update_one(
            {"email": vote_data.email},
            {
                "$set": {
                    "cast_first_vote": True,
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "cast_vote",
                        "details": {
                            "voting_option_id": vote_data.voting_option_id,
                            "product_name": voting_option["product_name"]
                        }
                    }
                }
            },
            upsert=True
        )
        
        # Get updated voting option
        updated_option = await db.voting_options.find_one({"_id": ObjectId(vote_data.voting_option_id)})
        
        logger.info(f"Vote cast by {vote_data.email} for {voting_option['product_name']}")
        
        return ApiResponse(
            success=True,
            message="Vote cast successfully! Welcome to ChoosePure community.",
            data={
                "user_id": user_id,
                "email": vote_data.email,
                "product_voted": voting_option["product_name"],
                "total_votes": updated_option["votes"],
                "is_new_user": user is None,
                "votes_remaining": max(0, current_user.get("votes_limit", 5) - current_user.get("votes_cast", 0) - 1)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error casting vote: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cast vote")

@router.get("/user-votes/{email}")
async def get_user_votes(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get voting history for a user"""
    try:
        # Find all voting options where user has voted
        user_votes = await db.voting_options.find(
            {"voters": email}
        ).to_list(length=100)
        
        # Format response
        votes_history = []
        for option in user_votes:
            votes_history.append({
                "id": str(option["_id"]),
                "product_name": option["product_name"],
                "category": option["category"],
                "current_votes": option["votes"],
                "funding_progress": round((option["funding_raised"] / option["funding_target"]) * 100, 1),
                "status": option["status"],
                "estimated_test_date": option.get("estimated_test_date")
            })
        
        # Get user stats
        user = await db.users.find_one({"email": email})
        user_stats = {
            "total_votes_cast": len(votes_history),
            "votes_remaining": max(0, user.get("votes_limit", 5) - user.get("votes_cast", 0)) if user else 5,
            "is_premium": user.get("is_premium", False) if user else False
        }
        
        return ApiResponse(
            success=True,
            message="User votes retrieved",
            data={
                "votes_history": votes_history,
                "user_stats": user_stats
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting user votes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user votes")

@router.get("/stats")
async def get_voting_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get voting statistics"""
    try:
        # Get total votes across all options
        pipeline = [
            {"$group": {"_id": None, "total_votes": {"$sum": "$votes"}}}
        ]
        vote_result = await db.voting_options.aggregate(pipeline).to_list(1)
        total_votes = vote_result[0]["total_votes"] if vote_result else 0
        
        # Get total funding
        funding_pipeline = [
            {"$group": {"_id": None, "total_funding": {"$sum": "$funding_raised"}}}
        ]
        funding_result = await db.voting_options.aggregate(funding_pipeline).to_list(1)
        total_funding = funding_result[0]["total_funding"] if funding_result else 0
        
        # Get active voting options count
        active_options = await db.voting_options.count_documents({"status": "voting"})
        
        # Get unique voters count
        all_voters = []
        async for option in db.voting_options.find({}):
            all_voters.extend(option.get("voters", []))
        unique_voters = len(set(all_voters))
        
        return ApiResponse(
            success=True,
            message="Voting statistics retrieved",
            data={
                "total_votes": total_votes,
                "total_funding_raised": total_funding,
                "active_voting_options": active_options,
                "unique_voters": unique_voters,
                "average_votes_per_option": round(total_votes / active_options, 1) if active_options > 0 else 0
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting voting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voting statistics")

@router.post("/quick-signup")
async def quick_signup_for_voting(
    signup_data: QuickSignup,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Quick email-only signup for voting (alternative endpoint)"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": signup_data.email})
        if existing_user:
            return ApiResponse(
                success=True,
                message="Welcome back! You can now vote.",
                data={
                    "user_id": str(existing_user["_id"]),
                    "email": signup_data.email,
                    "is_existing_user": True
                }
            )
        
        # Create new user
        new_user = {
            "email": signup_data.email,
            "role": "member",
            "report_views_used": 0,
            "report_views_limit": 3,
            "votes_cast": 0,
            "votes_limit": 5,
            "forum_posts": 0,
            "forum_posts_limit": 1,
            "is_premium": False,
            "trial_used": False,
            "last_active": datetime.utcnow(),
            "onboarding_step": 2,  # Ready to vote
            "created_at": datetime.utcnow()
        }
        
        result = await db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Track engagement
        await db.user_engagement.update_one(
            {"email": signup_data.email},
            {
                "$set": {
                    "understood_process": True,
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "actions": {
                        "timestamp": datetime.utcnow(),
                        "action": "quick_signup",
                        "details": {"purpose": "voting"}
                    }
                }
            },
            upsert=True
        )
        
        logger.info(f"Quick signup completed for {signup_data.email}")
        
        return ApiResponse(
            success=True,
            message="Welcome to ChoosePure! You can now vote for products to be tested.",
            data={
                "user_id": user_id,
                "email": signup_data.email,
                "is_existing_user": False,
                "votes_available": 5
            }
        )
        
    except Exception as e:
        logger.error(f"Error in quick signup: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete signup")