#!/bin/bash

echo "Setting up authentication system..."

# Run migrations
echo "Running migrations..."
php artisan migrate

# Run the admin user seeder
echo "Creating admin user..."
php artisan db:seed --class=AdminUserSeeder

echo "Setup complete!"
echo "Admin credentials:"
echo "Email: admin@gmail.com"
echo "Password: password" 