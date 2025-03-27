# Deploying the Voice-Controlled Form Editor to Render

This guide will help you deploy your Voice-Controlled Form Editor application to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account
2. A PostgreSQL database (can be created on Render or use a service like [Neon](https://neon.tech))
3. A [Clerk](https://clerk.com) account for authentication
4. A [LlamaParse](https://llama-parse.com) account (or OpenAI API key for AI features)

## Step 1: Set Up Your Database

1. Create a PostgreSQL database on Render or use Neon:
   - If using Render: Go to "New" > "PostgreSQL" and follow the prompts
   - If using Neon: Create a new project and get the connection string

2. Make note of your database connection string - you'll need this for your environment variables

## Step 2: Prepare Your Application for Deployment

Your application already has the necessary scripts in package.json:

- `build`: Builds both client and server
- `start`: Starts the production server

## Step 3: Create a render.yaml Configuration File

Create a `render.yaml` file in the root of your project:

```yaml
services:
  - type: web
    name: voice-controlled-form-editor
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    plan: free
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false # You'll set this manually
      - key: CLERK_SECRET_KEY
        sync: false
      - key: CLERK_PUBLISHABLE_KEY
        sync: false
      - key: LLAMAPARSE_API_KEY
        sync: false
      - key: PORT
        value: 5000
```

## Step 4: Deploy to Render

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. In your Render dashboard:
   - Go to "Dashboard" > "New" > "Blueprint"
   - Connect your Git repository
   - Render will automatically detect the `render.yaml` configuration

3. Complete the setup by providing the required environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `LLAMAPARSE_API_KEY`: Your LlamaParse API key

4. Click "Apply" to start the deployment

## Step 5: Database Migration

After deployment, you may need to run the database migration:

1. Connect to your Render instance using the Shell
2. Run the migration command:
   ```bash
   npm run db:push
   ```

## Step 6: Verify Deployment

1. Your application should now be accessible at the URL provided by Render
2. Verify that all features are working correctly:
   - User authentication via Clerk
   - Form data storage and retrieval
   - Voice commands and form updates
   - PDF generation and parsing

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correctly formatted
- Check if your IP is allowed in the database firewall settings

### Authentication Issues
- Make sure CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY are correct
- Verify Clerk's allowed domains include your Render URL

### Voice Command Issues
- Ensure LLAMAPARSE_API_KEY is valid
- Check browser permissions for microphone access

## Additional Configuration

### Custom Domain
To use a custom domain:
1. Go to your service in the Render dashboard
2. Navigate to "Settings" > "Custom Domain"
3. Follow the instructions to add and verify your domain

### Scaling
If you need to scale your application:
1. Change the plan from "free" to a paid plan in your Render dashboard
2. Adjust the instance type and number based on your needs