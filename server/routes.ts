import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formDataSchema, companySchema } from "@shared/schema";
import { z } from "zod";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import multer from 'multer';
import { getFormDefinition, getFormData, updateFormData } from "./formData";
import { mapCompanyDataToForm, initializeOpenAI } from "./services/formMappingService";
import { fillPdf, storePdfTemporarily, initializeAnvil } from './services/anvilService';

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
  
  // Get detailed company information
  app.get("/api/companies/:id/details", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      // First check if the company exists in our database
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Fetch detailed information from the external API
      const companyDetails = await storage.getCompanyDetailedInfo(id);
      
      res.json(companyDetails);
    } catch (error) {
      console.error(`Error fetching detailed info for company ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch company details" });
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

  // Get form definition for a specific form type
  app.get('/api/form-definitions/:formType', requireAuth, async (req, res) => {
    try {
      const formType = req.params.formType;
      
      if (!formType) {
        return res.status(400).json({ message: 'Form type is required' });
      }
      
      const formDefinition = await getFormDefinition(formType);
      res.json(formDefinition);
    } catch (error) {
      console.error(`Error fetching ${req.params.formType} form definition:`, error);
      res.status(500).json({ message: `Failed to fetch form definition` });
    }
  });

  // Get form data for a specific form type
  app.get('/api/form-data/:formType', requireAuth, async (req, res) => {
    try {
      const formType = req.params.formType;
      
      if (!formType) {
        return res.status(400).json({ message: 'Form type is required' });
      }
      
      const formData = await getFormData(formType);
      res.json(formData);
    } catch (error) {
      console.error(`Error fetching ${req.params.formType} form data:`, error);
      res.status(500).json({ message: `Failed to fetch form data` });
    }
  });

  // Update form data for a specific form type
  app.patch('/api/form-data/:formType', requireAuth, async (req, res) => {
    try {
      const formType = req.params.formType;
      const updates = req.body;
      
      if (!formType) {
        return res.status(400).json({ message: 'Form type is required' });
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }
      
      const updatedFormData = await updateFormData(formType, updates);
      res.json(updatedFormData);
    } catch (error) {
      console.error(`Error updating ${req.params.formType} form data:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: `Failed to update form data` });
    }
  });

  // Map company data to form fields using OpenAI
  app.post('/api/companies/:id/map-to-form/:formType', requireAuth, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const formType = req.params.formType;
      const { apiKey } = req.body;
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      if (!formType) {
        return res.status(400).json({ message: 'Form type is required' });
      }
      
      // Initialize OpenAI with provided API key if any
      if (apiKey) {
        initializeOpenAI(apiKey);
      } else {
        // Use environment variable if available
        initializeOpenAI(process.env.OPENAI_API_KEY || '');
      }
      
      // Get company details
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // Fetch detailed company information from external API
      const companyDetails = await storage.getCompanyDetailedInfo(companyId);
      
      // Get form definition for the specified form type
      const formDefinition = await getFormDefinition(formType);
      
      // Map company data to form fields
      const mappedFormData = await mapCompanyDataToForm(companyDetails, formDefinition);
      
      // Update the form data with the mapped values
      const updatedFormData = await updateFormData(formType, mappedFormData);
      
      res.json({
        message: 'Company data successfully mapped to form fields',
        mappedFields: Object.keys(mappedFormData),
        formData: updatedFormData
      });
      
    } catch (error) {
      console.error(`Error mapping company data to form:`, error);
      res.status(500).json({ 
        message: 'Failed to map company data to form fields',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Fill PDF with Anvil API
  app.post('/api/fill-pdf', requireAuth, async (req, res) => {
    try {
      const { formData } = req.body;
      
      if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({ message: 'No form data provided' });
      }
      
      // Verify required fields for the ACORD 125 form
      if (!formData.applicantName?.firstName || !formData.applicantName?.lastName) {
        return res.status(400).json({ message: 'Applicant name is required' });
      }
      
      // Check if Anvil API key is configured
      if (process.env.ANVIL_API_KEY) {
        initializeAnvil(process.env.ANVIL_API_KEY);
      } else {
        return res.status(400).json({ 
          message: 'Anvil API key not configured. Please add ANVIL_API_KEY to environment variables.' 
        });
      }
      
      // Fill the PDF form with Anvil
      // The data is already in the expected format from the client
      console.log('Received data structure for Anvil PDF filling:', Object.keys(formData));
      
      const filledPdf = await fillPdf(formData);
      
      // Store the filled PDF temporarily
      const pdfUrl = storePdfTemporarily(filledPdf);
      
      // Return the URL to the filled PDF
      res.json({
        message: 'PDF filled successfully',
        pdfUrl
      });
    } catch (error) {
      console.error('Error filling PDF with Anvil:', error);
      res.status(500).json({ 
        message: 'Failed to fill PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
