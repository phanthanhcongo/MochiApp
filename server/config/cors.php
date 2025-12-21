<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3005',
        'http://127.0.0.1:3005',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://100.87.242.47:3005',
        'http://192.168.1.56:3005',
        'http://100.87.242.47:8000',
        'http://192.168.1.56:8000',
    ],

    'allowed_origins_patterns' => [
        // Cho phép tất cả IP Tailscale (100.x.x.x) với bất kỳ port nào
        '#^http://100\.\d+\.\d+\.\d+(:\d+)?$#',
        // Cho phép localhost và local IP
        '#^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
