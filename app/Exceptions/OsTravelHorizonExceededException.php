<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when the OS-TRAVEL provider rejects a search because the requested
 * CheckIn/CheckOut dates fall beyond the bookable horizon ("CheckIn dépasser").
 * Probing further forward is pointless, so callers treat the affected chunk as
 * having no availability rather than as a transient provider failure.
 */
class OsTravelHorizonExceededException extends RuntimeException
{
}