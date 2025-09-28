<?php

use Illuminate\Support\Facades\Route;

// Serve the Vue.js SPA for all routes
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
