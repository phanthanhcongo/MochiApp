<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Đăng ký CORS middleware - PHẢI được đăng ký đầu tiên
        // Middleware này sẽ tự động đọc config từ config/cors.php
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Disable CSRF cho API routes
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Nếu cần middleware lang.redirect, hãy tạo file:
        // app/Http/Middleware/PLanguageRedirect.php
        // $middleware->alias([
        //     'lang.redirect' => \App\Http\Middleware\PLanguageRedirect::class,
        // ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

    })->create();



