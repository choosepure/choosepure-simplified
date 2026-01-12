from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Simplified User Models
class QuickSignup(BaseModel):
    """Email-only signup for voting"""
    email: EmailStr

class UserComplete(BaseModel):
    """Complete user profile (optional)"""
    name: str
    mobile: Optional[str] = None
    location: Optional[str] = None

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    name: Optional[str] = None
    mobile: Optional[str] = None
    location: Optional[str] = None
    role: str = "member"
    
    # Freemium tracking
    report_views_used: int = 0
    report_views_limit: int = 3
    votes_cast: int = 0
    votes_limit: int = 5
    forum_posts: int = 0
    forum_posts_limit: int = 1
    
    # Subscription
    is_premium: bool = False
    subscription_expires: Optional[datetime] = None
    trial_used: bool = False
    
    # Engagement tracking
    first_vote_date: Optional[datetime] = None
    last_active: Optional[datetime] = None
    onboarding_step: int = 1  # Track onboarding progress
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Sample Report Models (No paywall initially)
class SampleReport(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    product_name: str
    brand: str
    category: str
    purity_score: float = Field(..., ge=0, le=10)
    test_date: str
    tested_by: str
    image: str
    
    # Simplified parameters for sample view
    key_findings: List[str]  # 3-4 key points
    safety_status: str  # "Safe", "Caution", "Avoid"
    
    # Full details (premium only)
    detailed_parameters: Optional[List[Dict[str, Any]]] = None
    lab_report_url: Optional[str] = None
    
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Simplified Voting Models
class VotingOption(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    product_name: str
    category: str
    description: str
    votes: int = 0
    funding_raised: float = 0
    funding_target: float
    estimated_test_date: Optional[str] = None
    status: str = "voting"  # voting, funded, testing, completed
    
    # Voter tracking (email-based)
    voters: List[str] = []  # List of email addresses
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CastVote(BaseModel):
    """Vote casting model"""
    email: EmailStr
    voting_option_id: str
    
# User Engagement Models
class UserEngagement(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    
    # Engagement tracking
    page_views: Dict[str, int] = {}  # page -> count
    actions: List[Dict[str, Any]] = []  # timestamp, action, details
    
    # Conversion funnel
    viewed_samples: bool = False
    understood_process: bool = False
    cast_first_vote: bool = False
    explored_dashboard: bool = False
    hit_free_limit: bool = False
    started_trial: bool = False
    converted_to_paid: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Subscription Models
class SubscriptionTier(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    price: float
    duration_days: int
    features: List[str]
    is_trial: bool = False
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# API Response Models
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class UserStats(BaseModel):
    """User dashboard stats"""
    votes_cast: int
    tests_influenced: int
    community_impact: int
    report_views_remaining: int
    is_premium: bool
    onboarding_complete: bool

class CommunityStats(BaseModel):
    """Community statistics"""
    total_members: int
    total_tests_completed: int
    active_votes: int
    recent_activity: List[Dict[str, Any]]