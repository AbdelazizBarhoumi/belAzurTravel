<?php

namespace App\Console\Commands;

use App\Exceptions\OsTravelApiException;
use App\Services\OsTravel\OsTravelClient;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ProbeOsTravelAvailability extends Command
{
    protected $signature = 'os-travel:probe-availability
        {externalIds* : Provider hotel ids, space separated (e.g. 117 377)}
        {--check-in= : Base check-in date (default tomorrow)}
        {--nights=8 : Sweep check-out 1..N nights from the check-in}
        {--throttle=150 : Delay in ms between provider calls}';

    protected $description = 'Probe the provider across a check-out window matrix to characterize MinStay / StopSales / OnRequest / StopReservation rules';

    public function handle(OsTravelClient $client): int
    {
        $ids = array_map('intval', $this->argument('externalIds'));
        $checkIn = $this->option('check-in') ?? Carbon::today()->addDay()->toDateString();
        $nights = max(1, (int) $this->option('nights'));
        $throttle = max(0, (int) $this->option('throttle'));

        $this->info(sprintf('Hotels: %s | check-in: %s | windows: 1..%d night(s)', implode(', ', $ids), $checkIn, $nights));
        $this->newLine();

        foreach (range(1, $nights) as $n) {
            $checkOut = Carbon::parse($checkIn)->addDays($n)->toDateString();

            foreach ([false, true] as $onlyAvailable) {
                $this->line(sprintf(
                    '--- %s → %s (%d night%s) OnlyAvailable=%s ---',
                    $checkIn,
                    $checkOut,
                    $n,
                    $n > 1 ? 's' : '',
                    $onlyAvailable ? 'true' : 'false',
                ));
                $this->probeWindow($client, $ids, $checkIn, $checkOut, $onlyAvailable);

                if ($throttle > 0) {
                    usleep($throttle * 1000);
                }
            }

            $this->newLine();
        }

        return self::SUCCESS;
    }

    /**
     * @param  list<int>  $ids
     */
    private function probeWindow(OsTravelClient $client, array $ids, string $checkIn, string $checkOut, bool $onlyAvailable): void
    {
        try {
            $envelope = $client->hotelSearch([
                'BookingDetails' => [
                    'CheckIn' => $checkIn,
                    'CheckOut' => $checkOut,
                    'Hotels' => $ids,
                ],
                'Filters' => [
                    'OnlyAvailable' => $onlyAvailable,
                ],
                'Rooms' => [['Adult' => 1, 'Child' => []]],
            ]);
        } catch (OsTravelApiException $e) {
            $this->warn("  error: {$e->getMessage()}");

            return;
        }

        $returned = $envelope['HotelSearch'] ?? [];

        if ($returned === []) {
            $this->line('  no hotels returned');

            return;
        }

        foreach ($returned as $hotel) {
            $hotelId = $hotel['Hotel']['Id'] ?? $hotel['Id'] ?? '?';
            $this->line(sprintf(
                '  hotel %s — token: %s | source: %s',
                $hotelId,
                $hotel['Token'] ?? '-',
                $hotel['Source'] ?? '-',
            ));

            $rooms = $this->rooms($hotel);

            if ($rooms === []) {
                $this->line('    (no rooms in response)');

                continue;
            }

            foreach ($rooms as $room) {
                $this->line(sprintf(
                    '    room %-6s %-34s price=%-9s minstay=%-3s stop_res=%-5s on_request=%-5s stop_sales=%s',
                    $room['Id'] ?? '-',
                    mb_substr((string) ($room['Name'] ?? ''), 0, 34),
                    (string) ($room['Price'] ?? $room['BasePrice'] ?? '-'),
                    (string) ($room['MinStay'] ?? '-'),
                    isset($room['StopReservation']) ? var_export($room['StopReservation'], true) : '-',
                    isset($room['OnRequest']) ? var_export($room['OnRequest'], true) : '-',
                    $this->stopSales($room['StopSales'] ?? []),
                ));
            }
        }
    }

    /**
     * @param  array<string, mixed>  $hotel
     * @return list<array<string, mixed>>
     */
    private function rooms(array $hotel): array
    {
        $rooms = [];

        foreach ($hotel['Price']['Boarding'] ?? [] as $boarding) {
            foreach ($boarding['Pax'] ?? [] as $pax) {
                foreach ($pax['Rooms'] ?? [] as $room) {
                    $rooms[] = $room;
                }
            }
        }

        return $rooms;
    }

    private function stopSales(mixed $stopSales): string
    {
        if ($stopSales === [] || $stopSales === null) {
            return '-';
        }

        if (is_string($stopSales)) {
            return $stopSales;
        }

        if (isset($stopSales['FromDate']) || isset($stopSales['ToDate'])) {
            return sprintf('%s → %s', $stopSales['FromDate'] ?? '?', $stopSales['ToDate'] ?? '?');
        }

        if (isset($stopSales[0]) && is_array($stopSales[0])) {
            $parts = array_map(fn ($s) => $this->stopSales($s), $stopSales);

            return '['.implode(', ', $parts).']';
        }

        return json_encode($stopSales);
    }
}