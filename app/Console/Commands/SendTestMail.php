<?php

namespace App\Console\Commands;

use App\Support\CommercialMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTestMail extends Command
{
    protected $signature = 'mail:test {to? : Recipient (defaults to the commercial inbox)}';

    protected $description = 'Send a test email synchronously and print the exact SMTP error on failure';

    public function handle(): int
    {
        $to = $this->argument('to') ?: CommercialMail::address();
        $mailer = config('mail.default');

        $this->line("Mailer: {$mailer}");
        if ($mailer === 'smtp') {
            $this->line(sprintf(
                'SMTP: %s:%s (scheme: %s, user: %s)',
                config('mail.mailers.smtp.host'),
                config('mail.mailers.smtp.port'),
                config('mail.mailers.smtp.scheme') ?: 'auto',
                config('mail.mailers.smtp.username') ?: '-',
            ));
        }
        $this->line('From: '.config('mail.from.address'));
        $this->line("To: {$to}");

        try {
            Mail::raw(
                'This is a test email from '.config('app.name').' sent at '.now()->toDateTimeString().'.',
                fn ($message) => $message->to($to)->subject(config('app.name').' — test email'),
            );
        } catch (Throwable $e) {
            $this->error('Sending failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Sent. Check the inbox (and spam folder).');

        return self::SUCCESS;
    }
}
