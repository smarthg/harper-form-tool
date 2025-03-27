# Voice-Controlled Form Editor

A modern web application that enables users to edit form fields in real-time using natural language voice commands. This application offers a seamless, hands-free experience for filling out insurance forms, perfect for accessibility needs or multitasking scenarios.

![Voice-Controlled Form Editor](https://placeholder-for-screenshot.png)

## Features

- **Voice Command Recognition**: Edit form fields naturally by speaking commands like "Set the policy type to home" or "Change the coverage amount to $500,000"
- **PDF Form Extraction**: Upload existing insurance PDF forms to automatically extract and populate form data
- **Real-time Form Updates**: See immediate updates to form fields as you speak commands
- **Command History**: View a log of all voice commands and changes made to the form
- **Form Download**: Export the completed form as a professionally formatted PDF document
- **Secure Authentication**: User authentication via Clerk for secure access to forms
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js server with in-memory storage
- **PDF Processing**: LlamaParse for intelligent PDF extraction with pdf-parse fallback
- **Voice Recognition**: Browser's Web Speech API with OpenAI transcription fallback
- **NLP Processing**: Custom natural language processing for command interpretation
- **Authentication**: Clerk for user management
- **Data Management**: React Query for efficient data fetching and caching
- **PDF Generation**: jsPDF for creating downloadable insurance forms

## Getting Started

### Prerequisites

- Node.js 20 or higher
- OpenAI API key (optional, for enhanced voice recognition)
- LlamaParse API key (optional, for enhanced PDF extraction)
- Clerk account for authentication

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Optional: OpenAI for enhanced transcription
OPENAI_API_KEY=your_openai_api_key

# Optional: LlamaParse for enhanced PDF extraction
LLAMAPARSE_API_KEY=your_llamaparse_api_key
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/voice-controlled-form-editor.git
   cd voice-controlled-form-editor
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Usage Guide

### Voice Commands

The application understands a variety of natural language commands. Here are some examples:

- "Set the first name to John"
- "Change the policy type to auto"
- "Update the coverage amount to $250,000"
- "Make the deductible $500"
- "Set the start date to January 1st, 2025"

### Uploading PDF Forms

1. Click the "Upload Form" button in the top right corner
2. Select a PDF insurance form from your device
3. Review the extracted data
4. Click "Apply Changes" to populate the form with the extracted data

### Exporting Forms

1. Complete the form using voice commands or manual entry
2. Click the "Download Form" button
3. A professionally formatted PDF of your insurance form will be downloaded

## API Documentation

### Endpoints

- `GET /api/form-data`: Retrieve the current form data
- `PATCH /api/form-data`: Update form data
- `POST /api/upload-form`: Upload and process a PDF form
- `POST /api/transpose-form`: Apply extracted form data to the current form

## Development

### Project Structure

```
├── client/            # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Application pages
├── server/            # Backend Express application
│   ├── index.ts       # Server entry point
│   ├── routes.ts      # API routes
│   └── storage.ts     # Data storage implementation
├── shared/            # Shared code between client and server
│   └── schema.ts      # Data models and validation schemas
└── public/            # Static assets
```

### Adding New Form Fields

1. Update the schema in `shared/schema.ts`
2. Add the field to `fieldDefinitions.ts` with appropriate aliases
3. Update `InsuranceForm.tsx` to include the new field
4. Add extraction logic in `storage.ts` if using PDF extraction

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) - For API integration with advanced AI capabilities
- [LlamaParse](https://llamaparse.com/) - For intelligent PDF extraction
- [Clerk](https://clerk.dev/) - For authentication services
- [shadcn/ui](https://ui.shadcn.com/) - For beautiful, accessible UI components