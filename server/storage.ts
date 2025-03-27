import { users, type User, type InsertUser, type FormData, type FormDataType, type Company, type InsertCompany } from "@shared/schema";
import { formDataSchema } from "@shared/schema";

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
  
  // ACORD 126 form data methods
  initializeAcord126FormData(): Promise<Record<string, any>>;
  getAcord126FormData(): Promise<Record<string, any>>;
  updateAcord126FormData(updates: Record<string, any>): Promise<Record<string, any>>;
  
  // External API methods
  fetchCompaniesFromApi(): Promise<Company[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private formData: FormDataType;
  private acord125FormData: Record<string, any> = {};
  private acord126FormData: Record<string, any> = {};
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
      const payload = { company_id: companyId };
      console.log('Request payload:', payload);
      
      const response = await fetch('https://tatch.retool.com/url/company-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workflow-Api-Key': 'retool_wk_399d5bbb7fa84a4887466b87856d51a8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
        const errorText = await response.text();
        console.error(`Error response body: ${errorText}`);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', JSON.stringify(data).slice(0, 200) + '...');
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
   * Initialize ACORD 126 form data with defaults
   */
  async initializeAcord126FormData(): Promise<Record<string, any>> {
    // Initialize with empty data or defaults if needed
    this.acord126FormData = {
      agencyCustomerId: "",
      effectiveDate: "",
      agency: "",
      carrier: "",
      naicCode: "",
      policyNumber: "",
      applicantFirstNamedInsured: "",
      coverageType: "",
      claimsOccurrence: "",
      generalAggregate: "",
      limitAppliesPer: [],
      productsCompletedOperationsAggregate: "",
      personalAdvertisingInjury: "",
      eachOccurrence: "",
      damageToRentedPremises: "",
      medicalExpense: "",
      employeeBenefits: "",
      propertyDamage: "",
      bodilyInjury: "",
      deductibleType: "",
      premiseOperations: "",
      products: "",
      other: "",
      total: "",
      otherCoverages: "",
      umUimCoverage: "",
      medicalPaymentsCoverage: "",
      classificationDescription: "",
      ratingPremiumBasis: [],
      proposedRetroactiveDate: "",
      entryDateUninterruptedClaimsMadeCoverage: "",
      excludedUninsuredSelfInsured: "",
      tailCoveragePurchased: "",
      deductiblePerClaim: "",
      numberOfEmployees: "",
      employeesCoveredByBenefitsPlans: "",
      retroactiveDate: "",
      drawPlansDesigns: "",
      operationsIncludeBlasting: "",
      operationsIncludeExcavation: "",
      subcontractorsCoveragesLessThanYours: "",
      subcontractorsWithoutCertificate: "",
      leaseEquipmentToOthers: ""
    };
    
    return this.acord126FormData;
  }
  
  /**
   * Get ACORD 126 form data
   */
  async getAcord126FormData(): Promise<Record<string, any>> {
    // Initialize if not already set
    if (Object.keys(this.acord126FormData).length === 0) {
      await this.initializeAcord126FormData();
    }
    
    return this.acord126FormData;
  }
  
  /**
   * Update ACORD 126 form data
   */
  async updateAcord126FormData(updates: Record<string, any>): Promise<Record<string, any>> {
    // Initialize if not already set
    if (Object.keys(this.acord126FormData).length === 0) {
      await this.initializeAcord126FormData();
    }
    
    // Apply updates
    this.acord126FormData = {
      ...this.acord126FormData,
      ...updates
    };
    
    return this.acord126FormData;
  }

  /**
   * Extract form data from an uploaded PDF file using LlamaParse
   * @param fileBuffer The buffer containing the PDF file
   * @returns A partial FormDataType object with extracted data
   */
  
  /**
   * Transpose extracted form data to a complete form
   * @param extractedData The partial form data extracted from the uploaded form
   * @returns A complete FormDataType object with extracted data merged
   */
}

export const storage = new MemStorage();
