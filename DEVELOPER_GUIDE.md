# Developer Guide: Voice-Controlled Form Editor

This guide provides practical information for developers who want to maintain or extend the Voice-Controlled Form Editor application. It covers common development tasks, code organization, and best practices.

## Development Environment Setup

### Prerequisites
- Node.js 20+ installed
- Git for version control
- A code editor (VS Code recommended)
- Access to Clerk, OpenAI, and LlamaParse accounts (for API keys)

### Local Development

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd voice-controlled-form-editor
npm install
```

2. Set up environment variables by creating a `.env` file:
```
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
OPENAI_API_KEY=your_openai_api_key
LLAMAPARSE_API_KEY=your_llamaparse_api_key
```

3. Start the development server:
```bash
npm run dev
```

4. Access the application at `http://localhost:5000`

## Project Structure Explained

The project follows a modern full-stack JavaScript application structure:

```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── assets/        # Static assets like images
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Base UI components from shadcn
│   │   │   └── ...        # Application-specific components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and services
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
├── server/                # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage implementation
│   └── vite.ts            # Vite integration
├── shared/                # Shared code between client and server
│   └── schema.ts          # Data models and validation schemas
├── public/                # Public static assets
├── .env                   # Environment variables (create locally)
└── package.json           # Project configuration and dependencies
```

## Key Architectural Patterns

### Data Flow

The application follows a unidirectional data flow pattern:

1. UI components trigger actions (voice commands, button clicks, etc.)
2. Actions are processed by handlers that make API requests
3. Server processes requests and updates storage
4. Updated data is returned to the client
5. UI components re-render with the new data

### State Management

- **Server State**: Managed via React Query for fetching, caching, and updating
- **Form State**: Controlled inputs with React state
- **UI State**: Component-local state for UI-specific concerns

### Component Design

Components follow these principles:
- Single responsibility
- Prop-based configuration
- Clear separation of concerns
- Composition over inheritance

## Common Development Tasks

### 1. Adding a New Form Field

To add a new field to the insurance form:

#### Step 1: Update the schema in `shared/schema.ts`

```typescript
// Add to the formData table
export const formData = pgTable("form_data", {
  // Existing fields...
  newField: text("new_field").notNull(),
});

// Add to the Zod schema
export const formDataSchema = z.object({
  // Existing fields...
  newField: z.string(),
});
```

#### Step 2: Add field definition in `client/src/lib/fieldDefinitions.ts`

```typescript
export const fieldDefinitions = [
  // Existing fields...
  { 
    id: 'newField', 
    aliases: ['new field', 'alternative name'],
    type: 'text' // Or 'select', 'date', 'currency', etc.
  },
];
```

#### Step 3: Update `InsuranceForm.tsx` component

Add the new field to the appropriate form section:

```tsx
{/* Add your new field */}
<FormField
  control={form.control}
  name="newField"
  render={({ field }) => (
    <FormItem
      className={
        highlightedField === "newField" ? "bg-primary/10 -mx-3 px-3 py-2 rounded-md transition-colors" : ""
      }
    >
      <FormLabel>New Field</FormLabel>
      <FormControl>
        <Input {...field} disabled={isPending} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Step 4: Add PDF extraction logic in `server/storage.ts`

Update the `extractFormData` method to extract the new field:

```typescript
// Add a regex pattern for your new field
const newFieldRegex = /new\s*field:?\s*([A-Za-z0-9\s.]+)/i;
const newFieldMatch = text.match(newFieldRegex);
if (newFieldMatch && newFieldMatch[1]?.trim()) {
  extractedData.newField = newFieldMatch[1].trim();
}
```

### 2. Enhancing Voice Command Recognition

To improve the NLP processor:

#### Step 1: Add new command patterns in `client/src/lib/nlpProcessor.ts`

```typescript
// Add new command verbs if needed
const commandVerbs = [
  'change', 'update', 'set', 'modify', 'make', 'please', 'can you',
  'new_verb', // Add your new verb
];

