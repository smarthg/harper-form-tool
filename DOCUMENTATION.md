# Voice-Controlled Form Editor - Technical Documentation

This document provides detailed technical information about the Voice-Controlled Form Editor application, including its architecture, implementation details, core functionalities, and integration points.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Model](#data-model)
3. [Core Components](#core-components)
4. [Voice Command Processing](#voice-command-processing)
5. [PDF Processing Pipeline](#pdf-processing-pipeline)
6. [Authentication & Security](#authentication--security)
7. [Form Generation](#form-generation)
8. [API Reference](#api-reference)
9. [Environment Management](#environment-management)
10. [Performance Considerations](#performance-considerations)
11. [Extending the Application](#extending-the-application)

## System Architecture

The application follows a modern client-server architecture:

### Frontend (Client)
- Single Page Application built with React and TypeScript
- State management via React Query for server state and local React state
- Component library based on shadcn/ui with Tailwind CSS for styling
- Interface split into Form Editor area, Voice Command interface, and Activity Log

### Backend (Server)
- Express.js server with RESTful API endpoints
- In-memory storage for form data persistence
- PDF processing capabilities with LlamaParse and fallback to pdf-parse
- Integration with Clerk for authentication

### Communication Flow
1. User authenticates via Clerk
2. Client fetches initial form data from the server
3. User issues voice commands or uploads PDF forms
4. Server processes requests and updates the form data
5. Client displays real-time updates to the form

## Data Model

The application's core data model is defined in `shared/schema.ts`:

### Form Data Schema
```typescript
export const formDataSchema = z.object({
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
});
```

### Activity Log Item
```typescript
type ActivityItem = {
  id: string;
  command: string;
  field: string;
  value: string;
  timestamp: Date;
};
```

## Core Components

### FormEditor (Main Page)
The central page that orchestrates the entire application, managing:
- Form data fetching and updates
- Voice command state
- Activity history
- Integration of all sub-components

### InsuranceForm
Displays the interactive form with fields defined in the data model, handling:
- Field rendering with appropriate input types
- Field highlighting for active voice commands
- Field validation
- Loading states during updates

### VoiceInterface
Manages voice input and command processing, providing:
- Recording and processing of audio
- Visual feedback for listening state
- Real-time transcript display
- OpenAI API integration for enhanced transcription
- Command success/error messaging

### ActivityLog
Displays a chronological history of commands and changes, with:
- Timestamped entries
- Command text
- Affected field
- Applied value

### FormUploadModal
Handles PDF form uploading and extraction, with:
- File selection interface
- Processing state visualization
- Extracted data review
- Confirmation for form data replacement

## Voice Command Processing

The voice command processing pipeline consists of these steps:

1. **Audio Capture**:
   - Browser's Web Speech API (primary)
   - Audio recording with MediaRecorder API (fallback)

2. **Transcription**:
   - Browser's SpeechRecognition API (primary)
   - OpenAI Whisper API (fallback if API key is provided)

3. **Intent Recognition** (`nlpProcessor.ts`):
   - Command normalization
   - Field identification using `fieldDefinitions.ts`
   - Value extraction using regex patterns
   - Value formatting based on field type

4. **Command Execution**:
   - Field update via mutation request
   - Activity logging
   - User feedback

### Command Pattern Recognition

The NLP processor identifies commands through pattern matching:
- Field identification using aliases (e.g., "coverage amount", "coverage limit")
- Command verb detection ("set", "change", "update")
- Preposition identification ("to", "as", "with")
- Value extraction and normalization

Example patterns:
- "Set [field] to [value]"
- "Change [field] to [value]"
- "Make [field] [value]"

## PDF Processing Pipeline

The PDF processing system can extract form data from uploaded insurance documents:

1. **Document Upload**:
   - Frontend: `FormUploader.tsx` handles file selection and submission
   - Backend: Multer middleware processes the uploaded file

2. **Text Extraction**:
   - Primary: LlamaParse API for intelligent document parsing
   - Fallback: pdf-parse library for basic text extraction

3. **Data Extraction** (`storage.ts` - `extractFormData`):
   - Regex-based pattern matching for each form field
   - Special handling for dates, currency values, and formatted data
   - Normalization of extracted values

4. **Data Integration**:
   - `transposeFormData` method merges extracted data with existing form
   - User reviews and confirms the extracted data before application

## Authentication & Security

Authentication is implemented using Clerk, providing:

- User registration and login
- Session management
- Protected API routes via `ClerkExpressRequireAuth` middleware
- Client-side route protection with `AuthGuard`

## Form Generation

PDF form generation is handled by the `pdfGenerator.ts` module, which:

1. Creates a new jsPDF document
2. Adds formatted sections for personal information, policy details, and coverage
3. Applies styling and formatting for a professional appearance
4. Provides a download function for saving the generated PDF

## API Reference

### Form Data Management

#### `GET /api/form-data`
- **Purpose**: Retrieves the current form data
- **Auth**: Required
- **Response**: Form data object

#### `PATCH /api/form-data`
- **Purpose**: Updates specific form fields
- **Auth**: Required
- **Payload**: Object with field:value pairs to update
- **Response**: Updated form data object

### PDF Processing

#### `POST /api/upload-form`
- **Purpose**: Uploads and processes a PDF form
- **Auth**: Required
- **Payload**: Form data with PDF file
- **Response**: Extracted form data fields

#### `POST /api/transpose-form`
- **Purpose**: Applies extracted form data to the current form
- **Auth**: Required
- **Payload**: Extracted data object
- **Response**: Updated complete form data

## Environment Management

The application features intelligent environment detection and configuration:

### Environment Detection

The server automatically detects the runtime environment and applies appropriate settings:

```typescript
// Automatic environment detection in server/index.ts
const isProduction = process.env.REPL_ID || 
                     process.env.NODE_ENV === 'production' ||
                     process.env.RENDER || 
                     process.env.VERCEL;

if (isProduction) {
  console.log('Production environment detected, forcing developer mode to false');
  process.env.DEVELOPER_MODE = 'false';
}
```

### Developer Mode

Developer mode controls whether authentication is enforced:

- When `DEVELOPER_MODE=true` (local development):
  - Authentication checks are bypassed
  - API endpoints are accessible without authentication
  - Ideal for quick development and testing

- When `DEVELOPER_MODE=false` (production):
  - Full authentication via Clerk is enforced
  - All protected routes require valid authentication
  - Secure for production deployment
  
### Environment Variables

The application uses these key environment variables:

```
# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY - For client-side Clerk initialization
CLERK_SECRET_KEY - For server-side Clerk authentication

# AI Services
VITE_OPENAI_API_KEY - For enhanced voice recognition (optional)
LLAMAPARSE_API_KEY - For improved PDF extraction (optional)

# PDF Generation
ANVIL_API_KEY - For PDF form generation with Anvil

# Application Settings
DEVELOPER_MODE - Controls authentication enforcement (auto-disabled in production)
```

### Form Type Support

The application supports multiple form types:

1. **ACORD 125** (Commercial Insurance Application)
   - Form definition in `server/formDefinitions/acord125.ts`
   - Anvil PDF template ID handling in `server/services/anvilService.ts`

2. **ACORD 126** (Commercial General Liability Section)
   - Form definition in `server/formDefinitions/acord126.ts`
   - Specialized Anvil mapping in `mapAcord126DataToAnvilFormat()`

Each form type has:
- A dedicated form definition
- Form-specific UI components
- Custom PDF generation templates
- Specialized data mapping functions

## Performance Considerations

### Client-Side Optimizations
- React Query for efficient data fetching and caching
- Debounced voice command processing
- Controlled re-renders with appropriate memoization

### Server-Side Optimizations
- Lightweight in-memory storage for fast response times
- Fallback mechanisms for external API dependencies
- Error handling with appropriate status codes and messages

## Extending the Application

### Adding New Form Fields

1. Update the form data schema in `shared/schema.ts`:
```typescript
export const formDataSchema = z.object({
  // Existing fields...
  newField: z.string(),
});
```

2. Add the field definition to `fieldDefinitions.ts`:
```typescript
{ 
  id: 'newField', 
  aliases: ['new field', 'alternative name'],
  type: 'text'
}
```

3. Update the `InsuranceForm.tsx` component to include the new field

4. Add extraction logic in `storage.ts` if the field should be extracted from PDF forms

### Implementing New Voice Command Patterns

Enhance the NLP processor in `nlpProcessor.ts` by:

1. Adding new command verbs to the `commandVerbs` array
2. Extending the regex patterns in `extractValue` function
3. Adding special case handling in `formatValue` if needed

### Adding External API Integrations

1. Create a new service file in `lib/` folder
2. Implement the API client and related functions
3. Add appropriate environment variables
4. Add integration points in the relevant components

---

This documentation reflects the current implementation as of March 28, 2025. For the latest updates, refer to the codebase and recent commit history.