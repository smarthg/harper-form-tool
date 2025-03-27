import { z } from "zod";

/**
 * ACORD 126 Commercial General Liability Section Form Schema
 * This defines the structure and validation for the ACORD 126 form
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
});

const selectFieldSchema = baseFieldSchema.extend({
  type: z.literal("select"),
  options: z.array(z.string()),
});

const multiselectFieldSchema = baseFieldSchema.extend({
  type: z.literal("multiselect"),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
});

const tableFieldSchema = baseFieldSchema.extend({
  type: z.literal("table"),
  columns: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
    })
  ),
});

// Combine all field types into a discriminated union
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
  selectFieldSchema,
  multiselectFieldSchema,
  tableFieldSchema,
]);

// Define section schema
export const sectionSchema = z.object({
  name: z.string(),
  title: z.string(),
  repeating: z.boolean().optional().default(false),
  fields: z.array(fieldSchema),
});

// Define form schema
export const formSchema = z.object({
  formTitle: z.string(),
  formSubtitle: z.string().optional(),
  formNumber: z.string(), // Make formNumber required
  formDescription: z.string().optional(),
  sections: z.array(sectionSchema),
});

// Exports
export type Field = z.infer<typeof fieldSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type FormDefinition = z.infer<typeof formSchema>;

// Helper function to generate a Zod schema for form data based on the form definition
export function generateDataSchema(formDefinition: FormDefinition) {
  const shape: Record<string, any> = {};

  // Build shape object for each field in each section
  formDefinition.sections.forEach((section) => {
    section.fields.forEach((field) => {
      const fieldName = field.name;
      
      // Define the appropriate Zod schema based on field type
      switch (field.type) {
        case "text":
        case "textarea":
        case "phone":
        case "email":
        case "url":
          shape[fieldName] = z.string().optional();
          break;
        case "number":
          shape[fieldName] = z.string().optional(); // Using string to accommodate various number formats
          break;
        case "currency":
          shape[fieldName] = z.string().optional(); // Using string to accommodate currency formats
          break;
        case "date":
        case "time":
          shape[fieldName] = z.string().optional();
          break;
        case "radio":
          shape[fieldName] = z.string().optional();
          break;
        case "checkbox":
          if ('options' in field && field.options) {
            // If options are provided, it's a multi-checkbox
            shape[fieldName] = z.array(z.string()).optional();
          } else {
            // Single checkbox (boolean)
            shape[fieldName] = z.boolean().optional();
          }
          break;
        case "select":
          shape[fieldName] = z.string().optional();
          break;
        case "multiselect":
          shape[fieldName] = z.array(z.string()).optional();
          break;
        case "table":
          shape[fieldName] = z.array(
            z.record(z.string(), z.any())
          ).optional();
          break;
        default:
          // Handle unknown field types
          shape[fieldName] = z.any().optional();
      }
    });
  });

  return z.object(shape);
}

export type FormData<T extends FormDefinition> = z.infer<ReturnType<typeof generateDataSchema>>;