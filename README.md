

# AI Career Copilot

AI Career Copilot is a full-stack Generative AI platform designed to help job seekers optimize resumes, evaluate job fit, generate cover letters, and manage applications using Google Gemini AI.

## Live Demo
https://ai-career-copilot-production-ae5f.up.railway.app/

## Features

### ATS Resume Analyzer

* Upload PDF, DOCX, or TXT resumes
* Extracts resume content automatically
* Generates ATS compatibility scores
* Identifies strengths, weaknesses, and missing keywords

### Job Fit Analysis

* Compares resumes against job descriptions
* Calculates alignment scores
* Highlights skill gaps and improvement areas

### Resume Segment Optimizer

* Rewrites resume achievements for specific job descriptions
* Improves keyword relevance and recruiter visibility

### AI Cover Letter Generator

* Generates personalized cover letters
* Tailors content to company and role requirements

### Application Tracker

* Track job applications
* Monitor interview progress
* Maintain organized job search workflows

### Authentication

* Secure login and registration
* JWT-based authentication system

## Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Node.js
* Express.js
* JWT Authentication

### AI

* Google Gemini API

### File Processing

* PDF Parsing
* Mammoth (DOCX Extraction)

### Deployment

* Railway

## Project Architecture

User → Frontend (React)
→ Backend API (Express)
→ Gemini AI
→ Resume Analysis / Job Matching / Cover Letter Generation

## Key Learning Outcomes

* Generative AI Integration
* Prompt Engineering
* Backend API Development
* Authentication Systems
* File Upload Handling
* Production Deployment
* AI-Powered Career Assistance Workflows

## Local Setup

1. Clone repository
2. Install dependencies

npm install

3. Configure environment variables

GEMINI_API_KEY=your_key
JWT_SECRET=your_secret

4. Run application

npm run dev

## Future Enhancements

* PostgreSQL Integration
* Interview Simulator
* Resume Version Management
* Analytics Dashboard
* Multi-Agent Career Assistance
