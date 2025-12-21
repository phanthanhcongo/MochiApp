<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $levels = [];

    protected $dontReport = [];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    // 👉 Đây là phần mình custom thêm cho API:
    public function render($request, Throwable $exception)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            // Handle authentication exceptions
            if ($exception instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthorized. Please login again.',
                    'error' => 'Unauthorized'
                ], 401);
            }

            // Handle validation exceptions
            if ($exception instanceof ValidationException) {
                return response()->json([
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $exception->errors()
                ], 422);
            }

            // Handle database connection errors
            if ($exception instanceof \Illuminate\Database\QueryException || 
                $exception instanceof \PDOException) {
                $message = $exception->getMessage();
                $isConnectionError = 
                    str_contains($message, 'SQLSTATE') ||
                    str_contains($message, 'Connection') ||
                    str_contains($message, 'could not find driver') ||
                    str_contains($message, 'Access denied') ||
                    str_contains($message, 'Unknown database');
                
                if ($isConnectionError) {
                    return response()->json([
                        'message' => 'Không thể kết nối đến database. Vui lòng kiểm tra database server có đang chạy không.',
                        'error' => config('app.debug') ? $message : 'Database connection error',
                        'type' => 'database_connection'
                    ], 500);
                }
            }
        }

        return parent::render($request, $exception);
    }
}
