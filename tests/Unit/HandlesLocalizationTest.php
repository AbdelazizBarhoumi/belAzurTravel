<?php

namespace Tests\Unit;

use App\Concerns\HandlesLocalization;
use Tests\TestCase;

class HandlesLocalizationTest extends TestCase
{
    private $testClass;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testClass = new class
        {
            use HandlesLocalization;

            public function test_localized(array $data, string $key)
            {
                return $this->localized($data, $key);
            }

            public function test_flat_localized(string $key, ?array $value)
            {
                return $this->flatLocalized($key, $value);
            }
        };
    }

    public function test_localized_maps_correctly()
    {
        $data = [
            'title' => 'Base',
            'title_en' => 'English',
            'title_fr' => 'French',
            'title_ar' => 'Arabic',
        ];

        $result = $this->testClass->testLocalized($data, 'title');

        $this->assertEquals([
            'fr' => 'French',
            'ar' => 'Arabic',
            'en' => 'English',
        ], $result);
    }

    public function test_flat_localized_maps_correctly()
    {
        $value = [
            'en' => 'English',
            'fr' => 'French',
            'ar' => 'Arabic',
        ];

        $result = $this->testClass->testFlatLocalized('title', $value);

        $this->assertEquals([
            'title' => 'English',
            'title_fr' => 'French',
            'title_ar' => 'Arabic',
            'title_en' => 'English',
        ], $result);
    }
}
