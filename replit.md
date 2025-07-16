# EYV Support Profile Picture Creator

## Overview

This is a React-based web application that allows users to create EYV-branded Facebook profile pictures. The application provides a mobile-first, progressive interface where users can upload images or capture photos using their device camera, then automatically process them with EYV branding and circular cropping optimized for social media profile pictures. Features include custom logo upload functionality with default EYV Logo 4.svg branding.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server components:

- **Frontend**: React SPA with Vite build system
- **Backend**: Express.js server with REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with custom EYV brand colors
- **TanStack React Query** for server state management and caching

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations and migrations
- **Neon Database** (PostgreSQL) for data persistence
- **Session management** with connect-pg-simple

### Image Processing
- **Client-side canvas manipulation** for real-time image processing
- **Camera API integration** for photo capture
- **Automatic circular cropping** with EYV branding overlay
- **Optimized output** for Facebook profile picture specifications



### UI/UX Design
- **Mobile-first responsive design** optimized for touch devices
- **Progressive workflow** with clear step indicators
- **EYV brand identity** with custom purple color scheme
- **Accessibility features** with proper ARIA labels and keyboard navigation

## Data Flow

1. **Image Upload/Capture**: Users can either upload an existing image or capture a new photo using device camera
2. **Client-Side Processing**: Images are processed in the browser using HTML5 Canvas API
3. **Real-Time Preview**: Users see immediate preview of the processed image with EYV branding
4. **Download/Share**: Processed images can be downloaded or shared directly to social platforms

The application primarily operates client-side for image processing, reducing server load and providing instant feedback to users.

## External Dependencies

