<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        
        Log::info('Login attempt', ['email' => $credentials['email']]);

        if (!Auth::attempt($credentials)) {
            Log::warning('Login failed - invalid credentials', ['email' => $credentials['email']]);
            return response()->json(['message' => 'Invalid email or password'], 401);
        }

        $user = Auth::user();
        Log::info('User authenticated', ['user_id' => $user->id, 'role' => $user->role]);

        // Generate token using Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;
        
        Log::info('Login successful', ['user_id' => $user->id, 'token' => substr($token, 0, 10) . '...']);

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Login successful',
            'role' => $user->role // Adding role to response
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}