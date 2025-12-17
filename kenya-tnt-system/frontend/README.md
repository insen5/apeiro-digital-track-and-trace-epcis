# Kenya TNT System - Frontend

Next.js frontend application for the Kenya National Track & Trace System.

## Features

- ✅ Modern Next.js 14 with App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Reusable UI components (copied from parent repo)
- ✅ API integration with Core Monolith

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Update the API base URL if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── forms/            # Dynamic form system
│   ├── chart/            # Chart components
│   ├── ui/               # UI primitives
│   └── ...               # Other reusable components
└── public/               # Static assets
```

## UI Components

The frontend uses reusable components copied from the parent repository:

- **Forms**: Dynamic form system (`components/forms/`)
- **Tables**: GenericTable, DataTable
- **Charts**: Various chart components
- **UI Primitives**: Buttons, inputs, modals, etc.

## API Integration

The frontend connects to the Core Monolith API:

- Base URL: `http://localhost:3000/api`
- Swagger Docs: `http://localhost:3000/api/docs`
- Health Check: `http://localhost:3000/api/health`

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Next Steps

1. Create module-specific pages (Regulator, Manufacturer, Distributor)
2. Integrate authentication (Keycloak)
3. Build out forms using the dynamic form system
4. Add charts and analytics dashboards
5. Implement journey tracking visualization
