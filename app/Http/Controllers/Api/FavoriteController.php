<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Support\Bookables;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FavoriteController extends Controller
{
    private const MAX_FAVORITES = 200;

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->list($request));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->itemRules());

        abort_if(Bookables::find($data['type'], $data['id']) === null, 422, __('messages.selected_item_missing'));
        abort_if(
            ! $this->exists($request, $data) && $request->user()->favorites()->count() >= self::MAX_FAVORITES,
            422,
            __('messages.favorites_limit')
        );

        $this->save($request, $data);

        return response()->json($this->list($request), 201);
    }

    public function destroy(Request $request, string $type, string $key): JsonResponse
    {
        $request->user()->favorites()->where('type', $type)->where('item_key', $key)->delete();

        return response()->json($this->list($request));
    }

    /**
     * Merge the favorites a guest collected in the browser into the account.
     * Unknown or removed catalogue items are skipped silently.
     */
    public function sync(Request $request): JsonResponse
    {
        $rules = ['items' => ['present', 'array', 'max:'.self::MAX_FAVORITES]];
        foreach ($this->itemRules() as $key => $itemRules) {
            $rules["items.*.{$key}"] = $itemRules;
        }
        $data = $request->validate($rules);

        $room = self::MAX_FAVORITES - $request->user()->favorites()->count();

        foreach ($data['items'] as $item) {
            $exists = $this->exists($request, $item);
            if (! $exists && $room <= 0) {
                break;
            }
            if (Bookables::find($item['type'], $item['id']) === null) {
                continue;
            }

            $this->save($request, $item);
            if (! $exists) {
                $room--;
            }
        }

        return response()->json($this->list($request));
    }

    /** @return array<string, mixed> */
    private function itemRules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(Bookables::TYPES)],
            'id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:2048'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @param  array<string, mixed>  $item */
    private function exists(Request $request, array $item): bool
    {
        return $request->user()->favorites()
            ->where('type', $item['type'])
            ->where('item_key', $item['id'])
            ->exists();
    }

    /** @param  array<string, mixed>  $item */
    private function save(Request $request, array $item): void
    {
        Favorite::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'type' => $item['type'], 'item_key' => $item['id']],
            ['snapshot' => [
                'name' => $item['name'],
                'image' => $item['image'] ?? null,
                'price' => $item['price'] ?? null,
                'location' => $item['location'] ?? null,
            ]],
        );
    }

    /** @return list<array<string, mixed>> */
    private function list(Request $request): array
    {
        return $request->user()->favorites()->latest('id')->get()
            ->map(fn (Favorite $favorite) => $favorite->toClientArray())
            ->values()
            ->all();
    }
}
