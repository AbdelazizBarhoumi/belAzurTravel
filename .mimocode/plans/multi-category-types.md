# Implementation Plan: Multi-Category-Type System

## Overview

Transform the current single-category-per-entity system into a flexible multi-category-type system. Hotels will have separate dropdowns for "Category" (Luxury/Budget), "Star Rating" (3/4/5), "Style" (Beach/City), etc. Each type has a customizable multilingual label. Category types are per-entity and auto-appear as new dropdowns when created.

---

## 1. Database Schema Changes

### 1a. New table: `category_types`

Defines the *types* of categorization available per entity (e.g., "Category", "Star Rating", "Style" for hotels).

```php
Schema::create('category_types', function (Blueprint $table) {
    $table->id();
    $table->string('entity_type')->index();  // 'hotels', 'tours', etc.
    $table->string('key')->index();          // auto-slug from English name
    $table->json('label');                   // {en, fr, ar} — the dropdown label
    $table->unsignedSmallInteger('sort_order')->default(0);
    $table->timestamps();

    $table->unique(['entity_type', 'key']);
});
```

### 1b. New table: `category_type_values` (pivot)

Links category types to their allowed values. A "Category" type might have values "Luxury", "Budget", "Boutique". A "Star Rating" type has "3-stars", "4-stars", "5-stars".

```php
Schema::create('category_type_values', function (Blueprint $table) {
    $table->id();
    $table->foreignId('category_type_id')->constrained()->cascadeOnDelete();
    $table->string('key')->index();          // auto-slug from English name
    $table->json('name');                    // {en, fr, ar}
    $table->timestamps();

    $table->unique(['category_type_id', 'key']);
});
```

### 1c. New table: `entity_category_assignments` (pivot)

Links entities to their selected category values across multiple types.

```php
Schema::create('entity_category_assignments', function (Blueprint $table) {
    $table->id();
    $table->string('entity_type')->index();       // 'hotels', 'tours', etc.
    $table->unsignedBigInteger('entity_id')->index();
    $table->foreignId('category_type_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_value_id')->constrained('category_type_values')->cascadeOnDelete();
    $table->timestamps();

    $table->unique(['entity_type', 'entity_id', 'category_type_id'],
        'entity_cat_unique');
});
```

### 1d. Migration: seed existing data

A seeder migration that:
1. Creates a "Category" category_type for each entity_type that has existing categories
2. Migrates each existing `categories` row into `category_type_values` linked to that type
3. For each entity row, creates an `entity_category_assignments` entry mapping entity → "Category" type → the value matching its current `category_key`

---

## 2. Backend Changes

### 2a. New Models

**`app/Models/CategoryType.php`**
```php
class CategoryType extends Model {
    protected $fillable = ['entity_type', 'key', 'label', 'sort_order'];
    protected $casts = ['label' => 'array'];

    public function values() { return $this->hasMany(CategoryValue::class); }
    public function assignments() { return $this->hasMany(EntityCategoryAssignment::class); }
}
```

**`app/Models/CategoryValue.php`**
```php
class CategoryValue extends Model {
    protected $fillable = ['category_type_id', 'key', 'name'];
    protected $casts = ['name' => 'array'];

    public function type() { return $this->belongsTo(CategoryType::class, 'category_type_id'); }
}
```

**`app/Models/EntityCategoryAssignment.php`**
```php
class EntityCategoryAssignment extends Model {
    protected $fillable = ['entity_type', 'entity_id', 'category_type_id', 'category_value_id'];
    protected $table = 'entity_category_assignments';

    public function categoryType() { return $this->belongsTo(CategoryType::class); }
    public function categoryValue() { return $this->belongsTo(CategoryValue::class, 'category_value_id'); }
}
```

### 2b. Update `Category.php` Model

Add a relationship back to `CategoryType` (optional — the old `categories` table is kept for backwards compatibility but is no longer the primary mechanism).

### 2c. Update Entity Models (Hotel, Tour, Car, Event, Deal, BlogPost, Destination)

Add relationship methods:
```php
public function categoryAssignments() {
    return $this->morphMany(EntityCategoryAssignment::class, 'entity');
}
```

### 2d. New Controller: `AdminCategoryTypeController.php`

Handles CRUD for category types and their values. Routes:

| Method | URI | Action |
|--------|-----|--------|
| GET | `/api/admin/category-types?type=hotels` | List types for entity |
| POST | `/api/admin/category-types` | Create type |
| PUT | `/api/admin/category-types/{type}` | Update type label |
| DELETE | `/api/admin/category-types/{type}` | Delete type (with cascade check) |
| GET | `/api/admin/category-types/{type}/values` | List values for a type |
| POST | `/api/admin/category-types/{type}/values` | Add value to type |
| PUT | `/api/admin/category-types/{type}/values/{value}` | Update value |
| DELETE | `/api/admin/category-types/{type}/values/{value}` | Delete value (with entity check) |

