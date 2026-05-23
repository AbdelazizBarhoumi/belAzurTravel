<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel') }}</title>

        <meta name="description" content="BelAzur Travel">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta property="og:title" content="{{ config('app.name', 'Laravel') }}">
        <meta property="og:description" content="BelAzur Travel">
        <meta property="og:type" content="website">

        @php($brandLogo = Vite::asset('resources/js/assets/brand-logo.png'))

        {{-- Use the actual brand asset so the browser tab and touch icon match the app logo. --}}
        <link rel="icon" href="{{ $brandLogo }}" type="image/png" sizes="512x512">
        <link rel="apple-touch-icon" href="{{ $brandLogo }}">

        @viteReactRefresh
        @vite(['resources/js/main.tsx'])
    </head>
    <body class="font-sans antialiased">
        <div id="root"></div>
    </body>
</html>
