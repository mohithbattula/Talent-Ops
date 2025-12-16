# ATS Hiring Portal - Setup Instructions

Quick guide to get the ATS Hiring Portal running on your machine.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)

## Installation

1. **Open a terminal** in this folder

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**: Navigate to `http://localhost:3000`

## Production Build

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` folder, ready to deploy.

## Database Configuration

This app uses **Supabase** for the database. The `.env` file contains the connection credentials.

### Using the Existing Database
No changes needed - the app is pre-configured to connect to the shared database.

### Using Your Own Database
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL in `src/supabase_schema.sql` in Supabase SQL Editor
3. Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Integration with Main Website

### Option 1: Embed as Iframe
```html
<iframe src="http://your-domain.com/ats-portal" width="100%" height="800"></iframe>
```

### Option 2: Deploy as Subdirectory
1. Build the project: `npm run build`
2. Copy `dist/` contents to your website's subdirectory (e.g., `/ats-portal/`)
3. Update `vite.config.js` base path if needed

## Folder Structure

```
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components (Dashboard, Jobs, etc.)
│   ├── services/      # API services (Supabase, PDF generation)
│   └── ...
├── .env               # Environment variables
├── package.json       # Dependencies
└── vite.config.js     # Build configuration
```

## Need Help?

Contact the original developer for support.
