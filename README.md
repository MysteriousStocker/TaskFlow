# TaskFlow — Real-Time Task & Workflow Management Application

A full-stack, real-time Kanban task management web application engineered with modern React, TypeScript, Express, WebSockets, and a file-backed persistence engine with live disaster recovery and activity auditing.

---

## 🌟 Key Features

- **Interactive Kanban Board**: Dynamic drag-and-drop / status switcher across `To Do`, `In Progress`, and `Done` columns with priority tags (`High`, `Medium`, `Low`) and due date tracking.
- **Focused Done Column**: Automatically shows the 3 most recently completed items to keep workspaces organized, with indicators for archived items.
- **Real-Time Collaboration**: Instant multi-tab and multi-client state synchronization via WebSockets.
- **Interactive Calendar**: Monthly schedule view displaying task deadlines with instant status toggle and due-date filters.
- **Productivity Analytics**: Velocity, completion rate, overdue warnings, and priority distribution breakdowns.
- **User Authentication & Role-Based Access Control**:
  - Secure registration and sign in with salted Bcrypt password hashing (Blowfish, 10 rounds) and signed JSON Web Tokens (JWT).
  - Self-service **Forgot Password** workflow with 6-digit verification code generation and password updates.
- **Master Admin & Backup Console** (`310625104024@eec.srmrmp.edu.in`):
  - Dedicated **Admin & Backup** sidebar tab reserved exclusively for the Master Administrator.
  - **User & Credentials Directory**: Real-time user accounts table with creation timestamps, task statistics, and salted Bcrypt cryptographic hashes.
  - **Live Audit Trail**: Chronological activity timeline recording logins, registrations, task creations, status updates, deletions, and exports.
  - **Disaster Recovery & Snapshots**: One-click database `.json` downloads and instant raw snapshot copying for offsite backups.
- **Adaptive Dark & Light Modes**: Seamless theme switching with persistent user preference storage.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, React Router v7, Tailwind CSS v4, Motion, Lucide React
- **Backend**: Node.js, Express, WebSocket (`ws`), Bcrypt.js, JSON Web Token (`jsonwebtoken`), tsx, esbuild
- **Storage**: Persistent JSON database store (`data/taskflow.json`) with atomic write updates and directory auto-initialization

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install all dependencies:

```bash
git clone <your-github-repo-url>.git
cd taskflow
npm install
```

### 3. Environment Variables
Copy the sample environment file:

```bash
cp .env.example .env
```

Configurable parameters in `.env`:
```env
# Optional secret for JWT token signing (defaults to secure internal fallback if not provided)
JWT_SECRET=your-custom-jwt-secret-key-here

# Gemini API Key (optional for future AI automations)
GEMINI_API_KEY=
```

### 4. Running the Development Server
Start the full-stack dev server (Express backend + Vite middleware on port 3000):

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 5. Default Credentials & Master Admin
- **Master Admin Email**: `310625104024@eec.srmrmp.edu.in`
- **Default Password**: `password123`
- You can also register any new account or use the **Forgot password?** flow on the login page to reset passwords at any time.

---

## 📦 Production Build & Deployment

To compile the project for production deployment:

```bash
# Build client assets and bundle the server
npm run build

# Start the production server
npm start
```

The build command outputs:
- Client-side static assets to `dist/`
- Node.js self-contained CommonJS server bundle to `dist/server.cjs`

---

## 📂 Project Architecture

```
├── data/
│   └── taskflow.json         # Persistent JSON database (users, tasks, activities)
├── src/
│   ├── api/                  # Axios HTTP client, auth, tasks, and admin services
│   ├── components/           # UI components (Sidebar, TopNav, Modal, ThemeToggle)
│   ├── context/              # Authentication and Global Task state providers
│   ├── pages/                # Views (Login, Register, Dashboard, Calendar, Analytics, Settings, AdminPage)
│   ├── types.ts              # TypeScript domain types & interfaces
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Tailwind CSS stylesheets and theme tokens
│   └── App.tsx               # Route declarations and layout shells
├── server.ts                 # Express REST API, WebSocket server, and Vite middleware
├── package.json              # Project scripts and dependencies
├── metadata.json             # AI Studio applet configuration and capabilities
└── vite.config.ts            # Vite build configuration
```

---

## 🔒 Security Architecture

- **Bcrypt Salted Hashes**: User passwords are never stored in plain text; all entries use salted 10-round Bcrypt hashes.
- **Signed JWT Tokens**: Stateless, tamper-proof bearer tokens with 7-day expiration.
- **Admin Role Verification**: The `/api/admin/*` endpoints strictly verify both the JWT role payload and database record to ensure administrative isolation.
- **Activity Logging**: Security-critical events (logins, password resets, database exports) are audited with timestamps and client identifiers.

---

## 🚢 Publishing to GitHub

If you are publishing this project to your GitHub account:

1. Create a new repository on [GitHub](https://github.com/new).
2. Initialize and push your repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of TaskFlow full-stack kanban application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Alternatively, use the **Export to GitHub** option directly from the Google AI Studio settings menu.

---

## 📄 License
This project is licensed under the MIT License.