**Key behaviors:**
- `store()` auto-generates `key` from English label via `Str::slug()`
- `destroy()` checks for affected entities before deleting (returns 409 with list)
- `syncLabelOnValues()` — when a type's label changes, no entity sync needed (label is on the type, not on entities)
- Clear relevant caches on mutations

### 2e. Update `AdminCategoryController.php`

Keep existing endpoints working for backwards compatibility. Add a new endpoint:

| Method | URI | Action |
|--------|-----|--------|
| GET | `/api/admin/categories/types?entity_type=hotels` | Get all types with their values for an entity |

This returns a nested structure:
```json
{
  "data": [
    {
      "id": 1, "key": "category", "label": {"en": "Category", "fr": "Catégorie", "ar": "فئة"}, "sort_order": 0,
      "values": [
        {"id": 1, "key": "luxury", "name": {"en": "Luxury", "fr": "Luxe", "ar": "فاخر"}},
        {"id": 2, "key": "budget", "name": {"en": "Budget", "fr": "Économique", "ar": "اقتصادي"}}
      ]
    },
    {
      "id": 2, "key": "star-rating", "label": {"en": "Star Rating", "fr": "Classement", "ar": "تصنيف النجوم"}, "sort_order": 1,
      "values": [...]
    }
  ]
}
```

### 2f. Update Admin Entity Controllers (AdminHotelController, AdminTourController, etc.)

**In `attributes()` method:**
- Accept `category_assignments` in request: `category_assignments: { category_type_key: category_value_key, ... }`
- After saving/updating entity, call `syncCategoryAssignments($entity, $assignments)`
- Also keep writing legacy `category_key`/`category` fields from the first assignment (or a designated "primary" type) for backwards compatibility

**New helper method `syncCategoryAssignments()`:**
```php
private function syncCategoryAssignments(Model $entity, string $entityType, array $assignments): void
{
    // Delete existing assignments for this entity
    EntityCategoryAssignment::where('entity_type', $entityType)
        ->where('entity_id', $entity->id)
        ->delete();

    foreach ($assignments as $typeKey => $valueKey) {
        $type = CategoryType::where('entity_type', $entityType)->where('key', $typeKey)->first();
        if (!$type) continue;
        $value = $type->values()->where('key', $valueKey)->first();
        if (!$value) continue;

        EntityCategoryAssignment::create([
            'entity_type' => $entityType,
            'entity_id' => $entity->id,
            'category_type_id' => $type->id,
            'category_value_id' => $value->id,
        ]);
    }

    // Also update legacy columns from first assignment
    $first = EntityCategoryAssignment::where('entity_type', $entityType)
        ->where('entity_id', $entity->id)
        ->first();
    if ($first) {
        $entity->update([
            'category_key' => $first->categoryValue->key,
            'category' => $first->categoryValue->name,
        ]);
    }
}
```

**In `adminPayload()` method:**
- Eager-load `categoryAssignments.categoryType` and `categoryAssignments.categoryValue`
- Add `category_assignments` to output: `{ "category": "luxury", "star-rating": "5-stars", ... }`

### 2g. Update Public Controllers (HotelController, DestinationController, etc.)

- Eager-load category assignments with their types and values
- Include `category_assignments` in public API response alongside existing `category`/`category_key` fields
- This ensures public pages can display multi-category data

### 2h. Update Routes (`routes/api.php`)

Add inside the admin middleware group:
```php
Route::get('/admin/category-types', [AdminCategoryTypeController::class, 'index']);
Route::post('/admin/category-types', [AdminCategoryTypeController::class, 'store']);
Route::put('/admin/category-types/{type}', [AdminCategoryTypeController::class, 'update']);
Route::delete('/admin/category-types/{type}', [AdminCategoryTypeController::class, 'destroy']);

Route::get('/admin/category-types/{type}/values', [AdminCategoryTypeController::class, 'values']);
Route::post('/admin/category-types/{type}/values', [AdminCategoryTypeController::class, 'storeValue']);
Route::put('/admin/category-types/{type}/values/{value}', [AdminCategoryTypeController::class, 'updateValue']);
Route::delete('/admin/category-types/{type}/values/{value}', [AdminCategoryTypeController::class, 'destroyValue']);
```