### Core Dependencies
- **pg**: Standard PostgreSQL client for Supabase Database
- **@radix-ui/***: Comprehensive UI primitive components
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler
- **Drizzle Kit**: Database migration management

### Image Processing
- **HTML5 Canvas API**: Client-side image manipulation
- **MediaDevices API**: Camera access for photo capture
- **File API**: File upload and processing

## Deployment Strategy

The application is configured for deployment on Replit with the following build strategy:

1. **Development**: `npm run dev` starts both Vite frontend and Express backend
2. **Production Build**: 
   - Frontend built with Vite to `dist/public`
   - Backend bundled with ESBuild to `dist/index.js`
3. **Production Start**: Serves static files and API routes from single Express instance

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific configuration

### Database Management
- **Migrations**: Handled through Drizzle Kit with `npm run db:push`
- **Schema**: Defined in `shared/schema.ts` for type safety across client/server
- **Connection**: Uses Supabase PostgreSQL with standard pg client for compatibility

## Changelog

```
Changelog:
- July 04, 2025: Initial setup with mobile-first React app
- July 04, 2025: Implemented advanced image manipulation with scale/zoom and drag-to-reposition controls
- July 05, 2025: Added SVG logo upload functionality with default EYV Logo 4.svg branding
- July 05, 2025: Successfully integrated EYV logo (PNG format) in header and profile picture processing. Fixed Chrome preview compatibility issues - app works perfectly in Edge and new browser tabs
- July 05, 2025: Added database logging for downloads - saves base64 image, timestamp, and IP address to PostgreSQL
- July 05, 2025: Removed PWA support - eliminated service worker, manifest, install prompts, and offline features
- July 05, 2025: Enhanced database logging with eyv_message field to track curved text selections ("supporting", "donated", or "none")
- July 05, 2025: Created dynamic messages table with database-driven dropdown, "No text" option hardcoded as first item
- July 05, 2025: Fixed IP address logging to capture real client IP from proxy headers instead of localhost
- July 05, 2025: Added Facebook Login integration allowing users to import their current profile pictures directly
- July 07, 2025: Removed Facebook integration - cleaned up all Facebook SDK code, hooks, and UI components
- July 07, 2025: Added admin section with email-based authentication and 2FA verification system. Includes modal login form, admin dashboard, and PostgreSQL session storage
- July 07, 2025: Updated admin registration flow - email first, then 2FA code, then password setup. Created ian@the-Morgans.biz admin user with password123. Integrated SendGrid for 2FA emails with i-love-eyv.com domain
- July 07, 2025: Removed 2FA requirement for admin login - 2FA now only used for registration and password changes. Admin login is now direct with email/password only
- July 07, 2025: Implemented comprehensive admin functionality with real data management including:
  • Dashboard with real-time stats and recent downloads preview
  • Message management system for creating/editing/deleting curved text options  
  • Download analytics with pagination, filtering, and image viewing
  • Analytics dashboard with charts showing usage patterns and trends
  • Professional navigation between admin sections
  • Complete CRUD operations for all admin data with PostgreSQL integration
- July 07, 2025: Enhanced admin dashboard interface with responsive navigation design:
  • Removed irrelevant "Main App" button from admin navigation
  • Added responsive text labels (visible on desktop/tablet, hidden on mobile)
  • Replaced Quick Actions panel with Top 5 Text Messages panel showing most popular curved text selections
  • Updated Recent Downloads panel to display last 10 downloads instead of 5
  • Fixed database field mapping issues and date formatting errors for proper data display
  • Added profile picture previews in Recent Downloads panel replacing generic download icons
  • Implemented modal image viewer in Downloads section showing 2x size (320px) circular previews
  • Enhanced mobile responsiveness with reduced padding and text sizes across all admin pages
  • Created comprehensive light/dark mode switcher in admin profile menu with full theme persistence
  • Applied dark mode styling to all admin components including header navigation and page backgrounds
- July 07, 2025: Completely rebuilt authentication system with enhanced 4-step registration flow:
  • Replaced single-step registration with progressive 4-step process: Welcome → Email → 2FA → Password → Auto-login
  • Added role-based user system with "user" (default) and "admin" roles stored in PostgreSQL
  • Created new NewAuthModal component with step-by-step UI flow and proper state management
  • Updated all admin components to use new authentication hook (useAuth from use-new-auth.tsx)
  • Added role-based middleware (requireAuth, requireAdmin, requireUser) for API route protection
  • Fixed "Get Started" button functionality and registration step progression
  • Implemented AdminRoute component that redirects non-admin users back to main app with helpful message
  • Enhanced modal behavior to show user profile/logout interface for logged-in users instead of auto-closing
  • Maintained light mode enforcement for main photo editing app while preserving admin dark mode
  • Eliminated all runtime errors from old authentication system and ensured clean component transitions
  • Successfully tested complete authentication flow: registration, login, logout, and role-based access control
- July 07, 2025: Enhanced UX and fixed critical authentication issues:
  • Replaced authentication modal with sleek settings dropdown menu system
  • Added comprehensive light/dark theme switcher with proper styling throughout entire app
  • Fixed missing role data in authentication session - login/registration now properly store and return user roles
  • Enhanced dropdown menu with theme-appropriate styling for both light and dark modes
  • Fixed logout crash by adding proper error handling to logout mutation
  • Successfully implemented seamless theme switching with full dark mode support for main application
- July 08, 2025: Completed comprehensive dark mode implementation across all components:
  • Fixed all white cards and backgrounds to have proper dark mode styling (preview, download, thank you sections)
  • Enhanced text visibility with appropriate light colors for dark mode
  • Added special red heart progress indicator for thank you stage (stage 4)
  • Ensured consistent theme switching throughout entire application
  • All sections now fully support both light and dark themes with excellent visibility
- July 08, 2025: Implemented complete user management system and fixed navigation issues:
  • Added Users menu item to AdminHeader component navigation (now shows all 5 admin sections)
  • Created comprehensive Users management page with full CRUD operations for admin users
  • Implemented user editing, role changes, and password reset functionality
  • Fixed getUsersCount() to query correct adminUsers table showing accurate user count
  • Removed AdminNav component from main photo editing app (admin navigation only appears in admin section)
  • Admin navigation now properly displays: Dashboard, Messages, Downloads, Analytics, Users
- July 11, 2025: Enhanced authentication system with comprehensive password management:
  • Created detailed Authentication Guide documenting all signin, signup, forgot password, and change password flows
  • Implemented complete forgot password functionality with 3-step process: email → 2FA verification → new password
  • Added "Forgot Password?" link to login modal triggering secure reset flow
  • Built server API endpoints for unauthenticated password reset operations
  • Enhanced admin dashboard with refresh button allowing real-time stats updates
  • Added visual feedback with spinning icon during refresh operations and success/error toast notifications
  • Set light mode as default theme for new users (previously defaulted to system preference)
  • Created comprehensive help walkthrough feature using 5 screenshot guides showing complete user journey from upload to thank you stage
  • Added "How to Use" option in settings dropdown menu with step-by-step visual instructions and helpful tips for each stage
- July 14, 2025: Fixed critical image processing and URL generation issues:
  • Resolved image rescaling problem when changing text by updating all canvas coordinates from 180x180 to 400x400 dimensions
  • Fixed shareable URL timing issue where URLs displayed wrong text until manual resave
  • Added automatic URL regeneration after any image modification (text, color, position, scale)
  • Fixed initialization error in logToDatabase function and improved dependency management
  • Resolved initial text rendering bug where message keys appeared instead of actual text by adding loading checks
  • Removed ALL toast notifications from main app for smoother user experience (errors now logged to console instead)
- July 16, 2025: Completed database migration from Neon to Supabase:
  • Removed @neondatabase/serverless package and Neon-specific WebSocket configuration
  • Added standard PostgreSQL client (pg) for Supabase compatibility
  • Updated database connection to use drizzle-orm/node-postgres instead of neon-serverless
  • Added SSL configuration for production Supabase connections
  • Fixed download tracking bug - database logging now only occurs when user clicks "Continue to Download" button
  • Eliminated unwanted database entries during preview parameter changes (text, color, position, zoom)
  • Successfully migrated all essential data to Supabase:
    - Populated 11 EYV campaign messages in messages table
    - Created admin user account: ian@the-morgans.biz with password "hello"
    - Added 12 sample download records for admin analytics functionality
    - All API endpoints functioning correctly with Supabase database
    - Admin authentication system fully operational
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```