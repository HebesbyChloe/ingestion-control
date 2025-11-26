# Ingestion Control Panel

A modern Next.js admin panel for managing ingestion schedules, rules, feeds, and worker jobs.

## Features

- 📅 **Schedule Management**: Create, edit, and manage cron schedules with user-friendly presets
- ⚙️ **Rules Management**: Configure pricing, origin, scoring, and filter rules with drag-and-drop
- 📊 **Feed Monitoring**: View and manage feed configurations
- 👷 **Jobs Monitoring**: Track worker job execution, status, and performance
- 📈 **Dashboard**: Overview of system metrics and status

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching
- **Axios** for API calls
- **Lucide React** for icons

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   NEXT_PUBLIC_API_GATEWAY_URL=https://api-gateway-dfcflow.fly.dev
   GATEWAY_API_KEY=your-api-key-here
   NEXT_PUBLIC_GATEWAY_API_KEY=your-api-key-here
   NEXT_PUBLIC_SUPABASE_URL=https://aghiaddnlqgtyabyepvx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Project Structure

```
ingestion-control/
├── app/
│   ├── dashboard/      # Dashboard page
│   ├── schedules/      # Schedule management
│   ├── rules/          # Rules management
│   ├── feeds/          # Feed management
│   ├── workers/        # Jobs monitoring
│   └── layout.tsx      # Root layout
├── components/
│   ├── rules/          # Rules components
│   ├── schedules/      # Schedule components
│   ├── workers/        # Worker components
│   └── ui/             # Reusable UI components
├── lib/
│   ├── api/            # API client functions
│   ├── rules/          # Rules utilities
│   └── schedules/      # Schedule utilities
├── hooks/              # Custom React hooks
└── public/             # Static assets
```

## API Integration

The app integrates with:
- **API Gateway**: For scheduler and worker service APIs
- **Supabase PostgREST**: For direct rules management
- **Worker Service**: For feed ingestion control

## Features in Detail

### Schedules
- View all schedules with human-readable cron descriptions
- Create schedules with preset options (Every 3 hours, Daily, Weekly, etc.)
- Advanced cron builder for custom expressions
- Service-specific endpoint dropdowns (Worker, MCP, Backend API)
- Auto-detection of HTTP methods
- Execute schedules manually
- Enable/disable schedules
- View execution history

### Rules
- Manage pricing rules with markup percentages and conditions
- Configure origin rules for data transformation
- Set up scoring rules for search result boosting
- Create filter rules for data filtering
- Generic rules for custom configurations
- Drag-and-drop priority ordering
- Feed-based organization with tabs
- JSON configuration preview per feed
- Edit panel for detailed rule configuration

### Feeds
- View all configured feeds from sys_feeds table
- Monitor feed configuration and status
- Supports ZIP file responses
- Custom shard strategies
- API authentication configuration

### Jobs (Workers)
- Real-time job monitoring and tracking
- Status filtering (Pending, Running, Completed, Failed)
- Date range filtering (Today, Yesterday, Custom Range)
- Detailed job information panel
- View job parameters, results, and errors
- Timeline tracking (Created, Updated, Started, Completed)
- Duration calculations
- Retry functionality

### Dashboard
- System overview metrics
- Active schedules count
- Total runs and errors
- Recent activity

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## Deployment

This is a Next.js application that can be deployed to:
- **Vercel** (recommended)
- **Fly.io**
- **Any Node.js hosting**

Make sure to set environment variables in your deployment platform.
