# Loan Marketplace MVP

A comprehensive loan marketplace platform that connects borrowers with lenders through an AI-powered chatbot interface.

## Features

- **Chatbot Interface**: Interactive loan application process through conversational AI
- **Loan Matching**: AI-powered lender matching based on credit score and eligibility
- **KYC Collection**: Automated document upload and extraction using Gemini API
- **Credit Scoring**: 100-point scoring system based on income, EMI burden, savings, and credit history
- **Lender Portal**: Registration, authentication, and dashboard for lenders
- **Document Extraction**: OCR-powered extraction of key information from KYC documents
- **Report Generation**: Comprehensive loan eligibility reports sent to lenders

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Cache/Sessions**: Redis
- **AI/OCR**: Google Gemini API
- **Authentication**: JWT tokens
- **Containerization**: Docker Compose

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Google Gemini API key

## Setup Instructions

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your:
   - MongoDB URI (default: `mongodb://localhost:27017`)
   - Redis URL (default: `redis://localhost:6379`)
   - Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
   - JWT secret (use a strong random string)

4. **Start MongoDB and Redis with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chatbot API
│   │   ├── upload/       # Document upload
│   │   ├── process-kyc/  # KYC processing
│   │   └── lenders/      # Lender APIs
│   ├── chat/             # Chatbot page
│   ├── lender/           # Lender portal pages
│   └── page.tsx          # Home page
├── components/           # React components
├── lib/                  # Utility libraries
│   ├── db/              # Database connections
│   ├── gemini.ts        # Gemini API integration
│   ├── scoring.ts       # User scoring algorithm
│   └── matching.ts      # Lender matching logic
├── types/               # TypeScript type definitions
└── docker-compose.yml   # Docker services configuration
```

## Usage

### For Borrowers

1. Visit the home page and click "Start Your Loan Journey"
2. Chat with the bot to:
   - Provide your name and loan purpose
   - Select a loan type
   - Enter phone/PAN for credit check
   - View matching lenders
   - Upload KYC documents
3. Receive loan eligibility report

### For Lenders

1. Register at `/lender/register`
2. Login at `/lender/login`
3. View loan applications in dashboard
4. Communicate with borrowers through the platform

## API Endpoints

### Chat API
- `POST /api/chat` - Send message to chatbot
- `GET /api/chat?sessionId=xxx` - Get chat session

### Document Upload
- `POST /api/upload` - Upload KYC document

### KYC Processing
- `POST /api/process-kyc` - Process uploaded documents and generate report

### Lender APIs
- `POST /api/lenders/register` - Register new lender
- `POST /api/lenders/login` - Lender login
- `GET /api/lenders/reports` - Get loan reports (authenticated)
- `POST /api/lenders/messages` - Send message to borrower
- `GET /api/lenders/messages` - Get messages (authenticated)

## Scoring Algorithm

The user scoring system (0-100 points) evaluates:
- **Income Stability** (0-25): Based on monthly income level
- **EMI Burden** (0-25): Lower EMI ratio = higher score
- **Savings Ratio** (0-20): Monthly savings as percentage of income
- **Credit Score** (0-20): Normalized from 300-900 scale
- **Document Accuracy** (0-10): Completeness of submitted documents

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Environment Variables

See `.env.local.example` for all required environment variables.

## Notes

- Credit scores are currently mocked for development
- File uploads are stored locally (use cloud storage in production)
- JWT tokens are stored in localStorage (use httpOnly cookies in production)
- MongoDB and Redis run in Docker containers

## License

MIT
