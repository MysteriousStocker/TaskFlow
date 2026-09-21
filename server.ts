import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "taskflow-super-secret-jwt-key-rise-2026";
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "taskflow.json");

// Types
export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  lastLoginAt?: string | null;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string | null;
}

export type ActivityAction =
  | "LOGIN"
  | "REGISTER"
  | "PASSWORD_RESET"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DELETED"
  | "BACKUP_EXPORTED";

export interface ActivityRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: ActivityAction;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  tasks: TaskRecord[];
  activities: ActivityRecord[];
}

const ADMIN_EMAIL = "310625104024@eec.srmrmp.edu.in";
const resetCodes = new Map<string, { code: string; expiresAt: number }>();

// Database Helper
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (Array.isArray(data.users) && Array.isArray(data.tasks)) {
        // Ensure activities array exists
        if (!Array.isArray(data.activities)) {
          data.activities = [];
        }
        // Ensure 310625104024@eec.srmrmp.edu.in is ADMIN and migrate previous admin email if found
        data.users.forEach((u: UserRecord) => {
          if (u.email.toLowerCase() === "anandsagaidavid@gmail.com") {
            u.email = ADMIN_EMAIL;
            u.role = "ADMIN";
          } else if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            u.role = "ADMIN";
          } else if (!u.role) {
            u.role = "USER";
          }
        });
        return data;
      }
    } catch {
      console.warn("Could not read db file, initializing default data");
    }
  }

  // Pre-seed demo users
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync("password123", defaultSalt);

  const defaultUsers: UserRecord[] = [
    {
      id: "usr_anand_001",
      fullName: "Anand Sagai David",
      email: ADMIN_EMAIL,
      passwordHash: defaultHash,
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: "usr_demo_002",
      fullName: "Demo Reviewer",
      email: "demo@taskflow.dev",
      passwordHash: defaultHash,
      role: "USER",
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    },
  ];

  // User requested no initial tasks on dashboard - let user decide and create their own tasks
  const defaultTasks: TaskRecord[] = [];

  const initialActivities: ActivityRecord[] = [
    {
      id: "act_init_001",
      userId: "usr_anand_001",
      userEmail: ADMIN_EMAIL,
      userName: "Anand Sagai David",
      action: "REGISTER",
      details: "Admin workspace created and initialized",
      timestamp: new Date().toISOString(),
    },
  ];

  const initialDb: DatabaseSchema = {
    users: defaultUsers,
    tasks: defaultTasks,
    activities: initialActivities,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
  return initialDb;
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database:", err);
  }
}

