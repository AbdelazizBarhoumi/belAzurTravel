<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Vite;
use Tests\TestCase;

class BrandIconTest extends TestCase
{
    public function test_home_page_uses_the_brand_logo_for_favicon_and_touch_icon(): void
    {
        $response = $this->get(route('home'));

        $response->assertOk();

        $brandLogo = Vite::asset('resources/js/assets/brand-logo.png');

        $response->assertSee('rel="icon"', false);
        $response->assertSee($brandLogo, false);
        $response->assertSee('rel="apple-touch-icon"', false);
    }
}
