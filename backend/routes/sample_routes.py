from fastapi import APIRouter, HTTPException, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import SampleReport, ApiResponse
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/samples", tags=["Sample Reports"])

async def get_db():
    from server import db
    return db

@router.get("/reports")
async def get_sample_reports(
    category: Optional[str] = Query(None, description="Filter by category"),
    featured_only: bool = Query(False, description="Show only featured reports"),
    limit: int = Query(10, description="Number of reports to return"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get sample test reports (no authentication required)"""
    try:
        # Build query
        query = {}
        if category:
            query["category"] = category
        if featured_only:
            query["is_featured"] = True
        
        # Get reports
        cursor = db.sample_reports.find(query).sort("created_at", -1).limit(limit)
        reports = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for report in reports:
            report["_id"] = str(report["_id"])
        
        return ApiResponse(
            success=True,
            message=f"Retrieved {len(reports)} sample reports",
            data={
                "reports": reports,
                "total": len(reports),
                "category": category,
                "featured_only": featured_only
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting sample reports: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get sample reports")

@router.get("/reports/{report_id}")
async def get_sample_report_detail(
    report_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get detailed view of a sample report (no authentication required)"""
    try:
        from bson import ObjectId
        
        # Get report
        report = await db.sample_reports.find_one({"_id": ObjectId(report_id)})
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Convert ObjectId to string
        report["_id"] = str(report["_id"])
        
        # For sample reports, show basic details but not full lab parameters
        # This creates value demonstration without giving everything away
        sample_view = {
            "id": report["_id"],
            "product_name": report["product_name"],
            "brand": report["brand"],
            "category": report["category"],
            "purity_score": report["purity_score"],
            "test_date": report["test_date"],
            "tested_by": report["tested_by"],
            "image": report["image"],
            "key_findings": report["key_findings"],
            "safety_status": report["safety_status"],
            "has_detailed_parameters": bool(report.get("detailed_parameters")),
            "premium_required": True  # Indicate premium needed for full details
        }
        
        return ApiResponse(
            success=True,
            message="Sample report retrieved",
            data=sample_view
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sample report detail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get report detail")

@router.get("/categories")
async def get_report_categories(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all available report categories"""
    try:
        # Get distinct categories
        categories = await db.sample_reports.distinct("category")
        
        # Get count for each category
        category_stats = []
        for category in categories:
            count = await db.sample_reports.count_documents({"category": category})
            category_stats.append({
                "name": category,
                "count": count
            })
        
        # Sort by count descending
        category_stats.sort(key=lambda x: x["count"], reverse=True)
        
        return ApiResponse(
            success=True,
            message="Categories retrieved",
            data={
                "categories": category_stats,
                "total_categories": len(category_stats)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@router.get("/featured")
async def get_featured_reports(
    limit: int = Query(3, description="Number of featured reports"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get featured reports for homepage display"""
    try:
        cursor = db.sample_reports.find({"is_featured": True}).sort("purity_score", -1).limit(limit)
        reports = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and format for homepage
        featured_reports = []
        for report in reports:
            featured_reports.append({
                "id": str(report["_id"]),
                "product_name": report["product_name"],
                "brand": report["brand"],
                "category": report["category"],
                "purity_score": report["purity_score"],
                "safety_status": report["safety_status"],
                "image": report["image"],
                "key_finding": report["key_findings"][0] if report["key_findings"] else "Lab tested for safety"
            })
        
        return ApiResponse(
            success=True,
            message="Featured reports retrieved",
            data={
                "featured_reports": featured_reports,
                "total": len(featured_reports)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting featured reports: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get featured reports")

@router.get("/stats")
async def get_sample_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get statistics about sample reports"""
    try:
        # Get basic stats
        total_reports = await db.sample_reports.count_documents({})
        featured_count = await db.sample_reports.count_documents({"is_featured": True})
        
        # Get average purity score
        pipeline = [
            {"$group": {"_id": None, "avg_purity": {"$avg": "$purity_score"}}}
        ]
        avg_result = await db.sample_reports.aggregate(pipeline).to_list(1)
        avg_purity = round(avg_result[0]["avg_purity"], 1) if avg_result else 0
        
        # Get safety status distribution
        safety_pipeline = [
            {"$group": {"_id": "$safety_status", "count": {"$sum": 1}}}
        ]
        safety_stats = await db.sample_reports.aggregate(safety_pipeline).to_list(10)
        
        safety_distribution = {stat["_id"]: stat["count"] for stat in safety_stats}
        
        return ApiResponse(
            success=True,
            message="Sample statistics retrieved",
            data={
                "total_reports": total_reports,
                "featured_reports": featured_count,
                "average_purity_score": avg_purity,
                "safety_distribution": safety_distribution
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting sample stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get sample statistics")