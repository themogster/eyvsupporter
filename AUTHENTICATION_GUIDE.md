# EYV Support Authentication System Guide

## Overview

The EYV Support app features a comprehensive authentication system with role-based access control, 2FA verification, and secure password management. The system supports both regular users and admin users with different privilege levels.

## Authentication Flow Architecture

### User Roles
- **User** (default): Can access main photo editing features
- **Admin**: Can access admin dashboard and manage system settings

### Session Management
- PostgreSQL-based session storage using `connect-pg-simple`
- Session data includes user ID, email, and role
- Sessions persist across browser restarts
- Automatic session cleanup for expired tokens

## Sign Up (Registration) Process

### 4-Step Progressive Registration Flow

#### Step 1: Welcome & Email Collection
- User enters email address
- Email validation (required, valid format)
- Duplicate email prevention
- Server validates email doesn't already exist

#### Step 2: Email Verification
- 6-digit verification code sent to user's email via SendGrid
- Code expires after 10 minutes
- User can request new code if needed
- Server validates code matches and hasn't expired

#### Step 3: Password Creation
- Password strength requirements:
  - Minimum 12 characters
  - Must contain uppercase letter
  - Must contain lowercase letter  
  - Must contain number
  - Must contain special symbol
- Password confirmation field
- Real-time password strength indicator
- Server-side validation matches client requirements

#### Step 4: Account Creation & Auto-Login
- User account created with default "user" role
- Password hashed using scrypt with salt
- User automatically logged in after successful registration
- Admin users redirected to admin dashboard

### API Endpoints
```
POST /api/admin/register-step1 - Email collection
POST /api/admin/register-step2 - Email verification  
POST /api/admin/register-step3 - Password setup & account creation
```

## Sign In Process

### Simple Email/Password Authentication
- User enters email and password
- Server validates credentials using scrypt password comparison
- No 2FA required for login (only for registration and password changes)
- Session created with user data and role
- Admin users can access admin dashboard
- Regular users access main photo editing app

### API Endpoints
```
POST /api/admin/login - User authentication
```

## Forgot Password Process

### 3-Step Password Recovery Flow

#### Step 1: Email Submission
- User clicks "Forgot Password?" link on login form
- Enters email address
- Server checks if user exists (doesn't reveal if email exists for security)
- If user exists, 2FA code sent to email

#### Step 2: Email Verification
- 6-digit verification code sent via SendGrid
- Code expires after 10 minutes
- User can request new code
- Server validates code matches and hasn't expired

#### Step 3: New Password Creation
- Same password strength requirements as registration
- Password confirmation field
- Server validates password meets requirements
- Password hashed and stored
- User returned to login form with success message

### API Endpoints
```
POST /api/admin/request-password-reset - Request reset code
POST /api/admin/verify-password-reset - Verify reset code
POST /api/admin/reset-password - Set new password
```

## Change Password Process (Authenticated Users)

### 2-Step Password Change Flow

#### Step 1: Email Verification
- User must be logged in
- 2FA verification required for security
- 6-digit code sent to user's current email
- Code expires after 10 minutes

#### Step 2: New Password Creation
- Same password strength requirements
- Password confirmation field
- Server validates user is changing their own password
- Password hashed and stored
- Success confirmation

### API Endpoints
```
POST /api/admin/request-password-change - Request change code
POST /api/admin/verify-password-change - Verify change code
POST /api/admin/change-password - Update password
```

## Security Features

### Password Security
- **Hashing**: Uses scrypt with random salt for each password
- **Strength Requirements**: 12+ characters with mixed case, numbers, symbols
- **Server Validation**: All password rules validated on both client and server
- **Timing Safety**: Uses `timingSafeEqual` for password comparison

### 2FA Email Verification
- **SendGrid Integration**: Professional email delivery via i-love-eyv.com domain
- **Token Generation**: 6-digit numeric codes
- **Expiration**: 10-minute token lifetime
- **One-Time Use**: Tokens marked as used after verification
- **Cleanup**: Automatic cleanup of expired tokens

### Session Security
- **PostgreSQL Storage**: Sessions stored in database, not memory
- **Secure Cookies**: HTTP-only cookies with proper settings
- **Role-Based Access**: Middleware checks user roles for protected routes
- **Auto-Logout**: Invalid sessions automatically cleared

## User Interface Components

### NewAuthModal Component
- **Responsive Design**: Works on mobile and desktop
- **Progressive Flow**: Step-by-step guided experience
- **Theme Support**: Full light/dark mode compatibility
- **Error Handling**: Clear error messages for all failure cases
- **Loading States**: Proper loading indicators during API calls

### Settings Dropdown
- **Profile Management**: Shows current user info and role
- **Theme Switcher**: Light/dark mode toggle
- **Password Change**: Quick access to change password
- **Logout**: Secure session termination

### Admin Components
- **Role-Based Navigation**: Admin-only sections protected
- **User Management**: Admin can manage other users
- **Password Reset**: Admin can reset user passwords
- **Analytics Access**: Admin dashboard and reports

## Database Schema

### Admin Users Table
```sql
admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
)
```

### Two-Factor Tokens Table
```sql
two_factor_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL,
  token VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- 'registration', 'password_reset', 'password_change'
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Error Handling

### Client-Side Errors
- **Form Validation**: Real-time validation with clear error messages
- **API Errors**: Toast notifications for all API failures
- **Network Errors**: Handled gracefully with retry options
- **Loading States**: Prevent double-submissions during API calls

### Server-Side Errors
- **Input Validation**: All inputs validated before processing
- **Database Errors**: Proper error handling and logging
- **Email Failures**: Graceful handling of SendGrid failures
- **Security Errors**: Appropriate HTTP status codes and messages

## Configuration

### Environment Variables
- `SENDGRID_API_KEY`: Required for email functionality
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

### Email Configuration
- **From Address**: Uses i-love-eyv.com domain
- **Templates**: HTML and plain text versions
- **Rate Limiting**: Built-in SendGrid rate limiting
- **Delivery Tracking**: Success/failure logging

## Testing & Verification

### Manual Testing Checklist
- [ ] User registration complete flow
- [ ] Email verification codes received
- [ ] Password strength validation
- [ ] Login with correct credentials
- [ ] Forgot password flow
- [ ] Change password while logged in
- [ ] Admin vs user role access
- [ ] Session persistence across browser restart
- [ ] Logout functionality
- [ ] Theme switching with auth state

### Common Issues & Solutions
1. **Email not received**: Check spam folder, verify SendGrid API key
2. **Password rejected**: Ensure all strength requirements met
3. **Session expired**: User will be redirected to login
4. **Admin access denied**: Verify user has admin role in database
5. **Database connection**: Check DATABASE_URL environment variable

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Error Response
```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE" // Optional
}
```

## Future Enhancements

### Potential Improvements
- **Multi-Factor Authentication**: SMS or authenticator app support
- **Social Login**: Google, Facebook, or GitHub integration
- **Password History**: Prevent reuse of recent passwords
- **Account Recovery**: Additional recovery options beyond email
- **Rate Limiting**: Prevent brute force attacks
- **Audit Logging**: Track all authentication events
- **Email Templates**: Customizable HTML email templates
- **User Preferences**: Allow users to set communication preferences