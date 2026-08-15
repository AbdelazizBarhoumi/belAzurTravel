<?php

namespace Tests\Feature;

use App\Services\OsTravel\OsTravelImageProxy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HotelImageProxyTest extends TestCase
{
    use RefreshDatabase;

    public function test_proxy_url_round_trips_through_the_endpoint(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('image-bytes', 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $url = OsTravelImageProxy::publicUrl('https://93.184.216.34/file_manager/source/photos/room-501.jpg');
        $token = substr($url, strlen('/api/hotels/images/'));

        $this->get($url)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg')
            ->assertSee('image-bytes', false);
        $this->assertStringNotContainsString('93.184.216.34', $url);
    }

    public function test_proxy_token_rejects_private_host(): void
    {
        $token = OsTravelImageProxy::publicUrl('http://127.0.0.1/internal') ?: '';

        $this->get($token)->assertNotFound();
    }

    public function test_proxy_token_rejects_tampered_value(): void
    {
        $token = OsTravelImageProxy::publicUrl('https://93.184.216.34/file_manager/x.jpg') ?: '';

        $this->get($token.'AA')->assertNotFound();
    }

    public function test_proxy_returns_not_found_when_upstream_fails(): void
    {
        Http::fake([
            'https://93.184.216.34/*' => Http::response('up', 500),
        ]);

        $url = OsTravelImageProxy::publicUrl('https://93.184.216.34/file_manager/source/photos/room-501.jpg');

        $this->get($url)->assertNotFound();
    }
}
