# Pakur Mart Admin Panel

## Overview

This is a comprehensive React-based admin panel for Pakur Mart, an online delivery service. The application is designed as a modern web application using React with TypeScript, featuring a corporate aesthetic with professional blue-gray theming. The system provides role-based access control for administrators and sub-administrators to manage products, vendors, orders, and users efficiently.


The application follows a full-stack architecture with a React frontend using shadcn/ui components, an Express.js backend, and Firebase Firestore for data persistence. It's designed to be responsive across desktop, tablet, and mobile devices while maintaining a clean, intuitive user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using functional components and hooks
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, professional UI
- **State Management**: React hooks (useState, useEffect) for local state management
- **Theme System**: CSS custom properties with dark/light mode support and corporate blue-gray color scheme
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints ensuring full responsiveness
- **Component Structure**: Modular component-based architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with /api prefix for all endpoints
- **Middleware**: JSON body parsing, URL encoding, and custom logging middleware
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development Tools**: Hot reloading with Vite integration and runtime error overlays

### Database Design
- **Primary Database**: Firebase Firestore for real-time data synchronization
- **ORM**: Drizzle ORM configured for PostgreSQL (fallback/future migration option)
- **Schema Management**: Drizzle-kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL connection as backup option

### Data Models
Based on the application requirements, the system handles:
- Products (name, category, price, stock, vendor/supplier, availability, time slots)
- Vendors/Suppliers (internal directory management)
- Orders (real-time order tracking and management)
- Users (role-based access with admin and sub-admin permissions)
- Categories (product categorization system)

### Authentication & Authorization
- **Role-Based Access Control**: Two primary roles - System Administrator (full access) and Sub-Administrator (restricted access to specific categories/regions)
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: Environment-based configuration for sensitive data

### Build & Development
- **Build Tool**: Vite for fast development and optimized production builds
- **TypeScript**: Strict type checking with path aliases for clean imports
- **Development**: Hot module replacement with error overlay for debugging
- **Production**: Optimized builds with tree shaking and code splitting

### UI/UX Architecture
- **Design System**: Consistent corporate aesthetic with reserved color scheme
- **Component Library**: Radix UI primitives with custom styling through shadcn/ui
- **Icons**: Lucide React icons for consistent iconography
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Data Visualization**: Chart.js integration for analytics and metrics display
- **Notifications**: Toast notifications for user feedback

### State Management
- **Local State**: React hooks for component-level state management
- **Server State**: TanStack Query for server state synchronization and caching
- **Form State**: React Hook Form for complex form state management
- **Global State**: Context API for theme and user authentication state

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod resolvers
- **TypeScript**: Full TypeScript support with strict configuration
- **Vite**: Modern build tool with React plugin and development optimizations

### UI Component Libraries
- **Radix UI**: Complete set of accessible UI primitives including dialogs, dropdowns, tooltips, and form components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Modern icon library for consistent iconography
- **Class Variance Authority**: For creating type-safe component variants

### Database & Backend
- **Firebase**: Firestore for real-time database, Authentication for user management
- **Drizzle ORM**: Type-safe ORM with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL for scalable database hosting
- **Express.js**: Web framework for Node.js with session management

### Development Tools
- **ESBuild**: Fast bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **TSX**: TypeScript execution for development server
- **Replit Integration**: Development environment optimizations and error handling

### Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **Date-fns**: Modern date utility library for date formatting and manipulation
- **Zod**: TypeScript-first schema validation for forms and API responses

### Session & Storage
- **Connect-pg-simple**: PostgreSQL session store for Express sessions
- **Embla Carousel**: Responsive carousel component for data presentation

The application is designed to be self-contained with minimal external dependencies while leveraging modern web development best practices for performance, accessibility, and maintainability.