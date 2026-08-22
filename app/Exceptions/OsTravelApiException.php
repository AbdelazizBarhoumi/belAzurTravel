<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when the OS-TRAVEL Hotel API rejects a request: a non-success HTTP
 * status (after retries are exhausted) or a non-empty `ErrorMessage` payload.
 */
class OsTravelApiException extends RuntimeException
{
    private ?string $endpoint;

    private ?int $status;

    private ?array $payload;

    public function __construct(
        string $message,
        ?string $endpoint = null,
        ?int $status = null,
        ?array $payload = null
    ) {
        parent::__construct($message);

        $this->endpoint = $endpoint;
        $this->status = $status;
        $this->payload = $payload;
    }

    public function endpoint(): ?string
    {
        return $this->endpoint;
    }

    public function status(): ?int
    {
        return $this->status;
    }

    public function payload(): ?array
    {
        return $this->payload;
    }
}
