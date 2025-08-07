import express from "express";
import path from "path";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { log } from "./vite";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Serve built client files
  const clientBuildPath = path.join(__dirname, "../dist/public");
  app.use(express.static(clientBuildPath));
  
  // Serve all non-API routes with the React app
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  // Development: Use Vite dev server
  const server = app.listen(port, () => {
    log(`serving on port ${port}`);
    setupVite(app, server);
  });
}

// Production: Start server directly
if (process.env.NODE_ENV === "production") {
  app.listen(port, () => {
    log(`Production server running on port ${port}`);
  });
}

export default app;
