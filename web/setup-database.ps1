Write-Host "Setting up database with admin user..." -ForegroundColor Green

# Run fresh migrations and seed
Write-Host "Running fresh migrations and seeding..." -ForegroundColor Yellow
php artisan migrate:fresh --seed

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "Admin credentials:" -ForegroundColor Cyan
Write-Host "Email: admin@gmail.com" -ForegroundColor White
Write-Host "Password: password" -ForegroundColor White
Write-Host ""
Write-Host "You can now start the servers:" -ForegroundColor Yellow
Write-Host "php artisan serve" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White 