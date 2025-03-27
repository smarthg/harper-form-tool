import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formDataSchema, companySchema } from "@shared/schema";
import { z } from "zod";
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
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
      
      // Check if Anvil API key is configured
      if (process.env.ANVIL_API_KEY) {
        initializeAnvil(process.env.ANVIL_API_KEY);
      } else {
        return res.status(400).json({ 
          message: 'Anvil API key not configured. Please add ANVIL_API_KEY to environment variables.' 
        });
      }
      
      // Pass the already formatted data directly to Anvil
      // No need to transform it again since the client-side already formatted it
      console.log('Received data for Anvil PDF filling:', 
        formData.title ? 'Pre-formatted' : 'Raw form data');
      
      // If client has already formatted it, use it directly
      if (formData.title && formData.data) {
        console.log('Using pre-formatted Anvil data');
        console.log('Top-level keys:', Object.keys(formData));
        console.log('Data keys:', Object.keys(formData.data));
        
        // Use the data directly as it's already in the correct format
        const filledPdf = await fillPdf(formData);
        
        // Store the filled PDF temporarily
        const pdfUrl = storePdfTemporarily(filledPdf);
        
        // Return the URL to the filled PDF
        return res.json({
          message: 'PDF filled successfully using client formatting',
          pdfUrl
        });
      } else {
        // Otherwise use server-side formatting (legacy support)
        console.log('Using server-side formatting');
        const filledPdf = await fillPdf(formData);
        
        // Store the filled PDF temporarily
        const pdfUrl = storePdfTemporarily(filledPdf);
        
        // Return the URL to the filled PDF
        return res.json({
          message: 'PDF filled successfully using server formatting',
          pdfUrl
        });
      }
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