Add public endpoint (no auth):
```php
Route::get('/categories/types', [AdminCategoryController::class, 'typesByEntity']);
```

---

## 3. Frontend Changes

### 3a. New API Module: `resources/js/api/categoryTypes.api.ts`

```typescript
export interface CategoryType {
    id: number;
    entity_type: string;
    key: string;
    label: { en: string; fr: string; ar: string };
    sort_order: number;
    values: CategoryTypeValue[];
}

export interface CategoryTypeValue {
    id: number;
    category_type_id: number;
    key: string;
    name: { en: string; fr: string; ar: string };
}

// API functions:
fetchCategoryTypes(entityType: string): Promise<CategoryType[]>
createCategoryType(data): Promise<CategoryType>
updateCategoryType(id, label): Promise<CategoryType>
deleteCategoryType(id, force?): Promise<...>

fetchCategoryValues(typeId: number): Promise<CategoryTypeValue[]>
createCategoryValue(typeId, name): Promise<CategoryTypeValue>
updateCategoryValue(typeId, valueId, name): Promise<CategoryTypeValue>
deleteCategoryValue(typeId, valueId, force?): Promise<...>
```

### 3b. New Hook: `resources/js/hooks/useCategoryTypes.ts`

```typescript
export function useCategoryTypes(entityType: string) {
    return useQuery({
        queryKey: ['category-types', entityType],
        queryFn: () => fetchCategoryTypes(entityType),
    });
}
```

### 3c. Rewrite `CategoryManager.tsx` → `CategoryTypeManager.tsx`

A two-level management dialog:

**Level 1: Category Types list**
- Lists all types for the entity (e.g., "Category", "Star Rating", "Style")
- Each type shows its label in 3 languages, drag-handle for sort order
- Edit/Delete buttons per type
- "Add Category Type" button

**Level 2: Values for a type** (clicking a type expands or navigates)
- Shows all values for that type (e.g., "Luxury", "Budget", "Boutique" under "Category")
- Inline editing of multilingual names
- Add/Delete value buttons
- Back button to return to types list

**Props change:**
```typescript
interface CategoryTypeManagerProps {
    entityType: string;  // renamed from `type`
    isOpen: boolean;
    onClose: () => void;
}
```

### 3d. Update All Admin Pages (AdminHotels, AdminTours, AdminCars, AdminEvents, AdminDeals, AdminBlog, AdminDestinations)

**Pattern for each page:**

1. Replace `fetchCategories(type)` calls with `useCategoryTypes(entityType)`
2. In the form section `render()` callback, instead of one category dropdown, render a dropdown per category type:

```tsx
// In the Core Details section render():
const { data: categoryTypes = [] } = useCategoryTypes('hotels');

// For each type, render a Select:
{categoryTypes.map((catType) => (
    <div key={catType.key} className="space-y-2">
        <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">
                {catType.label[activeLang] || catType.label.en}
            </label>
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setCatManagerOpen(true)}
            >
                <Settings className="h-3 w-3" />
            </Button>
        </div>
        <Select
            value={values[`category_${catType.key}`] || ''}
            onValueChange={(val) => setField(`category_${catType.key}`, val)}
        >
            <SelectTrigger>
                <SelectValue placeholder={t('actions.select')} />
            </SelectTrigger>
            <SelectContent>
                {catType.values.map((v) => (
                    <SelectItem key={v.key} value={v.key}>
                        {v.name[activeLang] || v.name.en}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
))}
```

3. Update form state initialization:
```tsx
const dialogInitial = editing ? {
    ...editing,
    // New: one field per category type
    ...Object.fromEntries(
        categoryTypes.map(ct => [`category_${ct.key}`, editing.category_assignments?.[ct.key] || ''])
    ),
    // Legacy fields kept for backwards compat
    category_key: resolveCategoryKey(...),
} : null;
```

4. Update `handleSave()`:
```tsx
const payload = {
    ...rest,
    category_assignments: Object.fromEntries(
        categoryTypes
            .filter(ct => values[`category_${ct.key}`])
            .map(ct => [ct.key, values[`category_${ct.key}`]])
    ),
    // Legacy fields still sent for backwards compat
    category_key: ...,
    category: ...,
};
```

5. Replace `<CategoryManager type="hotels" ...>` with `<CategoryTypeManager entityType="hotels" ...>`

6. Update `validate()` to validate all category type assignments (or only required ones — configurable per type)

7. Update table display columns: show first category type value instead of single category

### 3e. Update `categories.api.ts`

Keep existing functions for backwards compatibility. Add re-exports from `categoryTypes.api.ts`.

### 3f. Update `usePublicData.ts` → `useCategories` hook

