# 🤖 AI Developer Assistant

A full-stack AI-powered developer IDE interface with GitHub PR diff viewer and AI chat assistant.

![Preview](https://via.placeholder.com/800x400/1a1b26/7c6af7?text=AI+Developer+Assistant)

## 📁 Project Structure

```
ai-developer-assistant/
├── frontend/          ← React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityBar.jsx    # Left nav icons
│   │   │   ├── Sidebar.jsx        # File tree explorer
│   │   │   ├── TabBar.jsx         # Editor tabs
│   │   │   ├── DiffViewer.jsx     # GitHub PR diff viewer
│   │   │   └── AIAssistant.jsx    # AI chat panel
│   │   ├── pages/
│   │   │   └── IDELayout.jsx      # Main layout
│   │   ├── store/
│   │   │   └── useStore.js        # Zustand global state
│   │   ├── services/
│   │   │   └── api.js             # Axios API client
│   │   └── styles/
│   │       └── index.css          # Global styles
│   └── package.json
│
└── backend/           ← Node.js + Express + OpenAI
    ├── src/
    │   ├── controllers/
    │   │   ├── aiController.js    # AI chat endpoints
    │   │   └── githubController.js# GitHub endpoints
    │   ├── routes/
    │   │   ├── aiRoutes.js        # /api/ai/*
    │   │   └── githubRoutes.js    # /api/github/*
    │   ├── services/
    │   │   ├── aiService.js       # OpenAI integration
    │   │   └── githubService.js   # GitHub API integration
    │   ├── middleware/
    │   │   └── rateLimiter.js     # Rate limiting + logging
    │   └── index.js               # Express server + Socket.IO
    ├── .env                       # ← Add your API keys here
    └── package.json
```

## 🚀 Getting Started

### 1. Configure Backend Environment

Edit `backend/.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key
GITHUB_TOKEN=ghp_your-github-token
GITHUB_OWNER=your-github-username
```

### 2. Install & Run Backend

```bash
cd backend
npm install
npm run dev
# Server starts at http://localhost:5000
```

### 3. Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:3000
```

## 🌐 API Endpoints

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with AI assistant |
| POST | `/api/ai/analyze-diff` | Analyze a code diff |
| POST | `/api/ai/generate-pr-description` | Generate PR description |

### GitHub
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/repositories` | List user repositories |
| GET | `/api/github/prs/:repo` | List open PRs |
| GET | `/api/github/prs/:repo/:number/diff` | Get PR diff |
| GET | `/api/github/file/:repo?path=...` | Get file content |
| POST | `/api/github/create-pr` | Create a new PR |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## 🎨 UI Features

- **Dark IDE theme** matching the design (Tokyo Night palette)
- **File tree** with expandable folders
- **Split diff viewer** with color-coded adds/removes
- **AI Assistant panel** with streaming chat
- **Tab bar** for multiple open files
- **Socket.IO** real-time AI responses
- **Code blocks** with syntax highlighting + copy button

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express, Socket.IO |
| AI | OpenAI GPT-4o |
| GitHub | GitHub REST API v3 |
| Icons | Lucide React |
