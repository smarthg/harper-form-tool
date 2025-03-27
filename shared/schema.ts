import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const formData = pgTable("form_data", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  policyType: text("policy_type").notNull(),
  policyNumber: text("policy_number").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  coverageAmount: text("coverage_amount").notNull(),
  deductible: text("deductible").notNull(),
  coverageType: text("coverage_type").notNull(),
  monthlyPremium: text("monthly_premium").notNull(),
  companyId: integer("company_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
});

export const insertFormDataSchema = createInsertSchema(formData).omit({
  id: true,
});

export const formDataSchema = z.object({
  // Basic form fields
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  policyType: z.string(),
  policyNumber: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  coverageAmount: z.string(),
  deductible: z.string(),
  coverageType: z.string(),
  monthlyPremium: z.string(),
  companyId: z.number().optional(),
  
  // ACORD 125 specific fields
  // Agency information
  agency: z.string().optional(),
  contactName: z.string().optional(),
  fax: z.string().optional(),
  agencyCode: z.string().optional(),
  agencySubcode: z.string().optional(),
  agencyCustomerId: z.string().optional(),
  
  // Carrier information
  carrier: z.string().optional(),
  naicCode: z.string().optional(),
  
  // Insured information
  insuredCompanyName: z.string().optional(),
  insuredAddress: z.string().optional(),
  insuredCity: z.string().optional(),
  insuredState: z.string().optional(),
  insuredZip: z.string().optional(),
  insuredFein: z.string().optional(),
  insuredPhone: z.string().optional(),
  insuredWebsite: z.string().optional(),
  
  // Business type
  businessType: z.enum([
    'corporation', 
    'individual', 
    'partnership', 
    'jointVenture', 
    'llc', 
    'trust', 
    'nonProfit', 
    'subchapterSCorp'
  ]).optional(),
  
  // Premises information
  locationNumber: z.string().optional(),
  locationStreet: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCounty: z.string().optional(),
  locationZip: z.string().optional(),
  fullTimeEmployees: z.string().optional(),
  partTimeEmployees: z.string().optional(),
  annualRevenue: z.string().optional(),
  occupiedArea: z.string().optional(),
  totalBuildingArea: z.string().optional(),
  
  // Nature of business
  businessNature: z.enum([
    'apartments', 
    'contractor', 
    'manufacturing', 
    'office', 
    'retail', 
    'wholesale'
  ]).optional(),
  businessStartDate: z.string().optional(),
  
  // Description of operations
  operationsDescription: z.string().optional(),
});

export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertFormData = z.infer<typeof insertFormDataSchema>;
export type FormData = typeof formData.$inferSelect;
export type FormDataType = z.infer<typeof formDataSchema>;
