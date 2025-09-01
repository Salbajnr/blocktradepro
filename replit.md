# Overview

BlockTrade is a modern stock trading web application that provides users with portfolio management, real-time stock trading, and transaction history tracking. The application simulates a professional trading platform with features like market overview, order placement, portfolio analytics, and comprehensive transaction management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **UI Components**: Extensive use of Radix UI primitives wrapped in custom shadcn/ui components for accessible, customizable interfaces
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js for REST API endpoints
- **Data Storage**: In-memory storage implementation with interface abstraction for future database integration
- **Schema Management**: Drizzle ORM with PostgreSQL schema definitions and Zod validation
- **Development**: Hot reload with Vite integration for seamless development experience

## Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in TypeScript
- **Tables**: Users, stocks, holdings, and transactions with proper foreign key relationships
- **Schema Validation**: Drizzle-Zod integration for runtime schema validation
- **Migration Support**: Drizzle Kit for database migrations and schema management

## Key Features
- **Trading Interface**: Real-time stock trading with market/limit orders, quantity selection, and cost estimation
- **Portfolio Management**: Holdings tracking with profit/loss calculations, performance metrics, and asset allocation
- **Market Data**: Stock price display with change indicators and market overview
- **Transaction History**: Comprehensive transaction tracking with filtering, status management, and detailed transaction modals
- **Responsive Design**: Mobile-first design with adaptive layouts and touch-friendly interfaces

## Development Patterns
- **Type Safety**: Full TypeScript integration across frontend, backend, and shared schemas
- **Component Architecture**: Modular React components with clear separation of concerns
- **API Design**: RESTful endpoints with consistent error handling and response formats
- **Code Organization**: Clear separation between client, server, and shared code with proper module boundaries

# External Dependencies

## Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database driver for cloud deployment
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **@tanstack/react-query**: Powerful data fetching and caching library for React
- **express**: Fast, minimalist web framework for Node.js backend

## UI and Styling
- **@radix-ui/react-***: Comprehensive collection of accessible UI primitives (dialog, dropdown, form controls, etc.)
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating type-safe CSS variants
- **lucide-react**: Modern icon library with consistent design

## Development Tools
- **vite**: Next-generation build tool with fast development server
- **typescript**: Static type checking for JavaScript
- **wouter**: Minimalist routing library for React applications
- **zod**: TypeScript-first schema validation library

## Form and Data Handling
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **date-fns**: Modern date utility library for JavaScript

The application is designed to be easily deployable to cloud platforms with environment-based configuration for database connections and supports both development and production environments with appropriate tooling for each.