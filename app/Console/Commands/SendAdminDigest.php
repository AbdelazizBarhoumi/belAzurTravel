<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\BookingAudit;
use App\Models\Complaint;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\AdminDigestNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class SendAdminDigest extends Command
{
    protected $signature = 'send:admin-digest';

    protected $description = 'Email admins a daily digest of operations activity';

    public function handle(): int
    {
        $since = now()->subDay();

        $bookings = Booking::query()->where('created_at', '>=', $since)->get();
        $complaints = Complaint::query()->where('created_at', '>=', $since)->get();
        $messages = SupportInquiry::query()->where('created_at', '>=', $since)->get();
        $audits = BookingAudit::query()->with('booking:id,booking_ref')->where('created_at', '>=', $since)->get()->groupBy('action');

        $recipients = User::query()->where('active', true)->whereIn('role', ['admin'])->get();

        if ($recipients->isEmpty()) {
            $this->info('No active admins to notify.');

            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($recipients as $admin) {
            $locale = $admin->preferred_language ?? app()->getLocale();
            $label = fn (string $key) => __('emails.digest.labels.'.$key, [], $locale);

            $sections = [
                $this->section($label('new_bookings'), $bookings->map(fn (Booking $b) => $this->bookingItem($b))->all()),
                $this->section($label('approvals'), $this->auditItems($audits, ['approved', 'confirmed'])),
                $this->section($label('rejections'), $this->auditItems($audits, ['rejected'])),
                $this->section($label('cancellations'), $this->auditItems($audits, ['cancelled'])),
                $this->section($label('complaints'), $complaints->map(fn (Complaint $c) => $this->complaintItem($c))->all()),
                $this->section($label('refunds'), $complaints->where('type', 'refund_request')->map(fn (Complaint $c) => $this->complaintItem($c))->all()),
                $this->section($label('messages'), $messages->map(fn (SupportInquiry $m) => $this->messageItem($m))->all()),
            ];

            $admin->notify(new AdminDigestNotification($sections, now()->toDateString()));
            $sent++;
        }

        $this->info("Sent daily digest to {$sent} admin(s).");

        return self::SUCCESS;
    }

    /** @return array{label: string, items: array<int, array{title: string, url: string}>} */
    private function section(string $label, array $items): array
    {
        return ['label' => $label, 'items' => $items];
    }

    /** @return array{title: string, url: string} */
    private function bookingItem(Booking $booking): array
    {
        return [
            'title' => 'Booking #'.($booking->booking_ref ?: $booking->id).' — '.($booking->client['name'] ?? $booking->client['email'] ?? 'Client').' ('.$booking->status.')',
            'url' => config('app.url').'/admin/bookings/'.$booking->id,
        ];
    }

    /** @return array<int, array{title: string, url: string}> */
    private function auditItems(Collection $audits, array $actions): array
    {
        return $audits
            ->flatMap(fn (Collection $group) => $group)
            ->filter(fn (BookingAudit $audit) => in_array($audit->action, $actions, true))
            ->map(fn (BookingAudit $audit) => [
                'title' => 'Booking #'.($audit->booking->booking_ref ?: $audit->booking_id).' — '.$audit->action,
                'url' => config('app.url').'/admin/bookings/'.$audit->booking_id,
            ])
            ->values()
            ->all();
    }

    /** @return array{title: string, url: string} */
    private function complaintItem(Complaint $complaint): array
    {
        $subject = is_array($complaint->subject) ? ($complaint->subject['en'] ?? 'Complaint') : ($complaint->subject ?? 'Complaint');

        return [
            'title' => 'Complaint #'.$complaint->id.' — '.$subject,
            'url' => config('app.url').'/admin/complaints',
        ];
    }

    /** @return array{title: string, url: string} */
    private function messageItem(SupportInquiry $inquiry): array
    {
        return [
            'title' => 'Support #'.$inquiry->id.' — '.($inquiry->client['name'] ?? 'Client'),
            'url' => config('app.url').'/admin/queue',
        ];
    }
}
