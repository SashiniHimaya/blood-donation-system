
const express = require("express");

// Import routes
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());


app.use("/api/users", userRoutes);
console.log("✅ User routes registered at /api/users");


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
