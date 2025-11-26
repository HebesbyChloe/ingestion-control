# Quick Start Guide

## 🚀 Getting Started

1. **Navigate to project**:
   ```bash
   cd "C:\Users\conta\Microservices\Admin Rules\ingestion-control"
   ```

2. **Set up environment**:
   ```bash
   # Copy example file
   copy .env.local.example .env.local
   
   # Edit .env.local and add your API keys:
   # - GATEWAY_API_KEY (from Gateway - server-side)
   # - NEXT_PUBLIC_GATEWAY_API_KEY (from Gateway - client-side)
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase)
   ```

3. **Start development server**:
   ```bash
   npm run dev         # Runs on port 3000
   # OR
   npm run dev:5000    # Runs on port 5000
   ```

4. **Open browser**:
   ```
   http://localhost:3000
   # OR
   http://localhost:5000
   ```

## 📋 Features Overview

### Dashboard (`/dashboard`)
- System overview
- Active schedules count
- Total runs and errors
- Feed status summary

### Schedules (`/schedules`)
- View all cron schedules with human-readable descriptions
- Create schedules with preset options (Every 3 hours, Daily, etc.)
- Advanced cron builder for custom expressions
- Service-specific endpoint dropdowns
- Edit/delete schedules
- Manual execution
- Enable/disable schedules

### Rules (`/rules`)
- Manage pricing rules (markup with conditions)
- Configure origin rules (data transformation)
- Set scoring rules (search boosting)
- Create filter rules (data filtering)
- Generic rules (custom configurations)
- Drag-and-drop priority ordering
- Feed-based tabs organization
- JSON configuration preview

### Feeds (`/feeds`)
- View all configured feeds
- Monitor feed configuration
- ZIP file response support
- Custom shard strategies
- API authentication settings

### Jobs (`/workers`)
- Real-time job monitoring
- Status filtering (Pending, Running, Completed, Failed)
- Date range filtering
- Detailed job information panel
- View results, errors, and timeline
- Retry failed jobs

## 🔧 Configuration

### Required Environment Variables

```env
NEXT_PUBLIC_API_GATEWAY_URL=https://api-gateway-dfcflow.fly.dev
GATEWAY_API_KEY=your-gateway-api-key
NEXT_PUBLIC_GATEWAY_API_KEY=your-gateway-api-key
NEXT_PUBLIC_SUPABASE_URL=https://aghiaddnlqgtyabyepvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Note:** 
- `GATEWAY_API_KEY` - Used server-side (API routes)
- `NEXT_PUBLIC_GATEWAY_API_KEY` - Used client-side (browser axios calls)
- Both should have the same value

### Getting API Keys

1. **Gateway API Key**: Get from your API Gateway service or Fly.io secrets
2. **Supabase Anon Key**: Get from Supabase dashboard → Settings → API

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on desktop and mobile
- **Real-time Updates**: React Query for automatic refetching
- **Error Handling**: Graceful error messages
- **Loading States**: Skeleton loaders and spinners

## 📚 API Integration

The app connects to:
- **API Gateway** (`/scheduler/*`, `/worker/*`)
- **Supabase PostgREST** (direct rules access)
- **Worker Service** (feed management)

## 🛠️ Development

```bash
# Install dependencies (already done)
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📦 Project Structure

```
ingestion-control/
├── app/                    # Next.js app router pages
│   ├── api/               # Next.js API routes (CORS proxy)
│   ├── dashboard/         # Dashboard page
│   ├── schedules/         # Schedule management
│   ├── rules/             # Rules management
│   ├── feeds/             # Feed management
│   ├── workers/           # Jobs monitoring
│   └── layout.tsx         # Root layout
├── components/
│   ├── rules/             # Rules components
│   ├── schedules/         # Schedule components (CronBuilder)
│   ├── workers/           # Worker components (JobDetailsPanel)
│   └── ui/                # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       └── ...
├── hooks/                 # Custom React hooks
│   ├── useRulesData.ts
│   ├── useFeedManagement.ts
│   └── ...
├── lib/
│   ├── api/               # API client functions
│   │   ├── client.ts      # Axios instance
│   │   ├── schedules.ts   # Schedule API
│   │   ├── rules.ts       # Rules API
│   │   ├── feeds.ts       # Feeds API
│   │   └── workers.ts     # Workers API
│   ├── rules/             # Rules utilities
│   │   ├── jsonGenerator.ts
│   │   └── priceCalculations.ts
│   └── schedules/         # Schedule utilities
│       ├── cronUtils.ts
│       └── serviceEndpoints.ts
└── public/                # Static assets
```

## 🎯 Next Steps

1. ✅ Project created
2. ✅ Pages and components built
3. ✅ API integration ready
4. ⏳ Configure `.env.local` with your keys
5. ⏳ Run `npm run dev` to start
6. ⏳ Test the application

## 💡 Tips

- Use the dashboard to get an overview first
- Start with schedules to understand the system
- Rules can be managed per feed and tenant
- Feeds show real-time status from worker service

