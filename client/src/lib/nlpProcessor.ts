import { fieldDefinitions } from "./fieldDefinitions";

type CommandResult = {
  field: string;
  value: string;
} | null;

/**
 * Process a natural language command to extract field and value
 * @param command The natural language command to process
 * @returns Object with field and value, or null if command cannot be understood
 */
export function processCommand(command: string): CommandResult {
  command = command.toLowerCase().trim();
  
  // Common action phrases that indicate a field update
  const actionPhrases = [
    "update", "change", "set", "modify", "make", "put"
  ];
  
  let actionFound = false;
  for (const action of actionPhrases) {
    if (command.includes(action)) {
      actionFound = true;
      break;
    }
  }
  
  if (!actionFound) {
    console.log("No action phrase found in command");
    return null;
  }
  
  const field = findTargetField(command);
  if (!field) {
    console.log("No field found in command");
    return null;
  }
  
  const value = extractValue(command, field);
  if (!value) {
    console.log("No value found in command");
    return null;
  }
  
  const formattedValue = formatValue(field.id, value);
  
  return {
    field: field.id,
    value: formattedValue
  };
}

/**
 * Find the field that the command is targeting
 */
function findTargetField(command: string) {
  for (const field of fieldDefinitions) {
    // Check for exact field name
    if (command.includes(field.id.toLowerCase())) {
      return field;
    }
    
    // Check for display name
    if (command.includes(field.displayName.toLowerCase())) {
      return field;
    }
    
    // Check for aliases
    if (field.aliases && field.aliases.some(alias => command.includes(alias.toLowerCase()))) {
      return field;
    }
  }
  
  return null;
}

/**
 * Extract the value that should be set for the field
 */
function extractValue(command: string, field: {id: string, displayName: string, aliases?: string[]}): string | null {
  // Look for phrases like "to", "as", "with" followed by the value
  const valueIndicators = ["to", "as", "with", "is"];
  
  for (const indicator of valueIndicators) {
    const indicatorPattern = new RegExp(`(${indicator}\\s+)(.+)`, 'i');
    const match = command.match(indicatorPattern);
    
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  
  // Simple pattern matching - look for the field name and take what comes after it
  const fieldPattern = new RegExp(`(${field.id}|${field.displayName.toLowerCase()})(\\s+)(.+)`, 'i');
  const match = command.match(fieldPattern);
  
  if (match && match[3]) {
    return match[3].trim();
  }
  
  return null;
}

/**
 * Format the extracted value based on the field type
 */
function formatValue(fieldId: string, value: string): string {
  // Remove any punctuation at the end
  value = value.replace(/[.!?]$/, '');
  
  // Format based on field type
  switch (fieldId) {
    case 'email':
      // Ensure email has proper formatting
      value = value.replace(/\s+at\s+/g, '@');
      value = value.replace(/\s+dot\s+/g, '.');
      break;
      
    case 'phone':
      // Format phone numbers consistently
      value = value.replace(/[^\d]/g, '');
      if (value.length === 10) {
        value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
      }
      break;
      
    case 'startDate':
    case 'endDate':
      // Try to convert spoken date to ISO format
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          value = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Keep original value if date parsing fails
      }
      break;
      
    case 'coverageAmount':
    case 'deductible':
    case 'monthlyPremium':
      // Format currency values
      value = value.replace(/dollars/g, '');
      // Add dollar sign if not present
      if (!value.includes('$')) {
        value = '$' + value;
      }
      break;
  }
  
  return value;
}