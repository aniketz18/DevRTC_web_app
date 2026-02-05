const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Serve Static Assets in Production
if (process.env.NODE_ENV === "production") {
    const path = require("path");

    app.use(express.static(path.join(__dirname, "../client/dist")));

    // ✅ FIXED SPA FALLBACK (NO "*")
    app.use((req, res) => {
        res.sendFile(
            path.resolve(__dirname, "../client/dist", "index.html")
        );
    });
}

// Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("Mongo error:", err));

// Socket.IO Logic
const onlineUsers = new Map(); // socketId -> userId

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on("join", (userId) => {
        onlineUsers.set(socket.id, userId);
        io.emit("getOnlineUsers", Array.from(new Set(onlineUsers.values())));
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(socket.id);
        io.emit("getOnlineUsers", Array.from(new Set(onlineUsers.values())));
    });

    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        const socketId = [...onlineUsers.entries()]
            .find(([_, val]) => val === userToCall)?.[0];

        if (socketId) {
            io.to(socketId).emit("callUser", {
                signal: signalData,
                from,
                name,
            });
        }
    });

    socket.on("answerCall", ({ to, signal }) => {
        const socketId = [...onlineUsers.entries()]
            .find(([_, val]) => val === to)?.[0];

        if (socketId) {
            io.to(socketId).emit("callAccepted", signal);
        }
    });

    socket.on("rejectCall", ({ to }) => {
        const socketId = [...onlineUsers.entries()]
            .find(([_, val]) => val === to)?.[0];

        if (socketId) {
            io.to(socketId).emit("callRejected");
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
