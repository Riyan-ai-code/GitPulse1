# Deployment Guide

## Overview
This repository contains a Next.js frontend and an Express backend. Docker Compose is used to deploy both services together.

## Prerequisites
- Docker
- Docker Compose
- A Supabase project with:
  - `cache` table
  - `history` table
- GitHub token for GitHub API access
- Gemini API key if using AI features

## Environment Variables
Create a `.env` file in the repository root based on `.env.example`.

Required variables:
- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `FRONTEND_URL`

## Docker Compose
Build and run all services with:

```bash
docker compose up --build
```

This will start:
- backend on port `5000`
- frontend on port `3000`

## Production build
The frontend Dockerfile builds the Next.js app in a multi-stage image and exposes port `3000`.
The backend Dockerfile runs the Express server on port `5000`.

## Notes
- The backend uses Supabase for caching and history storage. If Supabase variables are not configured, the app logs warnings and will continue with limited functionality.
- Frontend requests use `NEXT_PUBLIC_API_BASE_URL` so the app can point to the backend service in Docker Compose or another environment.
- Update `frontend/src/lib/api.ts` if you need a different API route structure.