// Enhance the extractValue function with new patterns if needed
function extractValue(command: string, field: typeof fieldDefinitions[0]): string | null {
  // Existing logic...
  
  // Add your new pattern detection
  const newPattern = new RegExp(`your-new-pattern-here`, 'i');
  const newMatch = command.match(newPattern);
  if (newMatch && newMatch[1]) {
    return newMatch[1].trim();
  }
  
  // Existing fallback logic...
}
```

#### Step 2: Add special case handling for formatting if needed

```typescript
function formatValue(fieldId: string, value: string): string {
  // Existing special cases...
  
  // Add handling for your new field if needed
  if (fieldId === 'newField') {
    // Format the value appropriately
    return value.toLowerCase();
  }
  
  return value;
}
```

### 3. Adding a New API Endpoint

To add a new API endpoint:

#### Step 1: Update `server/routes.ts`

```typescript
// Add your new endpoint
app.post("/api/new-endpoint", requireAuth, async (req, res) => {
  try {
    // Validate the request body
    const schema = z.object({
      // Define your expected request data
      someField: z.string(),
    });
    
    const validatedData = schema.parse(req.body);
    
    // Process the request
    const result = await storage.yourNewMethod(validatedData);
    
    // Return the response
    res.json({
      message: "Operation successful",
      data: result
    });
  } catch (error) {
    console.error("Error in new endpoint:", error);
    res.status(500).json({ message: "Operation failed" });
  }
});
```

#### Step 2: Add the corresponding method in `server/storage.ts`

```typescript
// Add to the IStorage interface
export interface IStorage {
  // Existing methods...
  yourNewMethod(data: SomeType): Promise<ResultType>;
}

// Implement in the MemStorage class
export class MemStorage implements IStorage {
  // Existing methods...
  
  async yourNewMethod(data: SomeType): Promise<ResultType> {
    // Implement your logic here
    return result;
  }
}
```

#### Step 3: Create a client-side service in `client/src/lib`

```typescript
// Create a new file, e.g., client/src/lib/newService.ts
import { apiRequest } from './queryClient';

export async function callNewEndpoint(data: SomeType) {
  return apiRequest<ResultType>('/api/new-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### 4. Adding a New UI Component

To add a new reusable component:

#### Step 1: Create the component file

```tsx
// client/src/components/NewComponent.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

const NewComponent = ({ title, onAction }: NewComponentProps) => {
  const [isActive, setIsActive] = useState(false);
  
  const handleClick = () => {
    setIsActive(true);
    onAction();
  };
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium">{title}</h3>
      <Button 
        onClick={handleClick}
        variant={isActive ? "default" : "outline"}
      >
        Activate
      </Button>
    </div>
  );
};

export default NewComponent;
```

#### Step 2: Use the component in a page or another component

```tsx
import NewComponent from '@/components/NewComponent';

function SomePage() {
  const handleAction = () => {
    console.log('Action triggered');
  };
  
  return (
    <div>
      <h1>Some Page</h1>
      <NewComponent 
        title="My New Component" 
        onAction={handleAction} 
      />
    </div>
  );
}
```

## Debugging Tips

### Backend Debugging

1. Add console logs for important information:
```typescript
console.log('Processing request:', req.body);
```

2. Monitor server logs in the terminal running `npm run dev`

3. Use try/catch blocks to handle and log errors:
```typescript
try {
  // Your code
} catch (error) {
  console.error('Error details:', error);
  throw error; // Re-throw or handle appropriately
}
```

### Frontend Debugging

1. Use React DevTools browser extension to inspect component props and state

2. Use console.log with descriptive labels:
```typescript
console.log('Form data before submission:', formData);
```

3. For React Query debugging:
```tsx
const { data, error, isLoading } = useQuery({
  queryKey: ['/api/form-data'],
  queryFn: () => apiRequest('/api/form-data'),
});

console.log('Query state:', { data, error, isLoading });
```

## Testing Guide

While formal testing setup is not included in the project, here are recommended approaches:

### Manual Testing Checklist

For voice command processing:
- Test basic commands ("Set first name to John")
- Test commands with variations ("Change the first name to John")
- Test commands with ambiguous language
- Test with background noise

For PDF extraction:
- Test with well-formatted PDFs
- Test with poorly scanned PDFs
- Test with PDFs missing some fields
- Test with non-insurance PDFs

## Deployment Considerations

When deploying to production:

1. Set up proper environment variables for production services
2. Consider implementing a database instead of in-memory storage
3. Add proper error monitoring and logging
4. Implement rate limiting on API endpoints
5. Set up CORS properly to restrict access

## Best Practices

1. **Code Style**:
   - Use descriptive variable and function names
   - Add comments for complex logic
   - Follow TypeScript best practices with proper typing

2. **State Management**:
   - Keep state as local as possible
   - Use React Query for server state
   - Avoid prop drilling with context when needed

3. **Error Handling**:
   - Provide user-friendly error messages
   - Log detailed errors on the server
   - Gracefully handle API failures

4. **Performance**:
   - Memoize expensive calculations
   - Lazy load components when appropriate
   - Use pagination for large data sets

---

This guide should help you get started with developing and extending the Voice-Controlled Form Editor. For more detailed information about specific components or systems, refer to the inline code documentation and the technical documentation file.