# Authentication Setup Guide

This guide will help you set up the authentication system for your Laravel + Vue.js application.

## Prerequisites

- PHP 8.1+
- Composer
- Node.js & npm
- Database (MySQL/PostgreSQL/SQLite)

## Setup Steps

### 1. Install Dependencies

```bash
composer install
npm install
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env` and configure your database:

```bash
cp .env.example .env
php artisan key:generate
```

Update your `.env` file with your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 3. Run Migrations and Seeders

**For Windows (PowerShell):**
```powershell
.\setup-auth.ps1
```

**For Linux/Mac:**
```bash
chmod +x setup-auth.sh
./setup-auth.sh
```

**Manual setup:**
```bash
php artisan migrate
php artisan db:seed --class=AdminUserSeeder
```

### 4. Build Assets

```bash
npm run build
```

### 5. Start the Development Server

```bash
php artisan serve
npm run dev
```

## Default Admin Credentials

- **Email:** admin@gmail.com
- **Password:** password

## API Endpoints

### Authentication
- `POST /api/login` - Login with email and password
- `POST /api/logout` - Logout (requires authentication)
- `GET /api/user-info` - Get current user info (requires authentication)

### Request Format

**Login:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Admin User",
         "email": "admin@gmail.com",
     "role": "admin"
  },
  "message": "Login successful"
}
```

## Frontend Integration

The Vue.js frontend is already configured to:

1. Send login requests to `/api/login`
2. Store the authentication token in localStorage
3. Set the Authorization header for subsequent requests
4. Handle different error responses (401, 403)

## Security Features

- Only users with `role = 'admin'` can log in
- Uses Laravel Sanctum for API token authentication
- CSRF protection enabled
- Password hashing
- Token-based authentication for API requests

## Troubleshooting

### Common Issues

1. **"Only admin can log in" error**
   - Make sure the user has `role = 'admin'` in the database
   - Check if the migration ran successfully

2. **"Invalid email or password" error**
   - Verify the email and password are correct
   - Check if the user exists in the database

3. **CORS issues**
   - Make sure your frontend URL is in the `SANCTUM_STATEFUL_DOMAINS` config

4. **Token not working**
   - Check if the token is being sent in the Authorization header
   - Verify the token format: `Bearer {token}`

### Database Commands

```bash
# Check if admin user exists
php artisan tinker
>>> App\Models\User::where('role', 'admin')->first();

# Create a new admin user manually
php artisan tinker
>>> App\Models\User::create(['name' => 'New Admin', 'email' => 'newadmin@example.com', 'password' => Hash::make('password'), 'role' => 'admin']);
``` 