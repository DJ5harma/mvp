# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Environment Variables
1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Step 3: Start Docker Services
Start MongoDB and Redis:
```bash
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

## Step 4: Start Development Server
```bash
npm run dev
```

## Step 5: Access the Application
- **Home Page**: http://localhost:3000
- **Chatbot**: http://localhost:3000/chat
- **Lender Login**: http://localhost:3000/lender/login
- **Lender Register**: http://localhost:3000/lender/register

## Testing the Flow

### As a Borrower:
1. Go to http://localhost:3000
2. Click "Start Your Loan Journey"
3. Follow the chatbot prompts:
   - Enter your name
   - Specify loan purpose
   - Select a loan type (e.g., "Personal")
   - Provide phone number (10 digits) or PAN
   - View matching lenders
   - Select a lender
   - Upload KYC documents
   - Process KYC

### As a Lender:
1. Register at http://localhost:3000/lender/register
2. Login at http://localhost:3000/lender/login
3. View loan applications in dashboard
4. Click "Open Chat" to communicate with borrowers

## Troubleshooting

### MongoDB Connection Error
- Ensure Docker is running: `docker ps`
- Check MongoDB container: `docker-compose logs mongodb`
- Verify connection string in `.env.local`

### Redis Connection Error
- Check Redis container: `docker-compose logs redis`
- Verify Redis URL in `.env.local`

### Gemini API Error
- Verify your API key is correct in `.env.local`
- Check API quota/limits in Google AI Studio

### Port Already in Use
- Change ports in `docker-compose.yml` if 27017 or 6379 are in use
- Update `.env.local` with new ports

## Stopping Services
```bash
# Stop Docker services
docker-compose down

# Stop with data removal (WARNING: deletes data)
docker-compose down -v
```

## Production Deployment Notes
- Use environment-specific `.env` files
- Set strong JWT_SECRET
- Use cloud storage for file uploads (S3, etc.)
- Use production MongoDB and Redis instances
- Enable HTTPS
- Set up proper authentication (httpOnly cookies)
- Implement rate limiting
- Add monitoring and logging

