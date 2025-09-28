Write-Host "Setting up authentication system..." -ForegroundColor Green

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
php artisan migrate

# Run the admin user seeder
Write-Host "Creating admin user..." -ForegroundColor Yellow
php artisan db:seed --class=AdminUserSeeder

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Admin credentials:" -ForegroundColor Cyan
Write-Host "Email: admin@gmail.com" -ForegroundColor White
Write-Host "Password: password" -ForegroundColor White 