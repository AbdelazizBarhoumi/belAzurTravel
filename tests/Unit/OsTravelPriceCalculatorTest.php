<?php

namespace Tests\Unit;

use App\Services\OsTravel\OsTravelPriceCalculator;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Config;

class OsTravelPriceCalculatorTest extends TestCase
{
    private OsTravelPriceCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new OsTravelPriceCalculator;
    }

    public function test_apply_markup_rounds_to_nearest_integer(): void
    {
        // 927.520 * 1.2 = 1113.024 -> 1113
        $this->assertSame(1113, $this->calculator->applyMarkup(927.52, 20));
        // 100 * 1.0 = 100
        $this->assertSame(100, $this->calculator->applyMarkup(100, 0));
        // 88.5 * 1.3 = 115.05 -> 115
        $this->assertSame(115, $this->calculator->applyMarkup(88.5, 30));
    }

    public function test_per_night_derives_from_stay_total(): void
    {
        $this->assertSame(159.0, $this->calculator->perNight(1113, 7));
        $this->assertSame(205.71, $this->calculator->perNight(1440, 7));
        $this->assertSame(250.0, $this->calculator->perNight(500, 2));
        // Guard against a zero/invalid night count.
        $this->assertSame(0.0, $this->calculator->perNight(100, 0));
    }

    public function test_nights_between_counts_inclusive_departure_day(): void
    {
        $this->assertSame(7, $this->calculator->nightsBetween('2026-09-01', '2026-09-08'));
        $this->assertSame(1, $this->calculator->nightsBetween('2026-09-01', '2026-09-02'));
        $this->assertSame(0, $this->calculator->nightsBetween('2026-09-08', '2026-09-01'));
        $this->assertSame(0, $this->calculator->nightsBetween('2026-09-01', '2026-09-01'));
        $this->assertSame(0, $this->calculator->nightsBetween(null, '2026-09-08'));
        $this->assertSame(0, $this->calculator->nightsBetween('not-a-date', '2026-09-08'));
    }

    public function test_currency_falls_back_to_configured_default(): void
    {
        $this->assertSame('TND', $this->calculator->currency('tnd'));
        $this->assertSame('EUR', $this->calculator->currency('eur'));
        $this->assertSame('USD', $this->calculator->currency('USD'));

        Config::set('ostravel.currency.default', 'EUR');
        $this->assertSame('EUR', $this->calculator->currency(''));
        $this->assertSame('EUR', $this->calculator->currency(null));
    }
}
