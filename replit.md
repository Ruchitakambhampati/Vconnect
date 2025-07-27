# VendorConnect - Vendor-Wholesaler Marketplace

## Overview

VendorConnect is a Node.js-based web application that connects street vendors with wholesale suppliers through a contract-based marketplace system. The platform facilitates automated order management, delivery tracking, and payment processing between vendors and wholesalers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js server with session-based authentication
- **Database**: PostgreSQL with connection pooling via `pg` package
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Authentication**: Role-based access control (vendor/wholesaler) with bcrypt password hashing
- **Template Engine**: EJS with express-ejs-layouts for server-side rendering

### Frontend Architecture
- **Rendering**: Server-side rendered pages using EJS templates
- **Styling**: Custom CSS with Bootstrap-like utilities
- **JavaScript**: Vanilla JavaScript with utility functions for API calls and UI interactions
- **Internationalization**: Multi-language support (English, Hindi, Spanish) using i18n

## Key Components

### Authentication System
- Session-based authentication with role-based access control
- Two user roles: `vendor` and `wholesaler`
- Middleware protection for routes requiring authentication or specific roles
- Secure password hashing using bcrypt

### Database Models
- **User Model**: Handles user management with role-based access
- **Contract Model**: Manages wholesale contracts with pricing and delivery terms
- **Order Model**: Tracks orders between vendors and contracts

### Route Structure
- **Auth Routes**: Login, register, and session management
- **Vendor Routes**: Dashboard, contract browsing, order management
- **Wholesaler Routes**: Dashboard, contract creation, delivery management
- **API Routes**: RESTful endpoints for AJAX operations

### Contract System
- Wholesalers create contracts specifying product, quantity, price, and duration
- Vendors can browse and accept available contracts
- Contract-based guaranteed supply with automated delivery scheduling

## Data Flow

1. **User Registration**: Users register as either vendors or wholesalers
2. **Contract Creation**: Wholesalers create contracts with product details and terms
3. **Contract Discovery**: Vendors browse available contracts
4. **Order Placement**: Vendors place orders against accepted contracts
5. **Delivery Management**: Wholesalers track and fulfill deliveries
6. **Payment Processing**: Automated payment calculations based on contract terms

## External Dependencies

### Core Dependencies
- **express**: Web application framework
- **pg**: PostgreSQL client for database operations
- **bcrypt**: Password hashing and security
- **express-session**: Session management
- **ejs**: Template engine for server-side rendering
- **i18n**: Internationalization support

### Additional Libraries
- **connect-pg-simple**: PostgreSQL session store
- **express-ejs-layouts**: Layout support for EJS
- **memoizee**: Function memoization for performance
- **openid-client**: OpenID Connect authentication (prepared for future OAuth integration)

## Deployment Strategy

### Database Setup
- PostgreSQL database with connection pooling
- Environment-based configuration with `DATABASE_URL`
- SSL support for production environments
- Session storage in PostgreSQL `session` table

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secret via `SESSION_SECRET` environment variable
- Production SSL configuration for secure cookies

### Application Structure
- Modular route organization by user type (vendor/wholesaler)
- Middleware-based authentication and authorization
- Static asset serving from `public` directory
- Internationalization files in `locales` directory

### Performance Considerations
- Connection pooling for database efficiency
- Memoization support for caching frequently accessed data
- Session-based state management to reduce database queries
- Static asset optimization through Express static middleware

The application follows a traditional MVC pattern with clear separation of concerns, making it maintainable and scalable for the vendor-wholesaler marketplace use case.