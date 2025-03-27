// Field definitions for NLP recognition
export const fieldDefinitions = [
  { 
    id: 'firstName', 
    aliases: ['first name', 'firstname', 'given name'],
    type: 'text'
  },
  { 
    id: 'lastName', 
    aliases: ['last name', 'lastname', 'surname', 'family name'],
    type: 'text'
  },
  { 
    id: 'email', 
    aliases: ['email', 'email address', 'e-mail'],
    type: 'email'
  },
  { 
    id: 'phone', 
    aliases: ['phone', 'phone number', 'telephone', 'mobile', 'cell'],
    type: 'tel'
  },
  { 
    id: 'policyType', 
    aliases: ['policy type', 'insurance type', 'type of policy', 'type of insurance'],
    type: 'select',
    options: ['home', 'auto', 'life', 'health']
  },
  { 
    id: 'policyNumber', 
    aliases: ['policy number', 'policy #', 'policy id', 'policy identifier'],
    type: 'text'
  },
  { 
    id: 'startDate', 
    aliases: ['start date', 'starting date', 'policy start', 'effective date'],
    type: 'date'
  },
  { 
    id: 'endDate', 
    aliases: ['end date', 'ending date', 'policy end', 'expiration date'],
    type: 'date'
  },
  { 
    id: 'coverageAmount', 
    aliases: ['coverage amount', 'coverage', 'coverage limit', 'coverage value'],
    type: 'currency'
  },
  { 
    id: 'deductible', 
    aliases: ['deductible', 'deductible amount'],
    type: 'currency'
  },
  { 
    id: 'coverageType', 
    aliases: ['coverage type', 'type of coverage'],
    type: 'select',
    options: ['comprehensive', 'collision', 'liability', 'uninsured']
  },
  { 
    id: 'monthlyPremium', 
    aliases: ['monthly premium', 'premium', 'monthly payment', 'payment'],
    type: 'currency'
  }
];
