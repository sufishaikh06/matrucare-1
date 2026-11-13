# MatruCare AI Hackathon Portal

A full-stack hackathon registration portal built for the MatruCare AI internship assignment. Participants can create an account, verify their email with a time-limited OTP, sign in securely, manage their profile, and submit a complete hackathon team registration.

## Features

- Responsive React landing page with event highlights, timeline, prizes, and clear calls to action.
- JWT and bcrypt authentication with a six-digit OTP that expires after 10 minutes.
- Protected dashboard with profile editing and registration status.
- Dynamic team registration form for solo teams through five members.
- Mongoose-backed REST API for auth, profile, and hackathon registration CRUD flows.
- Nodemailer templates for signup OTP and registration confirmation emails.
- Demo mode for local UI testing when MongoDB and SMTP credentials are not configured.

## Tech stack

- **Client:** React, Vite, React Router, plain CSS
- **Server:** Node.js, Express, Mongoose, JWT, bcryptjs, Nodemailer
- **Database:** MongoDB

## Setup

1. Install Node.js 18+ and MongoDB (local or Atlas).
2. Copy `server/.env.example` to `server/.env` and fill in the values.
3. Install dependencies from the repository root:

   ```bash
   npm run install:all
   npm install
   ```

4. Start both applications:

   ```bash
   npm run dev
   ```

   The client runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Environment variables

`MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CLIENT_URL`, and optional `PORT` are read from `server/.env`. Gmail requires an App Password when two-step verification is enabled. Never commit `.env` or SMTP credentials.

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | No | Create an unverified user and send OTP |
| POST | `/api/auth/verify-otp` | No | Verify the six-digit OTP |
| POST | `/api/auth/resend-otp` | No | Issue a fresh OTP |
| POST | `/api/auth/login` | No | Authenticate and return a JWT |
| GET | `/api/user/me` | JWT | Read the current profile |
| PUT | `/api/user/update` | JWT | Update profile details |
| POST | `/api/hackathon/register` | JWT | Create a hackathon registration |
| GET | `/api/hackathon/my-entry` | JWT | Read the current user's entry |
| PUT | `/api/hackathon/:id` | JWT | Update the user's entry |
| DELETE | `/api/hackathon/:id` | JWT | Delete the user's entry |

## Demo mode

If the API is unavailable, the client uses a clearly labeled local demo session so the responsive UI can be reviewed without external services. Production usage always uses the API, MongoDB, JWT, and configured email provider.

## Deployment

Build the client with `npm run build --prefix client` and deploy `client/dist` to Vercel or Netlify. Deploy the `server` folder to Render or Railway with the environment variables above and set the client's `VITE_API_URL` to the deployed API URL.
