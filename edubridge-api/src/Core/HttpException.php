<?php
declare(strict_types=1);

namespace App\Core;

/** Thrown anywhere to return an error response: throw new HttpException(422, 'validation', [...]). */
final class HttpException extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        public readonly array $details = [],
        string $message = '',
    ) {
        parent::__construct($message ?: $errorCode, $status);
    }
}
