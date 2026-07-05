# ProgressBook

Personal daily tracker for tasks, work sessions, and income/expense tracking.

## What Is Included

- React + Vite frontend with mobile-first screens and PWA support.
- Node + Express backend with REST routes.
- Google Sign-In on the frontend.
- Backend Google ID token verification and httpOnly JWT session cookies.
- Google Sheets database access through a service account.
- Per-user filtering for tasks, work sessions, and transactions.
- Dashboard charts for weekly work hours, expenses by category, and income vs expense.

## Folder Structure

```text
client/   React frontend
server/   Express backend
```

## Required Google Sheet Tabs

The server checks these tabs and header rows on startup:

- `WorkSessions`: `SessionID | UserEmail | Date | TaskName | StartTime | EndTime | DurationMin | Notes | CreatedAt`
- `IncomeExpense`: `EntryID | UserEmail | Date | Type | Category | Amount | PaymentMethod | Notes | CreatedAt`
- `TodoList`: `TaskID | UserEmail | Date | DayLabel | TaskName | Status | CreatedTime | CompletedTime`
- `Settings`: `Key | Value`
- `Users`: `Email | Name | JoinedDate`

If a tab is missing, the backend creates it. If `Settings` is empty, the backend seeds useful defaults.

## Server Setup

```bash
cd server
npm install
npm run dev
```

Required `server/.env` values:

```text
GOOGLE_SERVICE_ACCOUNT_JSON=
SPREADSHEET_ID=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
JWT_SECRET=
PORT=3000
CLIENT_URL=http://localhost:5173
```

## Client Setup

```bash
cd client
npm install
npm run dev
```

Required `client/.env` values:

```text
VITE_GOOGLE_CLIENT_ID=
VITE_API_URL=http://localhost:3000
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Security Notes

- Do not commit `.env` files.
- Share the Google Spreadsheet only with your own Google account and the service account email.
- End users should never receive direct Sheet access.
