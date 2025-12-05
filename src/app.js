
const express = require("express");

// Import routes
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const matchRoutes = require("./routes/matchRoutes");

const app = express();

app.use(express.json());

// Register routes
app.use("/api/users", userRoutes);
console.log("✅ User routes registered at /api/users");

app.use("/api/requests", requestRoutes);
console.log("✅ Request routes registered at /api/requests");

app.use("/api/match", matchRoutes);
console.log("✅ Match routes registered at /api/match");


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
