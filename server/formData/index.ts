import { storage } from '../storage';
import { getAcord125Definition } from '../formDefinitions/acord125';

/**
 * Get the form definition for a specific form type
 * @param formType The type of form to retrieve (e.g., 'acord125')
 * @returns The form definition
 */
export async function getFormDefinition(formType: string) {
  switch (formType) {
    case 'acord125':
      return await getAcord125Definition();
    default:
      throw new Error(`Form type '${formType}' not supported`);
  }
}

/**
 * Get form data for a specific form type
 * @param formType The type of form to retrieve data for
 * @returns The form data
 */
export async function getFormData(formType: string) {
  switch (formType) {
    case 'acord125':
      return await storage.getAcord125FormData();
    default:
      throw new Error(`Form type '${formType}' not supported`);
  }
}

/**
 * Update form data for a specific form type
 * @param formType The type of form to update
 * @param updates The partial form data updates
 * @returns The updated form data
 */
export async function updateFormData(formType: string, updates: Record<string, any>) {
  switch (formType) {
    case 'acord125':
      return await storage.updateAcord125FormData(updates);
    default:
      throw new Error(`Form type '${formType}' not supported`);
  }
}