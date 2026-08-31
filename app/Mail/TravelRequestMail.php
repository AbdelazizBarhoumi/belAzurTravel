<?php

namespace App\Mail;

use App\Models\TravelRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TravelRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public TravelRequest $travelRequest,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nouvelle demande de voyage sur mesure',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        $r = $this->travelRequest;

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                .field { margin-bottom: 12px; }
                .label { font-weight: bold; color: #555; }
                .value { color: #333; }
                .footer { background: #eee; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #888; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Nouvelle demande de voyage sur mesure</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Comité / Amicale :</span>
                        <span class="value">{$r->committee_name}</span>
                    </div>
                    <div class="field">
                        <span class="label">Nombre d'adhérents :</span>
                        <span class="value">{$r->member_count}</span>
                    </div>
                    <div class="field">
                        <span class="label">Contact :</span>
                        <span class="value">{$r->civility} {$r->first_name} {$r->last_name}</span>
                    </div>
                    <div class="field">
                        <span class="label">Téléphone :</span>
                        <span class="value">{$r->phone}</span>
                    </div>
                    <div class="field">
                        <span class="label">Email :</span>
                        <span class="value">{$r->email}</span>
                    </div>
                    <div class="field">
                        <span class="label">Demande :</span>
                        <div class="value" style="background: #fff; padding: 10px; border-radius: 4px; margin-top: 5px;">
                            {$r->message}
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <p>Ce message a été envoyé depuis le formulaire "Voyages organisés & à la carte" du site BelAzur Travel.</p>
                </div>
            </div>
        </body>
        </html>
        HTML;
    }
}