Change the hook to fetch from the new `/api/categories/types?entity_type=X` endpoint:

```typescript
export function useCategoryTypes(entityType?: string) {
    return useQuery({
        queryKey: ['category-types', entityType ?? 'all'],
        queryFn: async () => {
            const resp = await apiFetch<{ data: CategoryTypeWithValues[] }>(
                `/api/categories/types${entityType ? `?entity_type=${entityType}` : ''}`
            );
            return resp.data;
        },
    });
}
```

### 3g. Update Public Listing Pages

Each listing page currently calls `useCategories('hotels')` and renders filter tabs from a flat list. Update to:

1. Fetch `useCategoryTypes('hotels')` instead
2. Render a tab group per category type (if desired), or a single combined filter
3. Filter logic uses `entity_category_assignments` data included in entity payloads

**Option A (recommended):** Keep the public filter tabs simple — use the first/primary category type for the tab filter, show others as secondary badges on entity cards.

**Option B:** Render separate tab groups per category type. More complex but more powerful.

### 3h. Update `categoryLabels.ts` and `categoryCache.ts`

- Add functions to resolve labels from the new nested structure
- Keep existing functions working for backwards compatibility
- `categoryCache.ts` — extend dedup cache key to include category-types

### 3i. Update `lib/adminI18n.ts`

- Remove hardcoded `categoryLabels` fallback map (now served from DB via category types)
- Or keep as fallback for edge cases

---

## 4. Data Migration Strategy

### Phase 1: Create new tables (no breaking changes)
1. Create `category_types`, `category_type_values`, `entity_category_assignments` tables
2. Create new models and controller
3. All existing functionality continues working via old `categories` table

### Phase 2: Migrate existing data
1. Run seeder migration:
   - For each entity_type in `categories`, create a `CategoryType` with label "Category" in all 3 languages
   - Insert each existing category row as a `CategoryValue` linked to that type
   - For each entity row with a `category_key`, create an `EntityCategoryAssignment`
2. Verify data integrity (artisan command or test)

### Phase 3: Update admin frontend
1. Deploy `CategoryTypeManager.tsx`
2. Update each admin page to use `useCategoryTypes` and render multiple dropdowns
3. Forms send `category_assignments` to backend

### Phase 4: Update backend controllers
1. Update entity controllers to handle `category_assignments` on save
2. Update `adminPayload()` to include `category_assignments`
3. Keep legacy `category_key`/`category` columns synced

### Phase 5: Update public frontend
1. Update `useCategories` hook
2. Update listing page filters
3. Update public entity cards to show category type badges

### Rollback Strategy
- Old `categories` table is never dropped during migration
- Legacy `category_key`/`category` columns remain populated
- If new system fails, revert frontend to old hooks and backend ignores `category_assignments`

---

## 5. File-by-File Change List

### New Files

| File | Description |
|------|-------------|
| `database/migrations/20XX_XX_XX_create_category_types_table.php` | Creates `category_types` table |
| `database/migrations/20XX_XX_XX_create_category_type_values_table.php` | Creates `category_type_values` table |
| `database/migrations/20XX_XX_XX_create_entity_category_assignments_table.php` | Creates pivot table |
| `database/migrations/20XX_XX_XX_seed_category_types_from_categories.php` | One-time data migration |
| `app/Models/CategoryType.php` | Eloquent model for category types |
| `app/Models/CategoryValue.php` | Eloquent model for category values |
| `app/Models/EntityCategoryAssignment.php` | Eloquent model for entity↔value pivot |
| `app/Http/Controllers/Api/AdminCategoryTypeController.php` | CRUD for types and values |
| `resources/js/api/categoryTypes.api.ts` | TypeScript API functions for category types |
| `resources/js/hooks/useCategoryTypes.ts` | React hook for fetching category types |
| `resources/js/components/admin/CategoryTypeManager.tsx` | Two-level management dialog |

### Modified Files

