const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] Request: ${req.method} ${
      req.originalUrl
    }`
  );
  next();
});

// --- IMPORT ROUTE FILES ---
const authRoutes = require("./routes/auth");
const diseaseRoutes = require("./routes/diseases");
const doctorRoutes = require("./routes/doctors");
const roomRoutes = require("./routes/rooms");
const ambulanceRoutes = require("./routes/ambulances");
const appointmentRoutes = require("./routes/appointments");
const pharmacyRoutes = require("./routes/pharmacy");
const patientRoutes = require("./routes/patients");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");
const prescriptionRoutes = require("./routes/prescriptions"); // New

// --- MOUNT ROUTERS ---
app.use("/api", authRoutes); // Handles /api/login, /api/signup, etc.
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/diseases", diseaseRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prescriptions", prescriptionRoutes); // New

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on("connection", (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.id}`);

  socket.on("join_chat", ({ userId, contactId }) => {
    const roomName = [userId, contactId].sort().join("_");
    socket.join(roomName);
    console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("send_message", async (data) => {
    const { sender_id, recipient_id, message_content } = data;
    try {
      const query =
        'INSERT INTO "MESSAGE" (sender_id, recipient_id, message_content) VALUES ($1, $2, $3)';
      await pool.query(query, [sender_id, recipient_id, message_content]);
      const roomName = [sender_id, recipient_id].sort().join("_");
      io.to(roomName).emit("receive_message", {
        ...data,
        sent_at: new Date().toISOString(),
      });
      console.log(
        `[Socket.IO] Message saved and broadcast to room ${roomName}`
      );
    } catch (error) {
      console.error("[Socket.IO] Failed to save or send message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`--- SERVER IS RUNNING ON PORT ${PORT} ---`);
});
