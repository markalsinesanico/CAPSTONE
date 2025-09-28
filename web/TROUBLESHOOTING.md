# Troubleshooting Guide

## 401 Unauthorized Error

If you're getting a 401 Unauthorized error when trying to log in, here are the steps to fix it:

### 1. Verify Database Setup
```bash
php artisan migrate:fresh --seed
```

### 2. Check Admin User
The admin user should be created with:
- **Email:** admin@gmail.com
- **Password:** password
- **Role:** admin

### 3. Test Login Manually
You can test the login endpoint manually using curl or Postman:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "password"
  }'
```

### 4. Check Laravel Logs
Check the Laravel logs for any errors:
```bash
tail -f storage/logs/laravel.log
```

### 5. Verify Sanctum Configuration
Make sure Sanctum is properly configured in `config/sanctum.php`.

### 6. Check CORS Settings
If you're getting CORS errors, make sure the CORS configuration is correct.

### 7. Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 8. Restart Servers
```bash
# Stop current servers and restart
php artisan serve
npm run dev
```

## Common Issues and Solutions

### Issue: "Trait HasApiTokens not found"
**Solution:** Make sure the import is added to User.php:
```php
use Laravel\Sanctum\HasApiTokens;
```

### Issue: "Column already exists"
**Solution:** Remove duplicate migrations and run:
```bash
php artisan migrate:fresh --seed
```

### Issue: "Invalid email or password"
**Solution:** 
1. Check if the user exists in the database
2. Verify the password is correct
3. Make sure the role is set to 'admin'

### Issue: "Only admin can log in"
**Solution:** Make sure the user has `role = 'admin'` in the database.

## Testing the API

You can test the API endpoints using these commands:

### Login Test
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "password"}'
```

### Expected Response
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

## Frontend Testing

1. Open browser developer tools (F12)
2. Go to Network tab
3. Try to log in
4. Check the request to `/api/login`
5. Look for any error messages in the response

## Debug Mode

To enable debug mode, set in `.env`:
```
APP_DEBUG=true
```

This will show detailed error messages instead of generic ones. 