<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VisaApplication;
use App\Security\PassportVault;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admin view of visa applications. Passport data is decrypted on demand only:
 * numbers are masked in the list, and the scan is streamed (never cached).
 */
class AdminVisaApplicationController extends Controller
{
    public const STATUSES = ['pending', 'processing', 'approved', 'rejected'];

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));
        $status = $request->query('status');

        $page = VisaApplication::query()
            ->with('visa')
            ->when(in_array($status, self::STATUSES, true), fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q
                ->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhereHas('visa', fn ($v) => $v->where('code', $search)->orWhere('name', 'like', "%{$search}%"))))
            ->latest()
            ->paginate(min(100, max(10, (int) $request->query('per_page', 25))));

        return response()->json([
            'data' => collect($page->items())->map(fn (VisaApplication $a) => $this->payload($a, masked: true)),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
                'counts' => VisaApplication::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            ],
        ]);
    }

    public function show(int|string $id): JsonResponse
    {
        $application = VisaApplication::query()->with('visa')->findOrFail($id);

        return response()->json(['data' => $this->payload($application, masked: false)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:'.implode(',', self::STATUSES)]]);

        $application = VisaApplication::query()->with('visa')->findOrFail($id);
        $application->update($data);

        return response()->json(['data' => $this->payload($application, masked: false)]);
    }

    /** Stream the decrypted passport scan; the clear file never touches disk. */
    public function passport(Request $request, PassportVault $vault, int|string $id): Response
    {
        $application = VisaApplication::query()->findOrFail($id);
        $bytes = $vault->readFile($application->passport_copy_path);
        abort_if($bytes === null, 404);

        Log::info('Passport scan viewed', [
            'visa_application_id' => $application->id,
            'admin_id' => $request->user()?->id,
            'ip' => $request->ip(),
        ]);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($bytes, 200, [
            'Content-Type' => $application->passport_copy_mime ?: 'application/octet-stream',
            'Content-Disposition' => $disposition.'; filename="'.$application->passportCopyFilename().'"',
            'Cache-Control' => 'no-store, private, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** @return array<string, mixed> */
    private function payload(VisaApplication $application, bool $masked): array
    {
        $number = (string) $application->passport_number;

        return [
            'id' => $application->id,
            'status' => $application->status,
            'first_name' => $application->first_name,
            'last_name' => $application->last_name,
            'email' => $application->email,
            'phone' => $application->phone,
            'passport_number' => $masked ? self::mask($number) : $number,
            'birth_date' => $application->birth_date?->toDateString(),
            'travel_date' => $application->travel_date?->toDateString(),
            'visa_type' => $application->visa_type,
            'previous_visa' => (bool) $application->previous_visa,
            'notes' => $application->notes,
            'has_passport_copy' => (bool) $application->passport_copy_path,
            'passport_copy_mime' => $application->passport_copy_mime,
            'country' => $application->visa ? [
                'code' => $application->visa->code,
                'name' => $application->visa->name,
            ] : null,
            'created_at' => $application->created_at?->toJSON(),
        ];
    }

    private static function mask(string $value): string
    {
        $length = mb_strlen($value);

        return $length <= 4 ? str_repeat('•', $length) : str_repeat('•', $length - 4).mb_substr($value, -4);
    }
}
