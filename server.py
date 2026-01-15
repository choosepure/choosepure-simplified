# Root level server.py for deployment compatibility
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Change working directory to backend
os.chdir(backend_dir)

# Import the FastAPI app
from server import app

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable (for production deployment)
    port = int(os.environ.get("PORT", 8001))
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=port)