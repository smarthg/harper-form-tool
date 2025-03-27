import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formDataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default form data
  await storage.initializeFormData();

  // Get form data
  app.get("/api/form-data", async (req, res) => {
    try {
      const formData = await storage.getFormData();
      res.json(formData);
    } catch (error) {
      console.error("Error fetching form data:", error);
      res.status(500).json({ message: "Failed to fetch form data" });
    }
  });

  // Update form data (partial update)
  app.patch("/api/form-data", async (req, res) => {
    try {
      // Validate the fields being updated
      const updates = req.body;
      
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      // Only allow known fields to be updated
      const knownFields = Object.keys(formDataSchema.shape);
      const invalidFields = Object.keys(updates).filter(
        (key) => !knownFields.includes(key)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          message: `Invalid fields: ${invalidFields.join(", ")}`,
        });
      }

      // Update the form data
      const updatedFormData = await storage.updateFormData(updates);
      res.json(updatedFormData);
    } catch (error) {
      console.error("Error updating form data:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update form data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
