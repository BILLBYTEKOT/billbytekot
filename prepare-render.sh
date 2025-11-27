#!/bin/bash

# RestoBill AI - Render Deployment Preparation Script
# This script prepares your RestoBill AI for deployment on Render.com

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍽️  RestoBill AI - Render Deployment Preparation${NC}"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/server.py" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}Error: Please run this script from the restro-ai root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment Checklist${NC}"
echo "1. GitHub repository created and code pushed"
echo "2. Render.com account created"
echo "3. MongoDB Atlas account and cluster ready"
echo ""

read -p "Do you have all the above ready? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please complete the prerequisites first:${NC}"
    echo "• GitHub: https://github.com"
    echo "• Render: https://render.com"
    echo "• MongoDB Atlas: https://cloud.mongodb.com"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Collecting Configuration Information${NC}"
echo "Please provide the following information:"
echo ""

# Get MongoDB URL
read -p "MongoDB Atlas Connection String: " MONGO_URL
if [ -z "$MONGO_URL" ]; then
    echo -e "${RED}MongoDB URL is required${NC}"
    exit 1
fi

# Generate JWT Secret
echo ""
echo -e "${YELLOW}Generating secure JWT secret...${NC}"
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
echo "Generated JWT Secret: ${JWT_SECRET}"

# Get optional values
echo ""
echo -e "${YELLOW}Optional Configuration (press Enter to skip):${NC}"
read -p "Razorpay Key ID (for payments): " RAZORPAY_KEY_ID
read -p "Razorpay Key Secret (for payments): " RAZORPAY_KEY_SECRET
read -p "OpenAI API Key (for AI features): " LLM_API_KEY

# Create backend environment template
echo ""
echo -e "${BLUE}📄 Creating backend environment configuration...${NC}"

cat > backend/.env.render << EOF
# RestoBill AI Backend Environment Variables for Render
# Copy these values to your Render backend service environment variables

# Required Configuration
ENVIRONMENT=production
HOST=0.0.0.0
PORT=10000
DEBUG=false
LOG_LEVEL=INFO

# Database
MONGO_URL=${MONGO_URL}
DB_NAME=restrobill

# Security
JWT_SECRET=${JWT_SECRET}
JWT_ALGORITHM=HS256

# CORS (Update with your frontend URL after deployment)
CORS_ORIGINS=https://your-frontend.onrender.com,https://yourdomain.com

# File Upload
MAX_FILE_SIZE=5242880
RATE_LIMIT_PER_MINUTE=100

# Optional: Payment Gateway
$([ ! -z "$RAZORPAY_KEY_ID" ] && echo "RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}")
$([ ! -z "$RAZORPAY_KEY_SECRET" ] && echo "RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}")

# Optional: AI Features
$([ ! -z "$LLM_API_KEY" ] && echo "LLM_API_KEY=${LLM_API_KEY}")
EOF

# Create frontend environment template
echo -e "${BLUE}📄 Creating frontend environment configuration...${NC}"

cat > frontend/.env.render << EOF
# RestoBill AI Frontend Environment Variables for Render
# Copy these values to your Render frontend service environment variables

# API Configuration (Update with your backend URL after deployment)
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_ENVIRONMENT=production

# Build Configuration
CI=false

# Optional: Payment Gateway
$([ ! -z "$RAZORPAY_KEY_ID" ] && echo "REACT_APP_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}")
EOF

# Create deployment instructions
echo -e "${BLUE}📄 Creating deployment instructions...${NC}"

cat > RENDER_DEPLOY_INSTRUCTIONS.md << EOF
# 🚀 RestoBill AI - Render Deployment Instructions

Your RestoBill AI is ready for deployment! Follow these steps:

## 📋 Backend Service (API)

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select: \`your-username/restro-ai\`
   - Branch: \`main\`
   - Root Directory: \`backend\`
   - Environment: \`Python 3\`

2. **Build & Start Commands**
   \`\`\`
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   \`\`\`

3. **Environment Variables**
   Copy the values from \`backend/.env.render\` to your service environment variables:
   $(cat backend/.env.render | grep -v '^#' | grep -v '^$' | sed 's/^/   /')

4. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Note your backend URL: \`https://your-backend-name.onrender.com\`

## 🎨 Frontend Service (Web App)

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect same repository
   - Branch: \`main\`
   - Root Directory: \`frontend\`

2. **Build Settings**
   \`\`\`
   Build Command: npm install --legacy-peer-deps && npm run build
   Publish Directory: build
   \`\`\`

3. **Environment Variables**
   Copy from \`frontend/.env.render\` and update:
   \`\`\`
   REACT_APP_API_URL=https://your-backend-name.onrender.com/api
   REACT_APP_ENVIRONMENT=production
   CI=false
   $([ ! -z "$RAZORPAY_KEY_ID" ] && echo "   REACT_APP_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}")
   \`\`\`

4. **Deploy**
   - Click "Create Static Site"
   - Wait 5-7 minutes for build
   - Your app will be live at: \`https://your-frontend-name.onrender.com\`

## 🔧 Final Steps

1. **Update CORS Settings**
   - Go to your backend service settings
   - Update CORS_ORIGINS with your frontend URL:
     \`CORS_ORIGINS=https://your-frontend-name.onrender.com\`
   - Redeploy backend service

2. **Test Your Deployment**
   - Backend health: \`https://your-backend.onrender.com/health\`
   - Frontend: \`https://your-frontend.onrender.com\`
   - API docs: \`https://your-backend.onrender.com/docs\`

## 🎉 You're Live!

Your RestoBill AI is now running on Render! Start by:
1. Creating your restaurant profile
2. Adding menu items and tables
3. Setting up payment gateway
4. Training your staff

Need help? Check the logs in your Render dashboard or create a GitHub issue.
EOF

# Create gitignore entries
echo -e "${BLUE}🔒 Updating .gitignore...${NC}"

# Add render environment files to gitignore if not already there
if ! grep -q ".env.render" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Render deployment files" >> .gitignore
    echo "*.env.render" >> .gitignore
    echo "RENDER_DEPLOY_INSTRUCTIONS.md" >> .gitignore
fi

echo ""
echo -e "${GREEN}✅ Render deployment preparation complete!${NC}"
echo ""
echo -e "${YELLOW}📁 Files created:${NC}"
echo "   • backend/.env.render - Backend environment variables"
echo "   • frontend/.env.render - Frontend environment variables"
echo "   • RENDER_DEPLOY_INSTRUCTIONS.md - Step-by-step deployment guide"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Push your code to GitHub (if not already done)"
echo "2. Follow instructions in RENDER_DEPLOY_INSTRUCTIONS.md"
echo "3. Your RestoBill AI will be live in ~10 minutes!"
echo ""
echo -e "${GREEN}Happy deploying! 🍽️${NC}"
