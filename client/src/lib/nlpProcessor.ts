import { fieldDefinitions } from './fieldDefinitions';

// Command verbs that indicate a change request
const commandVerbs = ['change', 'update', 'set', 'modify', 'make', 'please', 'can you'];

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
  const normalizedCommand = command.toLowerCase().trim();
  
  // Try to find a matching field
  const targetField = findTargetField(normalizedCommand);
  if (!targetField) return null;
  
  // Extract the value for the field
  const value = extractValue(normalizedCommand, targetField);
  if (!value) return null;
  
  return {
    field: targetField.id,
    value: formatValue(targetField.id, value)
  };
}

/**
 * Find the field that the command is targeting
 */
function findTargetField(command: string) {
  // Look for field names in the command
  for (const field of fieldDefinitions) {
    const allNames = [field.id, ...field.aliases];
    
    for (const name of allNames) {
      if (command.includes(name.toLowerCase())) {
        return field;
      }
    }
  }
  
  return null;
}

/**
 * Extract the value that should be set for the field
 */
function extractValue(command: string, field: typeof fieldDefinitions[0]): string | null {
  // Check common patterns like "to X" or "as X"
  const prepositions = ['to', 'as', 'with', 'for'];
  
  const allFieldTerms = [field.id, ...field.aliases];
  
  for (const fieldTerm of allFieldTerms) {
    if (command.includes(fieldTerm)) {
      for (const prep of prepositions) {
        const regex = new RegExp(`${fieldTerm}\\s+(?:${prep}\\s+)(.+?)(?:\\s|$|\\.|,)`, 'i');
        const match = command.match(regex);
        
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      // Try another pattern: "fieldName X"
      const afterFieldRegex = new RegExp(`${fieldTerm}\\s+(.+?)(?:\\s|$|\\.|,)`, 'i');
      const afterMatch = command.match(afterFieldRegex);
      
      if (afterMatch && afterMatch[1]) {
        const value = afterMatch[1].trim();
        if (!commandVerbs.some(v => value.startsWith(v))) {
          return value;
        }
      }
    }
  }
  
  // Look for patterns like "change X to Y" or "set X to Y"
  for (const fieldTerm of allFieldTerms) {
    for (const prep of prepositions) {
      const regex = new RegExp(`(?:${commandVerbs.join('|')})\\s+(?:.*?\\s+)?(?:${fieldTerm})\\s+(?:${prep}\\s+)?(.+?)(?:\\s|$|\\.|,)`, 'i');
      const match = command.match(regex);
      
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  // Try to find value after "to" if the field is mentioned before
  if (command.includes(field.id) || field.aliases.some(alias => command.includes(alias))) {
    const toIndex = command.indexOf(" to ");
    if (toIndex > 0) {
      return command.substring(toIndex + 4).trim();
    }
  }
  
  return null;
}

/**
 * Format the extracted value based on the field type
 */
function formatValue(fieldId: string, value: string): string {
  // Strip any currency symbols
  if (fieldId === 'coverageAmount' || fieldId === 'deductible' || fieldId === 'monthlyPremium') {
    return value.replace(/^\$/, '').trim();
  }
  
  // Handle policy type special case
  if (fieldId === 'policyType') {
    const policyTypes: Record<string, string> = {
      'home': 'home',
      'home insurance': 'home',
      'house': 'home',
      'auto': 'auto',
      'car': 'auto',
      'automobile': 'auto', 
      'auto insurance': 'auto',
      'car insurance': 'auto',
      'life': 'life',
      'life insurance': 'life',
      'health': 'health',
      'health insurance': 'health',
      'medical': 'health',
      'medical insurance': 'health'
    };
    
    const normalizedValue = value.toLowerCase();
    return policyTypes[normalizedValue] || value;
  }
  
  // Handle coverage type special case
  if (fieldId === 'coverageType') {
    const coverageTypes: Record<string, string> = {
      'comprehensive': 'comprehensive',
      'collision': 'collision',
      'liability': 'liability',
      'uninsured': 'uninsured',
      'uninsured motorist': 'uninsured'
    };
    
    const normalizedValue = value.toLowerCase();
    return coverageTypes[normalizedValue] || value;
  }
  
  return value;
}
