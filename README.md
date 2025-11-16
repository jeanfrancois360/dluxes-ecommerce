# Luxury E-commerce Platform

A modern, elegant enterprise e-commerce platform built with cutting-edge technologies.

## Design Philosophy

Modern minimalist luxury aesthetic combining the sophistication of Apple with the elegance of Chanel.

### Design System
- **Colors**: Black (#000000), Gold (#CBB57B), Gray (#C3C9C0), White (#FFFFFF)
- **Typography**: Inter (body text), Playfair Display (headers)
- **Spacing**: 8px grid system with generous white space
- **Animations**: Smooth, subtle transitions (0.3s ease-in-out)

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: Radix UI (unstyled base components)
- **Animations**: Framer Motion, React Spring, GSAP
- **PWA**: Next-PWA for progressive web app capabilities

### Backend
- **Framework**: NestJS with TypeScript
- **Architecture**: Microservices with modular structure
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis for sessions and rate limiting
- **Queue**: BullMQ for async job processing
- **Real-time**: Socket.IO with Redis adapter
- **Search**: Meilisearch integration

### Infrastructure
- **Monorepo**: Turborepo + pnpm workspaces
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## Project Structure

```
luxury-ecommerce/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── ui/               # Shared UI components
│   ├── design-system/    # Design tokens and themes
│   ├── shared/          # Types, utils, constants
│   └── database/        # Prisma schemas and client
├── docker/              # Docker configurations
└── .github/workflows/   # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   cd luxury-ecommerce
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp packages/database/.env.example packages/database/.env
   ```

4. **Start Docker services**
   ```bash
   pnpm docker:up
   ```

5. **Run database migrations**
   ```bash
   pnpm prisma:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   pnpm --filter @luxury/database prisma:seed
   ```

7. **Start development servers**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1
   - Meilisearch: http://localhost:7700
   - Adminer (DB GUI): http://localhost:8080

## Available Scripts

### Root Level
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts
- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services

### Database
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm --filter @luxury/database prisma:studio` - Open Prisma Studio

### Storybook
- `pnpm storybook` - Start Storybook development server

## Services

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: luxury_ecommerce
- **User**: luxury
- **Password**: luxury

### Redis
- **Host**: localhost
- **Port**: 6379

### Meilisearch
- **Host**: http://localhost:7700
- **API Key**: masterKey

## Features

- ✅ Modern minimalist luxury design
- ✅ Full-stack TypeScript
- ✅ Type-safe API with Prisma
- ✅ Real-time updates with WebSockets
- ✅ Product catalog with search
- ✅ Shopping cart management
- ✅ Order processing
- ✅ User authentication & authorization
- ✅ PWA support
- ✅ Responsive design
- ✅ Optimized fonts loading
- ✅ Smooth animations
- ✅ Component library with Storybook
- ✅ Docker development environment
- ✅ CI/CD pipeline

## Architecture Highlights

### Monorepo Benefits
- Shared code and types across frontend/backend
- Consistent tooling and configuration
- Optimized builds with Turborepo
- Type-safe imports between packages

### Design System
- Centralized design tokens
- Reusable UI components
- Consistent styling with Tailwind CSS
- Accessible components with Radix UI

### Backend Architecture
- Modular NestJS structure
- JWT authentication
- Rate limiting with Throttler
- WebSocket support for real-time features
- Background job processing with BullMQ
- Database connection pooling

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass and linting is clean
4. Submit a pull request

## License

Proprietary - All rights reserved
