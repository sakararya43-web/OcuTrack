# OcuTrack Frontend

Browser-based ocular measurement and longitudinal monitoring prototype.

## Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + jsdom

## Setup and Commands

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```
   Opens on `http://localhost:3000`.

3. **Build production bundle**:
   ```bash
   npm run build
   ```

4. **Run automated test suite**:
   ```bash
   npm test
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## Configuration

Environment variables can be specified in `.env` (see `.env.example`):
- `VITE_API_BASE_URL`: Base URL for Parth's FastAPI backend (default: `http://localhost:8000`).

## Clinical Notice

OcuTrack is an engineering prototype for research and observational data collection. It is not an FDA/CE-cleared diagnostic medical device.
