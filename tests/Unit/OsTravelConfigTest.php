<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class OsTravelConfigTest extends TestCase
{
    public function test_markup_default_is_20(): void
    {
        $this->assertSame(20, config('ostravel.markup.default'));
    }

    public function test_markup_default_is_overrideable_via_env(): void
    {
        Config::set('ostravel.markup.default', 15);

        $this->assertSame(15, config('ostravel.markup.default'));
    }

    public function test_credentials_resolve_from_config(): void
    {
        $this->assertIsString(config('ostravel.base_url'));
        $this->assertIsString(config('ostravel.login'));
        $this->assertIsString(config('ostravel.password'));
    }

    public function test_currency_default_is_tnd(): void
    {
        $this->assertSame('TND', config('ostravel.currency.default'));
    }

    public function test_sync_settings_are_configured(): void
    {
        $this->assertIsArray(config('ostravel.sync.countries'));
        $this->assertSame(150, config('ostravel.sync.throttle_ms'));
        $this->assertSame(50, config('ostravel.sync.bulk_approve_max'));
        $this->assertSame(180, config('ostravel.sync.lock_ttl_minutes'));
        $this->assertSame('daily', config('ostravel.sync.schedule.interval'));
        $this->assertSame('02:00', config('ostravel.sync.schedule.at'));
        $this->assertSame(3, config('ostravel.retry.times'));
    }
}
