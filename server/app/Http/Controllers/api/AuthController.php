<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
public function login(Request $request)
{
    $validated = $request->validate([
        'name'     => 'required|string', // đổi từ username -> name
        'password' => 'required|string',
    ]);

    $user = User::where('name', $validated['name'])->first();

    if (!$user || !\Illuminate\Support\Facades\Hash::check($validated['password'], $user->password)) {
        return response()->json(['message' => 'Tài khoản hoặc mật khẩu không đúng'], 401);
    }

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'message' => 'Đăng nhập thành công',
        'token'   => $token,
        'user'    => [
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'role'     => $user->role,
        ]
    ]);
}

public function register(Request $request)
{
    $validated = $request->validate([
        'name'     => 'required|string|unique:users,name', // dùng name làm username
        'email'    => 'nullable|email|unique:users,email',
        'password' => 'required|string|min:6',
    ]);

    $user = User::create([
        'name'     => $validated['name'],
        'email'    => $validated['email'] ?? ($validated['name'].'@example.com'), // nếu bạn muốn cho phép thiếu email
        'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
        'role'     => 'customer',
    ]);

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'message' => 'Đăng ký thành công',
        'token'   => $token,
        'user'    => [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ]
    ], 201);
}


    public function logout(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();

        return response()->json(['message' => 'Đăng xuất thành công']);
    }
}
