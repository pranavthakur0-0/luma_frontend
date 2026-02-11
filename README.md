# AI Mail Assistant

An AI-powered email client that allows users to manage their inbox using natural language commands. Features real-time synchronization with Gmail via Google Pub/Sub and a custom AI agent for UI control.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or via Atlas)
- Google Cloud Project with Gmail API enabled
- OpenAI API Key

## Installation and Setup

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a .env file based on the example:

```bash
cp .env.example .env
```

Update the .env file with your credentials:
- GOOGLE_CLIENT_ID: Your Google OAuth Client ID
- GOOGLE_CLIENT_SECRET: Your Google OAuth Client Secret
- OPENAI_API_KEY: Your OpenAI API Key
- PORT: 8000 (default)

Start the backend server:

```bash
npm run dev
```

The server will start on http://localhost:8000.

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

### 3. Ngrok Setup (Required for Real-time Updates in local)

To receive real-time email notifications from Gmail (via push notifications), the local backend must be accessible from the internet.

1. Install ngrok from https://ngrok.com/download
2. Start an HTTP tunnel on port 8000:

```bash
ngrok http 8000
```

3. Copy the forwarding URL (e.g., https://your-id.ngrok-free.app).
4. Update your Google Cloud Console:
   - Add the ngrok URL to "Authorized redirect URIs" in your OAuth credentials.
   - Configure the Pub/Sub subscription endpoint to use this URL (appended with /webhook).

## Architecture Decisions

**Custom AI Controller**
We implemented a bespoke AI agent on the backend instead of using off-the-shelf SDKs like CopilotKit. This provides granular control over tool execution and allows for precise mapping of natural language commands to specific UI actions and API calls.

**Real-time Updates via Webhooks**
We chose Gmail Push Notifications (Webhooks) over polling. This ensures immediate updates when new emails arrive and reduces unnecessary API calls. However, it requires a public-facing URL (ngrok) for local development.

**State Management with Zustand**
Zustand was selected for its simplicity and minimal boilerplate. It allows the AI agent to easily manipulate the application state programmatically without the complexity of Redux.

## Future Improvements

**Draft Persistence**
Implement local storage or database persistence for drafts to prevent data loss before sending.

**Optimistic Updates**
Update the UI immediately when an action is taken (e.g., deleting an email) to improve perceived performance, rather than waiting for the API response.

**Enhanced Error Handling**
Improve error reporting and fallback UI states for network issues or API limits.

**TypeScript Migration**
Migrate the codebase to TypeScript to improve type safety and maintainability.

## Demo

https://drive.google.com/file/d/1WlXIWh_GwyYWM-W3oe3SKdTIrQ15xyjI/view?usp=sharing

