# Voice-Controlled Form Editor

A modern web application that enables users to edit form fields in real-time using natural language voice commands. This application offers a seamless, hands-free experience for filling out insurance forms, perfect for accessibility needs or multitasking scenarios.

![Voice-Controlled Form Editor](https://placeholder-for-screenshot.png)

## Features

- **Voice Command Recognition**: Edit form fields naturally by speaking commands like "Set the policy type to home" or "Change the coverage amount to $500,000"
- **PDF Form Generation**: Export the completed form data as a professional insurance PDF document
- **Real-time Form Updates**: See immediate updates to form fields as you speak commands
- **Command History**: View a log of all voice commands and changes made to the form
- **Form Download**: Export the completed form as a professionally formatted PDF document
- **Secure Authentication**: User authentication via Clerk for secure access to forms
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js server with in-memory storage
- **PDF Generation**: Anvil API and jsPDF for creating downloadable insurance forms
- **Voice Recognition**: Browser's Web Speech API with OpenAI transcription fallback
- **NLP Processing**: Custom natural language processing for command interpretation
- **Authentication**: Clerk for user management
- **Data Management**: React Query for efficient data fetching and caching


## Getting Started

### Prerequisites

- Node.js 20 or higher
- OpenAI API key (optional, for enhanced voice recognition and company data mapping)
- Anvil API key (for PDF form generation)
- Clerk account for authentication

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Optional: OpenAI for enhanced transcription and form field mapping
OPENAI_API_KEY=your_openai_api_key

# Required for PDF form generation
ANVIL_API_KEY=your_anvil_api_key
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



### Exporting Forms

1. Complete the form using voice commands or manual entry
2. Click the "Download Form" button
3. A professionally formatted PDF of your insurance form will be downloaded

## API Documentation

### Endpoints

- `GET /api/form-data`: Retrieve the current form data
- `PATCH /api/form-data`: Update form data
- `POST /api/fill-pdf`: Generate a filled PDF form with the current form data
- `GET /api/form-definitions/:formType`: Get form definition for a specific form type
- `GET /api/form-data/:formType`: Get form data for a specific form type
- `PATCH /api/form-data/:formType`: Update form data for a specific form type

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
4. Update form field references in related components

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
- [Anvil API](https://www.useanvil.com/) - For PDF form generation and filling
- [Clerk](https://clerk.dev/) - For authentication services
- [shadcn/ui](https://ui.shadcn.com/) - For beautiful, accessible UI components