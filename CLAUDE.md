# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Architecture

React 18 + Vite single-page application with all components in `src/App.jsx`.

### Components

- **App** - Main dashboard with apps table, dark mode toggle, and CRUD operations for managing apps
- **ChatBot** - Multi-AI chat interface supporting simultaneous queries to OpenAI (GPT-4o), Claude (Sonnet 4.5), Grok (4), and Perplexity (Sonar Pro)
- **AppForm** - Modal form for adding/editing apps

### Data Flow

- Apps data: Loaded from `src/data/apps.json`, persisted to localStorage (`dashboard-apps`)
- Theme: Persisted to localStorage (`dashboard-theme`), synced with `data-theme` attribute on document
- AI responses: Fetched in parallel via `Promise.all`, displayed in multi-column layout based on selected providers

### AI Integration

API calls defined at module level with `callOpenAI`, `callClaude`, `callGrok`, `callPerplexity` functions. Each uses `getSystemMessage()` for consistent prompting with current date. Grok has special handling to clarify it lacks live X/Twitter access via API.

### Key Files

- `src/App.jsx` - All components and API logic
- `src/App.css` - All styling including responsive multi-column chat layout
- `src/data/apps.json` - Initial apps seed data
