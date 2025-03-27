import { z } from "zod";

/**
 * ACORD 125 Commercial Insurance Application Form Schema
 * This defines the structure and validation for the ACORD 125 form
 */

// Definition for basic field types with common properties
const baseFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  label: z.string(),
  description: z.string().optional(),
  conditionalOn: z.string().optional(),
  conditions: z.array(z.string()).optional(),
});

// Field type variations based on input type
const textFieldSchema = baseFieldSchema.extend({
  type: z.literal("text"),
});

const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal("number"),
  unit: z.string().optional(),
});

const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal("date"),
});

const timeFieldSchema = baseFieldSchema.extend({
  type: z.literal("time"),
});

const phoneFieldSchema = baseFieldSchema.extend({
  type: z.literal("phone"),
});

const emailFieldSchema = baseFieldSchema.extend({
  type: z.literal("email"),
});

const urlFieldSchema = baseFieldSchema.extend({
  type: z.literal("url"),
});

const currencyFieldSchema = baseFieldSchema.extend({
  type: z.literal("currency"),
});

const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal("textarea"),
});

const radioFieldSchema = baseFieldSchema.extend({
  type: z.literal("radio"),
  options: z.array(z.string()),
  conditionalOn: z.string().optional(),
  conditions: z.array(z.string()).optional(),
});

const checkboxFieldSchema = baseFieldSchema.extend({
  type: z.literal("checkbox"),
  options: z.array(z.string()).optional(),
  premium: z.literal("currency").optional(),
  conditionalOn: z.string().optional(),
  conditions: z.array(z.string()).optional(),
});

// Combine all field types
export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  phoneFieldSchema,
  emailFieldSchema,
  urlFieldSchema,
  currencyFieldSchema,
  textareaFieldSchema,
  radioFieldSchema,
  checkboxFieldSchema,
]);

// Section schema that contains multiple fields
export const sectionSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string().optional(),
  repeating: z.boolean().optional().default(false),
  fields: z.array(fieldSchema),
});

// Overall form schema
export const formSchema = z.object({
  formTitle: z.string(),
  formSubtitle: z.string().optional(),
  formNumber: z.string(),
  formDescription: z.string().optional(),
  sections: z.array(sectionSchema),
});

// Type definitions
export type Field = z.infer<typeof fieldSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type FormDefinition = z.infer<typeof formSchema>;

// Utility to generate a data schema from the form definition
export function generateDataSchema(formDefinition: FormDefinition) {
  const schemaFields: Record<string, z.ZodType<any>> = {};
  
  // Process all sections and their fields
  formDefinition.sections.forEach(section => {
    section.fields.forEach(field => {
      // Create appropriate zod schema based on field type
      let fieldSchema: z.ZodType<any>;
      
      switch (field.type) {
        case "number":
          fieldSchema = z.string(); // Store as string for consistent handling, can be parsed when needed
          break;
        case "date":
          fieldSchema = z.string();
          break;
        case "time":
          fieldSchema = z.string();
          break;
        case "phone":
          fieldSchema = z.string();
          break;
        case "email":
          fieldSchema = z.string().email();
          break;
        case "url":
          fieldSchema = z.string().url();
          break;
        case "currency":
          fieldSchema = z.string();
          break;
        case "radio":
          if (field.options && field.options.length > 0) {
            fieldSchema = z.enum([field.options[0], ...field.options.slice(1)] as [string, ...string[]]).optional();
          } else {
            fieldSchema = z.string().optional();
          }
          break;
        case "checkbox":
          if (field.options && field.options.length > 0) {
            // For multi-select checkboxes, store as array of selected options
            fieldSchema = z.array(z.string()).optional();
          } else {
            // For single checkbox, store as boolean
            fieldSchema = z.boolean().optional();
          }
          break;
        case "textarea":
        case "text":
        default:
          fieldSchema = z.string().optional();
          break;
      }
      
      // Add to schema fields
      schemaFields[field.name] = fieldSchema;
    });
  });
  
  // Create and return the dynamic schema
  return z.object(schemaFields);
}

// Export type for the form data
export type FormData<T extends FormDefinition> = z.infer<ReturnType<typeof generateDataSchema>>;