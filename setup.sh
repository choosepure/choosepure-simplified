#!/bin/bash

echo "🚀 Setting up ChoosePure Simplified..."

# Check if we're in the right directory
if [ ! -f "setup.sh" ]; then
    echo "❌ Please run this script from the choosepure-simplified directory"
    exit 1
fi

# Backend setup
echo "📦 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend

# Install Node dependencies
if command -v yarn &> /dev/null; then
    echo "Installing dependencies with Yarn..."
    yarn install
else
    echo "Installing dependencies with npm..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:8001/api/v2" > .env
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your database and API keys"
echo "2. Start the backend: cd backend && source venv/bin/activate && python server.py"
echo "3. Start the frontend: cd frontend && npm start (or yarn start)"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo ""
echo "📖 See README.md for detailed configuration instructions"