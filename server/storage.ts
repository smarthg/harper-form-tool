import { users, type User, type InsertUser, type FormData, type FormDataType, type Company, type InsertCompany } from "@shared/schema";
import { formDataSchema } from "@shared/schema";
import { LlamaParse } from 'llama-parse';

// Initialize LlamaParse with API key
const llamaParser = new LlamaParse({
  apiKey: process.env.LLAMAPARSE_API_KEY || 'llx-JgTJrXV8H3AyM2ta1BUAMAPhqhPQzizgDc9oMw0OkYXJBH6E'
});
console.log("LlamaParse client initialized successfully");

// Dynamically import pdf-parse as a fallback
let pdfParse: (buffer: Buffer) => Promise<any> = async () => ({ text: "" });

// Initialize the fallback PDF parser
try {
  import('pdf-parse').then(module => {
    pdfParse = (buffer: Buffer) => (module.default || module)(buffer);
    console.log("Fallback PDF parser initialized successfully");
  }).catch(err => {
    console.error("Error loading fallback pdf-parse module:", err);
  });
} catch (error) {
  console.error("Error setting up fallback pdf-parse:", error);
}

// Initial form data
const defaultFormData: FormDataType = {
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  phone: "(555) 123-4567",
  policyType: "auto",
  policyNumber: "POL-123456789",
  startDate: "2023-01-15",
  endDate: "2024-01-15",
  coverageAmount: "100,000",
  deductible: "1,000",
  coverageType: "comprehensive",
  monthlyPremium: "150"
};

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyDetailedInfo(companyId: number): Promise<any>;
  
  // Form data methods
  initializeFormData(): Promise<FormDataType>;
  getFormData(): Promise<FormDataType>;
  updateFormData(updates: Partial<FormDataType>): Promise<FormDataType>;
  
  // ACORD 125 form data methods
  initializeAcord125FormData(): Promise<Record<string, any>>;
  getAcord125FormData(): Promise<Record<string, any>>;
  updateAcord125FormData(updates: Record<string, any>): Promise<Record<string, any>>;
  
  // Form extraction methods
  extractFormData(fileBuffer: Buffer): Promise<Partial<FormDataType>>;
  transposeFormData(extractedData: Partial<FormDataType>): Promise<FormDataType>;
  
  // External API methods
  fetchCompaniesFromApi(): Promise<Company[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private formData: FormDataType;
  private acord125FormData: Record<string, any> = {};
  currentId: number;
  currentCompanyId: number;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.currentId = 1;
    this.currentCompanyId = 1;
    this.formData = { ...defaultFormData };
    this.acord125FormData = {}; // Initialize empty ACORD 125 form data
    
    // We'll fetch companies from the API instead of using static sample data
  }
  
  /**
   * Initialize ACORD 125 form data with defaults
   */
  async initializeAcord125FormData(): Promise<Record<string, any>> {
    // Initialize with empty data or defaults if needed
    this.acord125FormData = {
      agency: "",
      contactName: "",
      phone: "",
      fax: "",
      email: "",
      code: "",
      subcode: "",
      agencyCustomerId: "",
      namedInsured: "",
      glCode: "",
      sic: "",
      naics: "",
      feinOrSocSec: "",
      businessPhone: "",
      websiteAddress: "",
      businessType: "",
      proposedEffDate: "",
      proposedExpDate: "",
      billingPlan: "",
      paymentPlan: "",
      methodOfPayment: "",
      audit: false,
      deposit: "",
      minimumPremium: "",
      policyPremium: ""
    };
    
    return this.acord125FormData;
  }
  
  /**
   * Get ACORD 125 form data
   */
  async getAcord125FormData(): Promise<Record<string, any>> {
    // Initialize if not already set
    if (Object.keys(this.acord125FormData).length === 0) {
      await this.initializeAcord125FormData();
    }
    
    return this.acord125FormData;
  }
  
  /**
   * Update ACORD 125 form data
   */
  async updateAcord125FormData(updates: Record<string, any>): Promise<Record<string, any>> {
    // Initialize if not already set
    if (Object.keys(this.acord125FormData).length === 0) {
      await this.initializeAcord125FormData();
    }
    
    // Apply updates
    this.acord125FormData = {
      ...this.acord125FormData,
      ...updates
    };
    
    return this.acord125FormData;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCompanies(): Promise<Company[]> {
    // If we don't have any companies yet, try to fetch them
    if (this.companies.size === 0) {
      try {
        await this.fetchCompaniesFromApi();
      } catch (error) {
        console.error("Error fetching companies from API:", error);
      }
    }
    return Array.from(this.companies.values());
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const newCompany: Company = { ...company, id };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  /**
   * Fetch detailed company information from external API
   * @param companyId The ID of the company to fetch details for
   * @returns Detailed company information object
   */
  async getCompanyDetailedInfo(companyId: number): Promise<any> {
    try {
      console.log(`Fetching detailed info for company ID: ${companyId}`);
      const response = await fetch('https://tatch.retool.com/url/company-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workflow-Api-Key': 'retool_wk_399d5bbb7fa84a4887466b87856d51a8'
        },
        body: JSON.stringify({ company_id: companyId })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching detailed info for company ID ${companyId}:`, error);
      throw error;
    }
  }

  async fetchCompaniesFromApi(): Promise<Company[]> {
    try {
      console.log('Fetching companies from external API');
      const response = await fetch('https://tatch.retool.com/url/company-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workflow-Api-Key': 'retool_wk_a6eac56e17da4f889098cf01b70d8a61'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Clear existing companies
        this.companies.clear();
        
        // Store the companies in our map
        data.forEach((item, index) => {
          // Check if the item has company_name as per the API response format
          const company: Company = {
            id: parseInt(item.id) || index + 1, // Use the actual ID from API
            name: item.company_name || (item.name || `Company ${index + 1}`), // Try company_name first
            code: `CODE${index + 1}` // Generate a code if not available
          };
          this.companies.set(company.id, company);
        });

        this.currentCompanyId = this.companies.size + 1;
        
        console.log(`Loaded ${this.companies.size} companies from external API`);
        return Array.from(this.companies.values());
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (error) {
      console.error('Error fetching companies from API:', error);
      throw error;
    }
  }

  async initializeFormData(): Promise<FormDataType> {
    // Initialize with default data if not already set
    this.formData = { ...defaultFormData };
    return this.formData;
  }

  async getFormData(): Promise<FormDataType> {
    return this.formData;
  }

  async updateFormData(updates: Partial<FormDataType>): Promise<FormDataType> {
    // Validate the updates against the schema
    const validatedUpdates = formDataSchema.partial().parse(updates);
    
    // Apply updates
    this.formData = {
      ...this.formData,
      ...validatedUpdates
    };
    
    return this.formData;
  }

  /**
   * Extract form data from an uploaded PDF file using LlamaParse
   * @param fileBuffer The buffer containing the PDF file
   * @returns A partial FormDataType object with extracted data
   */
  async extractFormData(fileBuffer: Buffer): Promise<Partial<FormDataType>> {
    try {
      console.log('Starting PDF extraction with LlamaParse');
      
      // Create a Blob from the buffer
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      
      // Try to use LlamaParse first
      try {
        console.log('Attempting to parse with LlamaParse');
        
        // Convert buffer to base64 for LlamaParse
        const base64Data = fileBuffer.toString('base64');
        
        // Use LlamaParse to extract the PDF content
        const result = await llamaParser.parseFile(blob);
        console.log('LlamaParse result received');
        
        // Extract the text content from the markdown
        const text = result.markdown;
        
        // Create an object to store extracted form data
        const extractedData: Partial<FormDataType> = {};
        
        // Extract structured data using LlamaParse's better parsing
        
        // Attempt to extract first and last name
        const firstNameMatch = text.match(/First\s*Name:?\s*([A-Za-z\s.]+)/i) || 
                              text.match(/Name:?\s*([A-Za-z]+)\s+([A-Za-z\s.]+)/i);
        
        if (firstNameMatch && firstNameMatch[1]?.trim()) {
          extractedData.firstName = firstNameMatch[1].trim();
        }
        
        const lastNameMatch = text.match(/Last\s*Name:?\s*([A-Za-z\s.]+)/i) ||
                             text.match(/Name:?\s*([A-Za-z]+)\s+([A-Za-z\s.]+)/i);
        
        if (lastNameMatch) {
          // If we matched "Name: John Smith", use group 2 for last name
          if (lastNameMatch.length > 2 && lastNameMatch[2]) {
            extractedData.lastName = lastNameMatch[2].trim();
          } 
          // Otherwise use the direct last name match
          else if (lastNameMatch[1]) {
            extractedData.lastName = lastNameMatch[1].trim();
          }
        }
        
        // Fall back to full name parsing if separate fields not found
        if (!extractedData.firstName && !extractedData.lastName) {
          const nameRegex = /Name:?\s*([A-Za-z\s.]+)/i;
          const nameMatch = text.match(nameRegex);
          if (nameMatch && nameMatch[1]?.trim()) {
            const fullName = nameMatch[1].trim();
            const nameParts = fullName.split(' ');
            
            if (nameParts.length >= 2) {
              extractedData.firstName = nameParts[0];
              extractedData.lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
              extractedData.firstName = nameParts[0];
            }
          }
        }
        
        // Extract email - more precise pattern
        const emailRegex = /Email\s*(?:Address)?:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const emailMatch = text.match(emailRegex);
        if (emailMatch && emailMatch[1]) {
          extractedData.email = emailMatch[1];
        }
        
        // Extract phone number
        const phoneRegex = /(?:phone|tel|telephone|mobile):?\s*([()0-9\s-+.]{7,})/i;
        const phoneMatch = text.match(phoneRegex);
        if (phoneMatch && phoneMatch[1]) {
          extractedData.phone = phoneMatch[1].trim();
        }
        
        // Extract policy number with more precise pattern
        const policyNumberRegex = /Policy\s*Number:?\s*([A-Za-z0-9-]+)/i;
        const policyNumberMatch = text.match(policyNumberRegex);
        if (policyNumberMatch && policyNumberMatch[1]) {
          extractedData.policyNumber = policyNumberMatch[1];
        }
        
        // Check for POL prefix patterns if the first pattern doesn't match
        if (!extractedData.policyNumber) {
          const polPrefixRegex = /POL-?([A-Za-z0-9-]+)/i;
          const polPrefixMatch = text.match(polPrefixRegex);
          if (polPrefixMatch) {
            extractedData.policyNumber = polPrefixMatch[0]; // Include the POL prefix
          }
        }
        
        // Extract policy type
        if (text.match(/home\s*insurance|homeowners/i)) {
          extractedData.policyType = 'home';
        } else if (text.match(/auto|car|vehicle\s*insurance/i)) {
          extractedData.policyType = 'auto';
        } else if (text.match(/life\s*insurance/i)) {
          extractedData.policyType = 'life';
        } else if (text.match(/health\s*insurance/i)) {
          extractedData.policyType = 'health';
        }
        
        // Extract dates using the enhanced pattern matching from LlamaParse's better text extraction
        const startDateRegex = /(?:start|effective|issue|policy)\s*date:?\s*([A-Za-z0-9,\s.\/\-]+)/i;
        const startDateMatch = text.match(startDateRegex);
        if (startDateMatch && startDateMatch[1]?.trim()) {
          const dateStr = startDateMatch[1].trim();
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              extractedData.startDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            } else {
              extractedData.startDate = dateStr;
            }
          } catch (e) {
            extractedData.startDate = dateStr;
          }
        }
        
        const endDateRegex = /(?:end|expiration|expiry)\s*date:?\s*([A-Za-z0-9,\s.\/\-]+)/i;
        const endDateMatch = text.match(endDateRegex);
        if (endDateMatch && endDateMatch[1]?.trim()) {
          const dateStr = endDateMatch[1].trim();
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              extractedData.endDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            } else {
              extractedData.endDate = dateStr;
            }
          } catch (e) {
            extractedData.endDate = dateStr;
          }
        }
        
        // Extract financial information
        // Coverage amount
        const coverageRegex = /(?:coverage|coverage\s*amount|coverage\s*limit|total\s*coverage):?\s*\$?\s*([0-9,.]+)/i;
        const coverageMatch = text.match(coverageRegex);
        if (coverageMatch && coverageMatch[1]) {
          extractedData.coverageAmount = coverageMatch[1].replace(/[$,]/g, '');
        }
        
        // Deductible
        const deductibleRegex = /(?:deductible):?\s*\$?\s*([0-9,.]+)/i;
        const deductibleMatch = text.match(deductibleRegex);
        if (deductibleMatch && deductibleMatch[1]) {
          extractedData.deductible = deductibleMatch[1].replace(/[$,]/g, '');
        }
        
        // Monthly premium
        const premiumRegex = /(?:premium|monthly\s*premium):?\s*\$?\s*([0-9,.]+)/i;
        const premiumMatch = text.match(premiumRegex);
        if (premiumMatch && premiumMatch[1]) {
          extractedData.monthlyPremium = premiumMatch[1].replace(/[$,]/g, '');
        }
        
        // Coverage type
        if (text.match(/comprehensive/i)) {
          extractedData.coverageType = 'comprehensive';
        } else if (text.match(/basic/i)) {
          extractedData.coverageType = 'basic';
        } else if (text.match(/standard/i)) {
          extractedData.coverageType = 'standard';
        }
        
        console.log('LlamaParse extraction successful:', Object.keys(extractedData).length, 'fields extracted');
        return extractedData;
        
      } catch (llamaError) {
        console.error('LlamaParse extraction error:', llamaError);
        console.log('Falling back to pdf-parse');
        
        // Fall back to pdf-parse if LlamaParse fails
        if (typeof pdfParse !== 'function') {
          throw new Error('Fallback PDF parser not initialized');
        }
        
        // Use the fallback parser
        const data = await pdfParse(fileBuffer);
        const text = data.text;
        
        // Create an object to store extracted form data
        const extractedData: Partial<FormDataType> = {};
        
        // Extract first name and last name separately
        const firstNameRegex = /First\s*Name:?\s*([A-Za-z\s.]+)/i;
        const lastNameRegex = /Last\s*Name:?\s*([A-Za-z\s.]+)/i;
        
        const firstNameMatch = text.match(firstNameRegex);
        if (firstNameMatch && firstNameMatch[1]?.trim()) {
          extractedData.firstName = firstNameMatch[1].trim();
        }
        
        const lastNameMatch = text.match(lastNameRegex);
        if (lastNameMatch && lastNameMatch[1]?.trim()) {
          extractedData.lastName = lastNameMatch[1].trim();
        }
        
        // Fall back to full name parsing if separate fields not found
        if (!extractedData.firstName && !extractedData.lastName) {
          const nameRegex = /Name:?\s*([A-Za-z\s.]+)/i;
          const nameMatch = text.match(nameRegex);
          if (nameMatch && nameMatch[1]?.trim()) {
            const fullName = nameMatch[1].trim();
            const nameParts = fullName.split(' ');
            
            if (nameParts.length >= 2) {
              extractedData.firstName = nameParts[0];
              extractedData.lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
              extractedData.firstName = nameParts[0];
            }
          }
        }
        
        // Extract email
        const emailRegex = /Email\s*(?:Address)?:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const emailMatch = text.match(emailRegex);
        if (emailMatch && emailMatch[1]) {
          extractedData.email = emailMatch[1];
        }
        
        // Extract phone number
        const phoneRegex = /(?:phone|tel|telephone|mobile):?\s*([()0-9\s-+.]{7,})/i;
        const phoneMatch = text.match(phoneRegex);
        if (phoneMatch && phoneMatch[1]) {
          extractedData.phone = phoneMatch[1].trim();
        }
        
        // Extract policy number
        const policyNumberRegex = /Policy\s*Number:?\s*([A-Za-z0-9-]+)/i;
        const policyNumberMatch = text.match(policyNumberRegex);
        if (policyNumberMatch && policyNumberMatch[1]) {
          extractedData.policyNumber = policyNumberMatch[1];
        }
        
        // Other fields extraction with our existing patterns
        // ...
        
        console.log('Fallback extraction successful:', Object.keys(extractedData).length, 'fields extracted');
        return extractedData;
      }
      
    } catch (error) {
      console.error('Error in extractFormData:', error);
      throw new Error('Failed to extract data from the uploaded insurance form');
    }
  }
  
  /**
   * Transpose extracted form data to a complete form
   * @param extractedData The partial form data extracted from the uploaded form
   * @returns A complete FormDataType object with extracted data merged
   */
  async transposeFormData(extractedData: Partial<FormDataType>): Promise<FormDataType> {
    // Create a copy of the current form data
    const currentFormData = { ...this.formData };
    
    // Merge the extracted data with current data
    // Only overwrite fields that have actually been extracted
    const mergedData = {
      ...currentFormData,
      ...Object.fromEntries(
        Object.entries(extractedData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      )
    };
    
    // Update the stored form data
    this.formData = mergedData;
    
    return this.formData;
  }
}

export const storage = new MemStorage();
