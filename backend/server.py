from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Import simplified routes
from routes import (
    onboarding_routes,
    sample_routes, 
    voting_routes,
    user_routes,
    subscription_routes
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'choosepure_simplified')]

# Create the main app
app = FastAPI(
    title="ChoosePure Simplified API", 
    version="2.0.0",
    description="Simplified user flow for ChoosePure platform"
)

# Create API router
api_router = APIRouter(prefix="/api/v2")

# Health check
@api_router.get("/")
async def root():
    return {"message": "ChoosePure Simplified API is running", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Include simplified route modules
api_router.include_router(onboarding_routes.router)
api_router.include_router(sample_routes.router)
api_router.include_router(voting_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(subscription_routes.router)

# Include the router in the main app
app.include_router(api_router)

# CORS middleware - more permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Configure for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("ChoosePure Simplified API starting up...")
    logger.info(f"Connected to database: {db.name}")
    
    # Create indexes for better performance
    await create_indexes()
    
    # Seed sample data if needed
    await seed_sample_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down...")
    client.close()

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("created_at")
        
        # Voting indexes
        await db.voting_options.create_index("status")
        await db.voting_options.create_index("votes", background=True)
        
        # Engagement indexes
        await db.user_engagement.create_index("email", unique=True)
        await db.user_engagement.create_index("updated_at")
        
        # Sample reports indexes
        await db.sample_reports.create_index("category")
        await db.sample_reports.create_index("is_featured")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")

async def seed_sample_data():
    """Seed sample data for demonstration"""
    try:
        # Check if sample reports exist
        sample_count = await db.sample_reports.count_documents({})
        if sample_count == 0:
            logger.info("Seeding sample reports...")
            
            sample_reports = [
                {
                    "product_name": "Amul Taaza Milk",
                    "brand": "Amul",
                    "category": "Dairy",
                    "purity_score": 8.5,
                    "test_date": "2024-01-15",
                    "tested_by": "FSSAI Certified Lab - Mumbai",
                    "image": "/images/amul-milk.jpg",
                    "key_findings": [
                        "No harmful additives detected",
                        "Fat content matches label claims",
                        "Safe bacterial levels",
                        "No antibiotic residues"
                    ],
                    "safety_status": "Safe",
                    "is_featured": True
                },
                {
                    "product_name": "Parle-G Biscuits",
                    "brand": "Parle",
                    "category": "Snacks",
                    "purity_score": 7.2,
                    "test_date": "2024-01-10",
                    "tested_by": "NABL Certified Lab - Delhi",
                    "image": "/images/parle-g.jpg",
                    "key_findings": [
                        "Trans fat within safe limits",
                        "Sugar content as per label",
                        "No harmful preservatives",
                        "Slight excess sodium detected"
                    ],
                    "safety_status": "Caution",
                    "is_featured": True
                },
                {
                    "product_name": "Mother Dairy Butter",
                    "brand": "Mother Dairy",
                    "category": "Dairy",
                    "purity_score": 9.1,
                    "test_date": "2024-01-20",
                    "tested_by": "FSSAI Certified Lab - Bangalore",
                    "image": "/images/mother-dairy-butter.jpg",
                    "key_findings": [
                        "100% pure milk fat",
                        "No artificial colors",
                        "Excellent quality standards",
                        "No harmful additives"
                    ],
                    "safety_status": "Safe",
                    "is_featured": True
                }
            ]
            
            await db.sample_reports.insert_many(sample_reports)
            logger.info("Sample reports seeded successfully")
        
        # Check if voting options exist
        voting_count = await db.voting_options.count_documents({})
        if voting_count == 0:
            logger.info("Seeding voting options...")
            
            voting_options = [
                {
                    "product_name": "Maggi Noodles",
                    "category": "Instant Food",
                    "description": "Test for MSG, lead content, and preservatives in popular instant noodles",
                    "votes": 245,
                    "funding_raised": 12000,
                    "funding_target": 15000,
                    "estimated_test_date": "2024-02-15",
                    "status": "voting",
                    "voters": []
                },
                {
                    "product_name": "Britannia Bread",
                    "category": "Bakery",
                    "description": "Check for harmful preservatives and gluten quality in packaged bread",
                    "votes": 189,
                    "funding_raised": 8500,
                    "funding_target": 12000,
                    "estimated_test_date": "2024-02-20",
                    "status": "voting",
                    "voters": []
                },
                {
                    "product_name": "Amul Cheese",
                    "category": "Dairy",
                    "description": "Verify milk quality and check for artificial additives in processed cheese",
                    "votes": 156,
                    "funding_raised": 6200,
                    "funding_target": 10000,
                    "estimated_test_date": "2024-02-25",
                    "status": "voting",
                    "voters": []
                }
            ]
            
            await db.voting_options.insert_many(voting_options)
            logger.info("Voting options seeded successfully")
            
    except Exception as e:
        logger.error(f"Error seeding sample data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment variable (for production deployment)
    port = int(os.environ.get("PORT", 8001))
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=port)