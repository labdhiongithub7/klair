# Klair — AI-Powered PDF Intelligence

Klair is an intelligent PDF assistant that transforms how you interact with documents. Upload PDFs, have AI-powered conversations about their content, organize your library into collections, and extract insights with natural language. Built with a modern React frontend and Express.js backend.

## Features

- **Smart PDF Chat** — Upload any PDF and ask questions about it. Klair reads and understands your documents, providing accurate, context-aware answers.
- **Document Collections** — Organize your PDFs into color-coded collections. Group research papers, textbooks, reports, or any documents that belong together.
- **Intelligent Search** — Find documents quickly with smart search across your entire library.
- **Note Taking** — Capture insights and thoughts while reading. All your notes are organized by document and easy to revisit.
- **Chat History** — Every conversation is saved automatically. Pick up right where you left off with any document.
- **Cloud Storage** — Documents are securely stored in the cloud and accessible from any device.
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile.

## How It Works

1. **Create an Account** — Sign up to get your personal document workspace
2. **Upload PDFs** — Drag and drop files or browse to upload
3. **Organize** — Create collections to group related documents
4. **Chat** — Ask questions and get AI-powered answers grounded in your documents
5. **Take Notes** — Save key insights while reading
6. **Search** — Find any document or conversation instantly

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js, TailwindCSS, Vite |
| **Backend** | Express.js, Node.js |
| **Database** | MongoDB |
| **AI** | Google Gemini AI |
| **File Storage** | Cloudinary |
| **Authentication** | JWT Tokens |

## Project Structure

```
klair/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── Pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   └── utils/       # Stores, auth, helpers
│   └── package.json
├── server/              # Express.js backend
│   ├── src/
│   │   ├── config/      # DB, Cloudinary config
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API route definitions
│   │   └── utils/       # Text chunking utilities
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Google Gemini API key
- Cloudinary account

### Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
JWT_SECRET=your_jwt_secret
```

Start the server:

```bash
npm start
```

### Client Setup

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Key Capabilities

### Document Management
- Drag & drop PDF upload with cloud storage
- Collections with custom colors and categories
- Full-text search and filtering
- Document analytics and usage insights

### AI Chat System
- Context-aware responses grounded in document content
- Persistent chat history across sessions
- Multi-document support with seamless switching
- Real-time AI responses with streaming indicators

### User Experience
- Soft pastel theme for comfortable extended reading
- Smooth animations and loading states throughout
- Mobile-first responsive design
- Intuitive error handling and recovery

### Security & Performance
- JWT-based authentication with secure sessions
- Rate limiting to prevent API abuse  
- Server-side input validation
- Proper CORS configuration

## Usage Guide

1. **Create Account** — Sign up with email and password
2. **Upload Documents** — Click "Upload Document" and select PDF files
3. **Organize** — Create collections and categorize documents
4. **Start Chatting** — Click any document to begin an AI conversation
5. **Take Notes** — Use the notes panel to save important information
6. **Manage Library** — View and organize all documents from the dashboard