| File | Changes |
|------|---------|
| `app/Models/Category.php` | Add optional relationship to CategoryType |
| `app/Models/Hotel.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/Tour.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/Car.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/Event.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/Deal.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/BlogPost.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Models/Destination.php` | Add `categoryAssignments()` morphMany relationship |
| `app/Http/Controllers/Api/AdminCategoryController.php` | Add `typesByEntity()` method for public nested endpoint |
| `app/Http/Controllers/Api/AdminHotelController.php` | Accept `category_assignments`, sync on save, include in `adminPayload()` |
| `app/Http/Controllers/Api/AdminTourController.php` | Same as above |
| `app/Http/Controllers/Api/AdminCarController.php` | Same as above |
| `app/Http/Controllers/Api/AdminEventController.php` | Same as above |
| `app/Http/Controllers/Api/AdminDealController.php` | Same as above |
| `app/Http/Controllers/Api/AdminBlogPostController.php` | Same as above |
| `app/Http/Controllers/Api/AdminDestinationController.php` | Same as above |
| `app/Http/Controllers/Api/HotelController.php` | Eager-load and include category assignments in public payload |
| `app/Http/Controllers/Api/DestinationController.php` | Same as above |
| `app/Http/Controllers/Api/TourController.php` | Same as above |
| `app/Http/Controllers/Api/CarController.php` | Same as above |
| `app/Http/Controllers/Api/EventController.php` | Same as above |
| `app/Http/Controllers/Api/DealController.php` | Same as above |
| `app/Http/Controllers/Api/BlogPostController.php` | Same as above |
| `routes/api.php` | Add category-types routes (admin + public) |
| `resources/js/pages/admin/AdminHotels.tsx` | Use `useCategoryTypes`, render multi-dropdown, update form state/save |
| `resources/js/pages/admin/AdminTours.tsx` | Same pattern as AdminHotels |
| `resources/js/pages/admin/AdminCars.tsx` | Same pattern |
| `resources/js/pages/admin/AdminEvents.tsx` | Same pattern |
| `resources/js/pages/admin/AdminDeals.tsx` | Same pattern |
| `resources/js/pages/admin/AdminBlog.tsx` | Same pattern |
| `resources/js/pages/admin/AdminDestinations.tsx` | Same pattern |
| `resources/js/api/categories.api.ts` | Keep for compat, add re-export if needed |
| `resources/js/hooks/usePublicData.ts` | Update `useCategories` to use new endpoint |
| `resources/js/lib/categoryLabels.ts` | Add helpers for nested category type resolution |
| `resources/js/lib/categoryCache.ts` | Extend cache key for category-types |
| `resources/js/lib/adminI18n.ts` | Keep fallback labels, no breaking changes |
| `resources/js/pages/destinations/index.tsx` | Update to use category types for filters |
| `resources/js/pages/hotels/index.tsx` | Same |
| `resources/js/pages/tours/index.tsx` | Same |
| `resources/js/pages/cars/index.tsx` | Same |
| `resources/js/pages/events/index.tsx` | Same |
| `resources/js/pages/deals/index.tsx` | Same |
| `resources/js/components/sections/blog/BlogListing.tsx` | Same |
| `resources/js/components/layout/Navbar.tsx` | Update nav dropdowns if needed |
| `resources/js/pages/admin/site-settings/AdminSiteSettingsNav.tsx` | Update if category nav links change |

---

## 6. Testing & Verification Approach

### Unit Tests
1. **CategoryType model** — CRUD operations, relationships (values, assignments)
2. **CategoryValue model** — CRUD, cascade deletion
3. **AdminCategoryTypeController** — Store/update/delete type and values, 409 on delete with affected entities
3. **AdminHotelController** — Save with `category_assignments`, verify both new pivot and legacy columns populated

### Integration Tests
1. Create a hotel with multiple category assignments → verify pivot rows created
2. Update category assignments → verify old rows replaced
3. Delete a category type → verify cascade to values and assignments
4. Delete a category value used by entities → verify 409 response with affected items
5. Verify legacy `category_key`/`category` columns stay in sync

### Frontend Verification
1. **AdminHotels**: Create new hotel with 3 category types → all dropdowns appear, selection saved
2. **AdminHotels**: Edit hotel → dropdowns show previously selected values
3. **CategoryTypeManager**: Create new type → it appears in admin form without refresh
4. **CategoryTypeManager**: Add value to type → it appears in dropdown
5. **CategoryTypeManager**: Delete type → dropdowns disappear from form
6. **Public pages**: Verify filter tabs still work (backwards compat)
7. **Public pages**: Verify entity cards show category type labels
8. **Multi-language**: Switch language → category type labels and value names update
9. **RTL**: Verify Arabic layout works for all new UI elements

### Backwards Compatibility Checks
1. Existing hotels still display correct category in admin table
2. Existing hotels still filter correctly on public listing pages
3. Legacy `category_key` column still populated on create/update
4. Old `/api/categories` endpoint still returns data
5. No breaking changes to public API response shape (new fields added, not replaced)

### Migration Verification
1. After seeding: all existing `categories` rows have corresponding `category_type_values`
2. After seeding: all entities with `category_key` have matching `entity_category_assignments`
3. No data loss — old columns still contain correct values
