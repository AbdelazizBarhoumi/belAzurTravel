<?php

namespace App\Services\OsTravel;

use App\Exceptions\OsTravelApiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin, typed client for the OS-TRAVEL Hotel API.
 *
 * Every call POSTs to `/api/hotel/{Endpoint}` with a nested `Credential`
 * object and a shared envelope response (`{ <Endpoint>: [...], CountResults,
 * ErrorMessage, ... }`). Errors surface as {@see OsTravelApiException}.
 */
class OsTravelClient
{
    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listCountries(): array
    {
        return $this->post('ListCountry');
    }

    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listCities(string $countryId): array
    {
        return $this->post('ListCity', ['Country' => $countryId]);
    }

    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listBoardings(): array
    {
        return $this->post('ListBoarding');
    }

    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listCategories(): array
    {
        return $this->post('ListCategorie');
    }

    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listCurrencies(): array
    {
        return $this->post('ListCurrency');
    }

    /**
     * Returns the raw decoded envelope so the sync service can detect
     * pagination metadata (e.g. `Page`, `TotalPages`) and loop if present.
     * Pass an integer page to include a `Paginator` payload.
     *
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function listHotels(string $cityId, ?int $page = null): array
    {
        $payload = ['City' => $cityId];

        if ($page !== null) {
            $payload['Paginator'] = ['Page' => $page, 'CountPerPage' => 100];
        }

        return $this->post('ListHotel', $payload);
    }

    /**
     * @return array<int|string, mixed> Decoded response envelope.
     */
    public function hotelDetail(string $hotelId): array
    {
        return $this->post('HotelDetail', ['Hotel' => $hotelId]);
    }

    /**
     * @param  array<string, mixed>  $extra  Payload keys merged alongside the credential.
     * @return array<int|string, mixed> Decoded response envelope.
     */
    protected function post(string $endpoint, array $extra = []): array
    {
        $payload = array_merge(['Credential' => $this->credentials()], $extra);

        try {
            $response = $this->request()->post("/api/hotel/{$endpoint}", $payload);
        } catch (ConnectionException $e) {
            throw new OsTravelApiException(
                "OS-TRAVEL {$endpoint} unreachable: {$e->getMessage()}",
                $endpoint,
            );
        } catch (RequestException $e) {
            throw new OsTravelApiException(
                "OS-TRAVEL {$endpoint} returned HTTP {$e->response?->status()}.",
                $endpoint,
                $e->response?->status(),
            );
        }

        return $this->decode($endpoint, $response);
    }

    /**
     * Build the shared PendingRequest: JSON, timeout, and retry on transient
     * statuses (429/5xx, from config) plus connection failures.
     */
    protected function request(): PendingRequest
    {
        $retry = config('ostravel.retry', []);

        return Http::baseUrl(config('ostravel.base_url'))
            ->asJson()
            ->timeout(config('ostravel.timeout', 30))
            ->retry(
                $retry['times'] ?? 3,
                $retry['sleep'] ?? 100,
                function (Throwable $exception) use ($retry): bool {
                    if ($exception instanceof ConnectionException) {
                        return true;
                    }

                    return in_array($exception->response?->status(), $retry['when'] ?? [], true);
                }
            );
    }

    /**
     * @param  array<int|string, mixed>  $data
     * @return array<int|string, mixed>
     */
    protected function decode(string $endpoint, Response $response): array
    {
        if (! $response->successful()) {
            throw new OsTravelApiException(
                "OS-TRAVEL {$endpoint} returned HTTP {$response->status()}.",
                $endpoint,
                $response->status(),
            );
        }

        $data = is_array($response->json()) ? $response->json() : [];

        $error = $data['ErrorMessage'] ?? null;

        if (! empty($error)) {
            throw new OsTravelApiException(
                "OS-TRAVEL {$endpoint} error: {$this->flattenError($error)}",
                $endpoint,
                is_numeric($error['Code'] ?? null) ? (int) $error['Code'] : null,
                $data,
            );
        }

        return $data;
    }

    /**
     * @return array{Login: string, Password: string}
     */
    protected function credentials(): array
    {
        return [
            'Login' => config('ostravel.login'),
            'Password' => config('ostravel.password'),
        ];
    }

    /**
     * `ErrorMessage` is an empty array on success and either a string, a list
     * of messages, or a `{Code, Description}` object on failure.
     */
    protected function flattenError(mixed $error): string
    {
        if (is_string($error)) {
            return $error;
        }

        if (is_array($error)) {
            if (isset($error['Description'])) {
                return (string) $error['Description'];
            }

            return implode('; ', array_map(
                fn ($item) => is_scalar($item) ? (string) $item : json_encode($item),
                $error
            ));
        }

        return (string) json_encode($error);
    }
}
