<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use App\Models\User;

class AuthController extends Controller
{
public function login(Request $request)
{
    try {
        $validated = $request->validate([
            'name'     => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('name', $validated['name'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
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
    } catch (\Exception $e) {
        \Log::error('Login error: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json([
            'message' => 'Đã xảy ra lỗi khi đăng nhập',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
        ], 500);
    }
}

public function register(Request $request)
{
    // 1) Normalize input (trim + empty email -> null)
    $request->merge([
        'name'  => is_string($request->input('name')) ? trim($request->input('name')) : $request->input('name'),
        'email' => is_string($request->input('email')) ? trim($request->input('email')) : $request->input('email'),
    ]);

    if ($request->has('email') && $request->input('email') === '') {
        $request->merge(['email' => null]);
    }


    try {
        // 2) Validate
        $validated = $request->validate([
            'name'     => ['required', 'string', 'min:3', 'max:50', 'regex:/^[a-zA-Z0-9_-]+$/', 'unique:users,name'],
            'email'    => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'learning_language' => ['nullable', 'string', 'in:en,vi,ja'], // tuỳ bạn list
        ], [
            'name.required' => 'Tên đăng nhập là bắt buộc.',
            'name.min' => 'Tên đăng nhập phải có ít nhất 3 ký tự.',
            'name.max' => 'Tên đăng nhập không được vượt quá 50 ký tự.',
            'name.regex' => 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang.',
            'name.unique' => 'Tên đăng nhập đã được sử dụng.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã được sử dụng.',
            'password.required' => 'Mật khẩu là bắt buộc.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',
        ]);

        // 3) Build payload: CHỈ set những field chắc chắn hợp lệ với schema DB
        $userData = [
            'name'              => $validated['name'],
            'email'             => $validated['email'] ?? null,
            'password'          => Hash::make($validated['password']),
            'role'              => 'user',
            'learning_language' => $validated['learning_language'] ?? 'en',
        ];

        // Nếu DB của bạn avatar_url NOT NULL => bắt buộc set default (ví dụ)
        // Còn nếu avatar_url nullable => bạn có thể bỏ hẳn dòng này hoặc set null
        $userData['avatar_url'] = $request->input('avatar_url', 'default.png'); // <-- đổi theo hệ bạn

        // 4) Create user (transaction cho chắc)
        $user = DB::transaction(function () use ($userData) {
            return User::create($userData);
        });

        $token = $user->createToken('api-token')->plainTextToken;


        return response()->json([
            'message' => 'Đăng ký thành công',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], 201);

    } catch (ValidationException $e) {

        return response()->json([
            'message' => 'Dữ liệu không hợp lệ',
            'errors'  => $e->errors(),
        ], 422);

    } catch (QueryException $e) {
        // Nếu muốn map lỗi DB phổ biến ra 422 (tuỳ bạn)
        $msg = $e->getMessage();

        Log::error('Registration SQL error', [
            'code' => $e->getCode(),
            'message' => $msg,
            'sql' => method_exists($e, 'getSql') ? $e->getSql() : null,
            'bindings' => method_exists($e, 'getBindings') ? $e->getBindings() : null,
            'request' => $request->except(['password']),
        ]);

        // avatar_url NOT NULL / unique constraint / ...
        if (str_contains($msg, "Column 'avatar_url' cannot be null")) {
            return response()->json([
                'message' => 'Thiếu avatar mặc định (avatar_url không được null).',
            ], 422);
        }

        if (str_contains($msg, 'Duplicate entry')) {
            return response()->json([
                'message' => 'Tên đăng nhập hoặc email đã tồn tại.',
            ], 422);
        }

        return response()->json([
            'message' => 'Lỗi cơ sở dữ liệu',
            'error' => config('app.debug') ? $msg : 'Database error',
        ], 500);

    } catch (\Throwable $e) {
        Log::error('Registration error', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'request' => $request->except(['password']),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
        ]);

        return response()->json([
            'message' => 'Đã xảy ra lỗi khi đăng ký',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
}


    public function logout(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();

        return response()->json(['message' => 'Đăng xuất thành công']);
    }
}
