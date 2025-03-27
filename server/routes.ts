import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formDataSchema, companySchema } from "@shared/schema";
import { z } from "zod";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default form data
  await storage.initializeFormData();

  // Check if developer mode is enabled
  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';
  console.log(`Developer mode: ${isDeveloperMode ? 'enabled' : 'disabled'}`);

  // Define auth middleware for protected routes
  // In developer mode, use a pass-through middleware
  const requireAuth = isDeveloperMode 
    ? (req: Request, res: Response, next: NextFunction) => next() 
    : ClerkExpressRequireAuth();
  
  // Configure multer for file uploads
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only accept PDF files
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Public health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      developerMode: process.env.DEVELOPER_MODE === 'true'
    });
  });
  
  // Get all companies
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });
  
  // Get a specific company by ID
  app.get("/api/companies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });
  
  // Refresh companies from external API
  app.post("/api/companies/refresh", requireAuth, async (req, res) => {
    try {
      const companies = await storage.fetchCompaniesFromApi();
      res.json({
        message: "Companies refreshed successfully",
        companies
      });
    } catch (error) {
      console.error("Error refreshing companies:", error);
      res.status(500).json({ message: "Failed to refresh companies" });
    }
  });

  // Protected routes
  // Get form data
  app.get("/api/form-data", requireAuth, async (req, res) => {
    try {
      const formData = await storage.getFormData();
      res.json(formData);
    } catch (error) {
      console.error("Error fetching form data:", error);
      res.status(500).json({ message: "Failed to fetch form data" });
    }
  });

  // Update form data (partial update)
  app.patch("/api/form-data", requireAuth, async (req, res) => {
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
  
  // Upload and process a form
  app.post('/api/upload-form', requireAuth, upload.single('formFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Extract data from the uploaded PDF
      const extractedData = await storage.extractFormData(req.file.buffer);
      
      // Check if any data was extracted
      if (Object.keys(extractedData).length === 0) {
        return res.status(422).json({ 
          message: 'No data could be extracted from the uploaded form',
          extractedData 
        });
      }
      
      res.json({ 
        message: 'Form data extracted successfully',
        extractedData
      });
    } catch (error) {
      console.error('Error processing uploaded form:', error);
      res.status(500).json({ message: 'Failed to process the uploaded form' });
    }
  });
  
  // Transpose extracted data to the form
  app.post('/api/transpose-form', requireAuth, async (req, res) => {
    try {
      const { extractedData } = req.body;
      
      if (!extractedData || Object.keys(extractedData).length === 0) {
        return res.status(400).json({ message: 'No extracted data provided' });
      }
      
      // Transpose the extracted data onto the form
      const updatedFormData = await storage.transposeFormData(extractedData);
      
      res.json({
        message: 'Form data transposed successfully',
        formData: updatedFormData
      });
    } catch (error) {
      console.error('Error transposing form data:', error);
      res.status(500).json({ message: 'Failed to transpose form data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
