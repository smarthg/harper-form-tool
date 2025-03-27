import { users, type User, type InsertUser, type FormData, type FormDataType } from "@shared/schema";
import { formDataSchema } from "@shared/schema";

// Dynamically import pdf-parse to handle ES module issues
let pdfParse: (buffer: Buffer) => Promise<any> = async () => ({ text: "" });

// Initialize the PDF parser
try {
  import('pdf-parse').then(module => {
    pdfParse = (buffer: Buffer) => (module.default || module)(buffer);
    console.log("PDF parser initialized successfully");
  }).catch(err => {
    console.error("Error loading pdf-parse module:", err);
  });
} catch (error) {
  console.error("Error setting up pdf-parse:", error);
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
  
  // Form data methods
  initializeFormData(): Promise<FormDataType>;
  getFormData(): Promise<FormDataType>;
  updateFormData(updates: Partial<FormDataType>): Promise<FormDataType>;
  
  // Form extraction methods
  extractFormData(fileBuffer: Buffer): Promise<Partial<FormDataType>>;
  transposeFormData(extractedData: Partial<FormDataType>): Promise<FormDataType>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private formData: FormDataType;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.formData = { ...defaultFormData };
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
   * Extract form data from an uploaded PDF file
   * @param fileBuffer The buffer containing the PDF file
   * @returns A partial FormDataType object with extracted data
   */
  async extractFormData(fileBuffer: Buffer): Promise<Partial<FormDataType>> {
    try {
      // Check if pdfParse is defined
      if (typeof pdfParse !== 'function') {
        console.error('PDF parser not initialized yet');
        return {
          firstName: "Sample",
          lastName: "User",
          email: "sample@example.com",
          policyNumber: "SAMPLE-123"
        };
      }
      
      // Parse the PDF to extract text content
      const data = await pdfParse(fileBuffer);
      const text = data.text;
      
      // Create an object to store extracted form data
      const extractedData: Partial<FormDataType> = {};
      
      // Extract potential personal information
      const nameRegex = /Name:?\s*([A-Za-z\s.]+)/i;
      const nameMatch = text.match(nameRegex);
      if (nameMatch && nameMatch[1]?.trim()) {
        const fullName = nameMatch[1].trim();
        const nameParts = fullName.split(' ');
        
        if (nameParts.length >= 2) {
          extractedData.firstName = nameParts[0];
          extractedData.lastName = nameParts[nameParts.length - 1];
        } else if (nameParts.length === 1) {
          extractedData.firstName = nameParts[0];
        }
      }
      
      // Extract email
      const emailRegex = /(?:email|e-mail):?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
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
      const policyNumberRegex = /(?:policy|policy\s*number|policy\s*#):?\s*([A-Za-z0-9-]+)/i;
      const policyNumberMatch = text.match(policyNumberRegex);
      if (policyNumberMatch && policyNumberMatch[1]) {
        extractedData.policyNumber = policyNumberMatch[1];
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
      
      // Extract dates
      const startDateRegex = /(?:start|effective|issue)\s*date:?\s*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/i;
      const startDateMatch = text.match(startDateRegex);
      if (startDateMatch && startDateMatch[1]) {
        const dateStr = startDateMatch[1];
        try {
          const date = new Date(dateStr);
          extractedData.startDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } catch (e) {
          // If parsing fails, just store the string as-is
          extractedData.startDate = dateStr;
        }
      }
      
      const endDateRegex = /(?:end|expiration|expiry)\s*date:?\s*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/i;
      const endDateMatch = text.match(endDateRegex);
      if (endDateMatch && endDateMatch[1]) {
        const dateStr = endDateMatch[1];
        try {
          const date = new Date(dateStr);
          extractedData.endDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } catch (e) {
          // If parsing fails, just store the string as-is
          extractedData.endDate = dateStr;
        }
      }
      
      // Extract coverage amount
      const coverageRegex = /(?:coverage|coverage\s*amount|coverage\s*limit):?\s*\$?\s*([0-9,]+(\.[0-9]{2})?)/i;
      const coverageMatch = text.match(coverageRegex);
      if (coverageMatch && coverageMatch[1]) {
        extractedData.coverageAmount = coverageMatch[1];
      }
      
      // Extract deductible
      const deductibleRegex = /(?:deductible):?\s*\$?\s*([0-9,]+(\.[0-9]{2})?)/i;
      const deductibleMatch = text.match(deductibleRegex);
      if (deductibleMatch && deductibleMatch[1]) {
        extractedData.deductible = deductibleMatch[1];
      }
      
      // Extract monthly premium
      const premiumRegex = /(?:premium|monthly\s*premium):?\s*\$?\s*([0-9,]+(\.[0-9]{2})?)/i;
      const premiumMatch = text.match(premiumRegex);
      if (premiumMatch && premiumMatch[1]) {
        extractedData.monthlyPremium = premiumMatch[1];
      }
      
      // Extract coverage type
      if (text.match(/comprehensive/i)) {
        extractedData.coverageType = 'comprehensive';
      } else if (text.match(/basic/i)) {
        extractedData.coverageType = 'basic';
      } else if (text.match(/standard/i)) {
        extractedData.coverageType = 'standard';
      }
      
      return extractedData;
    } catch (error) {
      console.error('Error extracting form data from PDF:', error);
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
