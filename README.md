# Ivy Homes Engineering Internship Assignment

## Overview

This is a React (Vite) application built to interact with the Ivy Homes property API. The frontend is specifically engineered to bypass and handle intentional discrepancies found in the API documentation.

## The Investigation & Discovered Traps

Before building the UI, I audited the dataset and discovered several traps:

- **The Auth Trap:** The API requires `X-API-Key` in headers, not as a query parameter. Tokens expire in 15 minutes, requiring a refresh flow.
- **The Pagination Trap:** The API uses `limit`/`offset` instead of `page` metadata.
- **The Corrupt/Fake Data Trap:** Found listings posted in the future, physically impossible dimensions, and fraudulent lead-farming listings.
- **The Project Unit Trap:** Project prices were returning in Crores, not Rupees as documented. Handled client-side by formatting the display output.

## Tech Stack

- React + Vite
- Tailwind CSS
- React Router DOM

## How to Run Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory and add: `VITE_API_KEY=your_api_key_here`
4. Start the server: `npm run dev`

## AI Usage Disclosure

As permitted by the assignment guidelines, I utilized AI as a pair-programming partner to help scaffold the React components rapidly, debug Tailwind configurations, and structure my data parsing scripts. All architectural decisions, trap discoveries, and logic implementations were directed by me.
