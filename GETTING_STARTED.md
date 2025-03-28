# Getting Started with Voice-Controlled Form Editor

This guide will help you quickly set up and start using the Voice-Controlled Form Editor application.

## Prerequisites

Before you begin, ensure you have:

- Node.js 20 or higher installed
- Git for version control
- A modern web browser (Chrome recommended for best voice recognition)
- Optional: OpenAI API key for enhanced voice recognition
- Optional: LlamaParse API key for improved PDF extraction
- A Clerk account for authentication

## Quick Start Guide

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/voice-controlled-form-editor.git

# Navigate to the project directory
cd voice-controlled-form-editor

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following:

```
# Authentication (Clerk)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key  # Optional for enhanced voice recognition
LLAMAPARSE_API_KEY=your_llamaparse_api_key  # Optional for improved PDF extraction

# PDF Generation
ANVIL_API_KEY=your_anvil_api_key  # For PDF form generation

# Application Settings
DEVELOPER_MODE=true  # Will be automatically set to false in production environments
```

Note: When deploying to Replit or other production environments, the application will automatically detect the environment type and enforce security settings regardless of the DEVELOPER_MODE value in your `.env` file.

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## First-Time Setup

### 1. Sign Up / Sign In

When you first access the application, you'll need to create an account or sign in using the Clerk authentication system.

### 2. Microphone Permissions

Allow the application to access your microphone when prompted by your browser. This is required for the voice command functionality.

### 3. Optional: Add OpenAI API Key

For enhanced voice recognition:
1. Click the gear icon in the Voice Interface section
2. Enter your OpenAI API key
3. Click "Save"

## Your First Voice Command

Try these steps to test your first voice command:

1. Click the microphone button in the Voice Interface section
2. When the microphone is active (pulsing blue), say: "Set the first name to John"
3. The first name field should update to "John"
4. Check the Activity Log to see your command history

## Try Uploading a Form

Test the PDF extraction functionality:

1. Click the "Upload Form" button
2. Select a PDF insurance form from your device
3. Review the extracted data
4. Click "Apply Changes" to populate the form

## Next Steps

Now that you're up and running:

1. Explore different voice commands (see USER_GUIDE.md for examples)
2. Try filling out the entire form using only voice commands
3. Switch between different form types (ACORD 125, ACORD 126) to see how the interface adapts
4. Generate and download a PDF of your completed form with the proper template for your form type

## Keyboard Shortcuts

For more efficient usage:
- Press Spacebar to start/stop voice recording
- Press Escape to cancel voice recording
- Use Tab to navigate between form fields

## Common Issues

### Voice Recognition Not Working?

1. Make sure your browser has microphone permissions
2. Try using Chrome browser for best compatibility
3. Check if your microphone is working in other applications
4. Consider adding an OpenAI API key for improved recognition

### PDF Extraction Issues?

1. Ensure you're uploading a clear, readable PDF
2. Try a different PDF if extraction results are poor
3. For best results, use standard insurance form formats

## Support and Resources

For more detailed information:
- See USER_GUIDE.md for comprehensive usage instructions
- See DOCUMENTATION.md for technical details
- See API_DOCUMENTATION.md for API integration options

## Feedback and Contributions

We welcome your feedback and contributions to the project! Please feel free to:
- Submit issues on GitHub
- Contribute pull requests
- Provide feedback through our support channels

---

Happy form filling! We hope you enjoy using the Voice-Controlled Form Editor.