// Activity Logging Helper
function logActivity(user: { id: string; email: string; fullName: string }, action: ActivityAction, details: string) {
  if (!db.activities) {
    db.activities = [];
  }
  const activity: ActivityRecord = {
    id: `act_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  db.activities.unshift(activity);
  // Keep up to 1000 activities
  if (db.activities.length > 1000) {
    db.activities = db.activities.slice(0, 1000);
  }
  saveDatabase();
}

// Generate unique IDs
function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// Real-Time WebSocket & SSE Clients Management
interface ConnectedClient {
  userId: string;
  ws?: WebSocket;
  sseRes?: Response;
}

const connectedClients: ConnectedClient[] = [];

function broadcastToUser(userId: string, event: { type: string; task?: TaskRecord | null; taskId?: string | null }) {
  const payload = JSON.stringify(event);
  connectedClients.forEach((client) => {
    if (client.userId === userId) {
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch {
          // ignore closed socket
        }
      }
      if (client.sseRes && !client.sseRes.writableEnded) {
        try {
          client.sseRes.write(`data: ${payload}\n\n`);
        } catch {
          // ignore closed SSE
        }
      }
    }
  });
}

// JWT Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    const user = db.users.find((u) => u.id === decoded.sub);
    if (!user) {
      return res.status(401).json({ message: "Invalid session, user not found" });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", users: db.users.length, tasks: db.tasks.length });
  });

  // 1. Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = db.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const role: "ADMIN" | "USER" = cleanEmail === ADMIN_EMAIL.toLowerCase() ? "ADMIN" : "USER";
    const newUser: UserRecord = {
      id: generateId("usr"),
      fullName: String(fullName).trim(),
      email: cleanEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase();
    logActivity(newUser, "REGISTER", `New user registered: ${newUser.fullName} (${newUser.role})`);

    const token = jwt.sign({ sub: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    });
  });

  // 2. Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Set role for admin email
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.role = "ADMIN";
    } else if (!user.role) {
      user.role = "USER";
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase();
    logActivity(user, "LOGIN", "Signed in to workspace");

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  });

  // 2b. Auth: Forgot Password - Request verification code
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide your email address" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Generate random 6-digit numeric verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    resetCodes.set(cleanEmail, { code: resetCode, expiresAt });

    return res.json({
      success: true,
      message: `A 6-digit password reset verification code has been generated.`,
      resetCode,
      email: cleanEmail,
    });
  });

  // 2c. Auth: Reset Password - Verify code and set new password
  app.post("/api/auth/reset-password", (req, res) => {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: "Email, verification code, and new password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const activeReset = resetCodes.get(cleanEmail);
    if (!activeReset) {
      return res.status(400).json({ message: "No pending password reset request found. Please request a new code." });
    }

    if (Date.now() > activeReset.expiresAt) {
      resetCodes.delete(cleanEmail);
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    if (activeReset.code !== String(resetCode).trim()) {
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    // Hash and update password
    user.passwordHash = bcrypt.hashSync(String(newPassword), 10);
    saveDatabase();
    resetCodes.delete(cleanEmail);

    logActivity(user, "PASSWORD_RESET", `Password was successfully updated via verification reset code`);

    return res.json({
      success: true,
      message: "Password has been reset successfully! You can now log in with your new password.",
    });
  });

  // 3. Auth: Current user info
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const role = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "ADMIN" : (user.role || "USER");
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role,
    });
  });

  // 4. Tasks: Get all user tasks
  app.get("/api/tasks", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const userTasks = db.tasks
      .filter((t) => t.ownerId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(userTasks);
  });

  // 5. Tasks: Create task
  app.post("/api/tasks", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const validStatus: TaskStatus = ["TODO", "IN_PROGRESS", "DONE"].includes(status) ? status : "TODO";
    const validPriority: TaskPriority = ["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM";

    const newTask: TaskRecord = {
      id: generateId("task"),
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      status: validStatus,
      priority: validPriority,
      dueDate: dueDate || null,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };

    db.tasks.unshift(newTask);
    saveDatabase();
    logActivity(user, "TASK_CREATED", `Created task "${newTask.title}" [${newTask.status}]`);

    broadcastToUser(user.id, {
      type: "CREATED",
      task: newTask,
      taskId: null,
    });

    res.status(201).json(newTask);
  });

  // 6. Tasks: Update task
  app.put("/api/tasks/:id", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const taskId = req.params.id;
    const { title, description, status, priority, dueDate } = req.body;

    const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.ownerId === user.id);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    const currentTask = db.tasks[taskIndex];
    const updatedTask: TaskRecord = {
      ...currentTask,
      title: title !== undefined ? String(title).trim() : currentTask.title,
      description: description !== undefined ? String(description).trim() : currentTask.description,
      status: ["TODO", "IN_PROGRESS", "DONE"].includes(status) ? status : currentTask.status,
      priority: ["LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : currentTask.priority,
      dueDate: dueDate !== undefined ? (dueDate || null) : currentTask.dueDate,
      updatedAt: new Date().toISOString(),
    };

    db.tasks[taskIndex] = updatedTask;
    saveDatabase();
    logActivity(user, "TASK_UPDATED", `Updated task "${updatedTask.title}"`);

    broadcastToUser(user.id, {
      type: "UPDATED",
      task: updatedTask,
      taskId: null,
    });

    res.json(updatedTask);
  });

  // 7. Tasks: Update status (for Drag & Drop and Mark As Done)
  app.patch("/api/tasks/:id/status", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const taskId = req.params.id;
    const { status } = req.body;

    if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.ownerId === user.id);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    const currentTask = db.tasks[taskIndex];
    const updatedTask: TaskRecord = {
      ...currentTask,
      status,
      updatedAt: new Date().toISOString(),
    };

    db.tasks[taskIndex] = updatedTask;
    saveDatabase();
    logActivity(user, "TASK_STATUS_CHANGED", `Moved task "${updatedTask.title}" to status ${status}`);

    broadcastToUser(user.id, {
      type: "UPDATED",
      task: updatedTask,
      taskId: null,
    });

    res.json(updatedTask);
  });

  // 8. Tasks: Delete task
  app.delete("/api/tasks/:id", authMiddleware, (req, res) => {
    const user = (req as any).user as UserRecord;
    const taskId = req.params.id;

    const taskIndex = db.tasks.findIndex((t) => t.id === taskId && t.ownerId === user.id);
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    const taskTitle = db.tasks[taskIndex].title;
    db.tasks.splice(taskIndex, 1);
    saveDatabase();
    logActivity(user, "TASK_DELETED", `Deleted task "${taskTitle}"`);

    broadcastToUser(user.id, {
      type: "DELETED",
      task: null,
      taskId,
    });

    res.status(204).send();
  });

  // ADMIN Middleware: Check if user is admin
  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user as UserRecord;
    const isAdmin = user.role === "ADMIN" || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (!isAdmin) {
      return res.status(403).json({ message: "Access restricted to Master Administrator" });
    }
    next();
  }

  // 9. Admin: System & User Overview for backup oversight
  app.get("/api/admin/overview", authMiddleware, requireAdmin, (req, res) => {
    const userList = db.users.map((u) => {
      const userTasks = db.tasks.filter((t) => t.ownerId === u.id);
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "ADMIN" : (u.role || "USER"),
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt || null,
        taskCount: userTasks.length,
        doneTasksCount: userTasks.filter((t) => t.status === "DONE").length,
        // Detailed security status for backup verification
        passwordStatus: "Bcrypt Salted Hash (Encrypted Blowfish)",
        passwordHashPreview: `${u.passwordHash.substring(0, 18)}...`,
        fullPasswordHash: u.passwordHash,
      };
    });

    res.json({
      stats: {
        totalUsers: db.users.length,
        totalTasks: db.tasks.length,
        totalActivities: (db.activities || []).length,
        backupStatus: "Online & Ready",
        serverUptime: process.uptime(),
      },
      users: userList,
      activities: (db.activities || []).slice(0, 150),
    });
  });

  // 10. Admin: Download full disaster recovery backup
  app.get("/api/admin/backup", authMiddleware, requireAdmin, (req, res) => {
    const user = (req as any).user as UserRecord;
    logActivity(user, "BACKUP_EXPORTED", `Exported complete database backup archive`);

    const backupPayload = {
      app: "TaskFlow",
      backupVersion: "2.0.0",
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      meta: {
        totalUsers: db.users.length,
        totalTasks: db.tasks.length,
        totalActivities: (db.activities || []).length,
      },
      users: db.users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "ADMIN" : (u.role || "USER"),
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        passwordHash: u.passwordHash,
      })),
      tasks: db.tasks,
      activities: db.activities || [],
    };

    res.setHeader("Content-Disposition", `attachment; filename=taskflow-backup-${new Date().toISOString().split("T")[0]}.json`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupPayload, null, 2));
  });

  // 9. Real-Time SSE fallback endpoint
  app.get("/api/events", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const client: ConnectedClient = { userId, sseRes: res };
    connectedClients.push(client);

    // Initial keepalive ping
    res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);

    const intervalId = setInterval(() => {
      if (!res.writableEnded) {
        res.write(`: ping\n\n`);
      }
    }, 25000);

    req.on("close", () => {
      clearInterval(intervalId);
      const idx = connectedClients.indexOf(client);
      if (idx !== -1) connectedClients.splice(idx, 1);
    });
  });

  // Create HTTP Server
  const server = http.createServer(app);

  // 10. WebSocket Server Setup
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/ws" || url.pathname === "/ws/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    let userId = url.searchParams.get("userId") || "";

    const clientObj: ConnectedClient = { userId, ws };
    connectedClients.push(clientObj);

    ws.send(JSON.stringify({ type: "CONNECTED", status: "online" }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe" && msg.userId) {
          clientObj.userId = msg.userId;
        }
      } catch {
        // ignore
      }
    });

    ws.on("close", () => {
      const idx = connectedClients.indexOf(clientObj);
      if (idx !== -1) connectedClients.splice(idx, 1);
    });
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`TaskFlow Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
