import { users, type User, type InsertUser, type FormData, type FormDataType } from "@shared/schema";
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
  
  // Form data methods
  initializeFormData(): Promise<FormDataType>;
  getFormData(): Promise<FormDataType>;
  updateFormData(updates: Partial<FormDataType>): Promise<FormDataType>;
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
}

export const storage = new MemStorage();
