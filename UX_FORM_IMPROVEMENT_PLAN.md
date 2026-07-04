# UX Form Input Component Improvement Plan

## Scope
Replace plain text inputs with purpose-built components across all admin and public forms.

---

## Part A: New EntityFormDialog Field Types

**File to modify:** `resources/js/components/forms/EntityFormDialog.tsx`

### Current FieldDef.type values
`text | number | textarea | select | checkbox`

### New FieldDef.type values to add
| Type | Component | Use Case |
|------|-----------|----------|
| `switch` | Radix Switch | Boolean on/off (replace checkbox) |
| `radio` | RadioGroup | 2-5 fixed options |
| `autocomplete` | Command+Popover | 6+ searchable options |
| `slider` | Radix Slider | Numeric range (0-5, 0-100) |
| `datepicker` | DatePicker | Single date |
| `daterange` | Calendar range mode | Check-in/out date pairs |
| `rating` | StarRating interactive | 0.0-5.0 half-star increments |
| `price` | Input with TND prefix | Currency amounts |
| `number-stepper` | +/- Button group | Small positive integers (travelers, seats) |
| `tag-input` | Multi-value Input | Comma-separated tags |
| `time` | Time input | Departure/arrival times |
| `duration` | Linked days+nights inputs | Duration fields that auto-calculate |
| `flag-display` | Read-only flag emoji | Auto-generated from country code |
| `email` | Input with validation | Email addresses |
| `tel` | Input with format hint | Phone numbers |

### FieldDef interface additions
```typescript
export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  options?: Array<string | FieldOption>;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  colSpan?: 1 | 2 | 3 | 4;
  // NEW
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
  linkedFields?: string[];
  showStars?: boolean;
}
```

### Switch import needed
```typescript
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { DatePicker } from '@/components/ui/DatePicker';
```

---

## Part B: Per-Entity Field Recommendations

### 1. AdminDestinations
**File:** `resources/js/pages/admin/AdminDestinations.tsx`

Uses custom `render` sections, not FieldDef.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| price | `<Input type="number">` | **PriceInput** (number + TND prefix) | Shows currency, prevents negatives |
| rating | `<Input type="number">` | **Slider 0-5 step 0.5** | Visual, constrained range |
| bestTime | Select (single) | Consider **multi-select** if multiple months apply | Data model supports single |
| language | Select | **Autocomplete** | 15 items, long list to scroll |
| currency | Select | **Autocomplete** | 14 items, searchable by code |

Fields already correct: name (Input), country (CountrySelect), description (Textarea), about (Textarea), category (Select).

### 2. AdminHotels
**File:** `resources/js/pages/admin/AdminHotels.tsx`

Uses custom render sections.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| name | Raw `<input>` | **Input** component | Design system consistency |
| location | Raw `<input>` | **Input** component | Design system consistency |
| description | Raw `<textarea>` | **Textarea** component | Design system consistency |
| price | Raw `<input type="number">` | **PriceInput** | TND prefix, proper validation |
| stars | Select (1-5) | **RadioGroup with star labels** or interactive star display | 5 options, visual better |
| reviews | Raw `<input type="number">` | **Input type="number"** min=0 step=1 | Integer count |
| destinationSlug | Raw `<input>` | **Input** with monospace font | URL slug pattern |

Fields already correct: country (CountrySelect), city (CitySelect), category (Select), rating (Select with RATING_OPTIONS).

### 3. AdminTours
**File:** `resources/js/pages/admin/AdminTours.tsx`

Uses custom render sections.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| price | Raw `<input type="number">` | **PriceInput** | Currency prefix |
| duration_days | Raw `<input type="number">` | **NumberStepper** (+/- buttons) | Small positive integer |
| duration_nights | Raw `<input type="number">` | **NumberStepper** (+/- buttons) | Small positive integer |
| max_group | Raw `<input type="number">` | **NumberStepper** (+/- buttons) | Small positive integer |
| rating | Select (RATING_OPTIONS) | **Slider** or keep Select | 11 options, slider more visual |
| duration | Input (text) | **Input** (text) | Correct for freeform "7 Days" |

Fields already correct: name (Input), location (Input), description (Textarea), category (Select).

### 4. AdminTravels
**File:** `resources/js/pages/admin/AdminTravels.tsx`

Nearly identical structure to AdminTours.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| name | Raw `<input>` | **Input** component | Consistency |
| location | Raw `<input>` | **Input** component | Consistency |
| duration | Raw `<input>` | **Input** component | Consistency |
| description | Raw `<textarea>` | **Textarea** component | Consistency |
| price | Raw `<input type="number">` | **PriceInput** | Currency prefix |
| rating | Raw `<input type="number">` | **Slider** 0-5 step 0.1 | Visual range |
| duration_days | Raw `<input type="number">` | **NumberStepper** | +/- buttons |
| duration_nights | Raw `<input type="number">` | **NumberStepper** | +/- buttons |
| max_group | Raw `<input type="number">` | **NumberStepper** | +/- buttons |

### 5. AdminFlights
**File:** `resources/js/pages/admin/AdminFlights.tsx`

Uses custom render helpers.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| airline | Select (20 airlines) | **Autocomplete** | 20 options, search by name |
| to (destination) | Select (AIRPORTS) | **Autocomplete** | Many airports, type-to-search |
| from (origin) | Select (AIRPORTS) | **Autocomplete** | Many airports, type-to-search |
| duration | Raw `<input>` | **Input** (text) | "3h 30m" format |
| stops | Select (3 options) | **RadioGroup** | Only 3 choices |
| code | Raw `<input>` | **Input** with monospace | Flight code pattern |
| price | Raw `<input type="number">` | **PriceInput** | Currency prefix |
| departure | FieldDef text | **TimeInput** (HH:MM) | Time format |
| arrival | FieldDef text | **TimeInput** (HH:MM) | Time format |
| seats | FieldDef number | **NumberStepper** | Positive integer |
| date | DatePicker | DatePicker | Already correct |
| cabin | Select (4 options) | **RadioGroup** | 4 options, clear choice |
| aircraft | Raw `<input>` | **Input** (text) | Correct |
| baggage | Raw `<input>` | **Input** (text) | "23kg" freeform |
| refund | Raw `<input>` | **Input** (text) or **Select** if options are fixed | Depends on data model |

### 6. AdminCars
**File:** `resources/js/pages/admin/AdminCars.tsx`

Uses custom render sections.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| name | Raw `<input>` | **Input** component | Consistency |
| fuel | Select (5 options) | **RadioGroup** | Only 5, visual choice |
| transmission | Select (3 options) | **RadioGroup** | Only 3, clear |
| price | Raw `<input type="number">` | **PriceInput** | TND prefix |
| seats | Raw `<input type="number">` | **NumberStepper** | Small positive int |
| description | Raw `<textarea>` | **Textarea** component | Consistency |

Fields already correct: category (Select), features (JsonListEditor), policy (JsonListEditor).

### 7. AdminVisas
**File:** `resources/js/pages/admin/AdminVisas.tsx`

Already well-implemented with proper components.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| flag | Display-only (auto from CountrySelect) | **FlagDisplay** read-only | Already auto, just formalize |
| processing | Input (text) | Keep Input | "5-10 business days" is freeform |
| price | Input (number) | **PriceInput** | Add DT prefix |
| is_active | Switch | Switch | Already correct |
| sort_order | Input (number) | **NumberStepper** or Input | Small integer |
| region | Select | Select | 8 options, already fine |
| country | CountrySelect | CountrySelect | Already correct |

### 8. AdminDeals
**File:** `resources/js/pages/admin/AdminDeals.tsx`

Uses custom render sections.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| title | Raw `<input>` | **Input** component | Consistency |
| discount | Raw `<input>` | **Input** with "%" suffix | Percentage field |
| expires | Raw `<input>` | **DatePicker** | Date selection, not text |
| description | Raw `<textarea>` | **Textarea** component | Consistency |
| highlights | DynamicListInput (raw inputs) | Keep or upgrade to JsonListEditor | Consistency |
| terms | DynamicListInput (raw inputs) | Keep or upgrade to JsonListEditor | Consistency |

### 9. AdminEvents
**File:** `resources/js/pages/admin/AdminEvents.tsx`

Uses custom render sections.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| title | Raw `<input>` | **Input** component | Consistency |
| location | Raw `<input>` | **Input** component | Consistency |
| date | DatePicker | DatePicker | Already correct |
| price | Raw `<input type="number">` | **PriceInput** | TND prefix |
| description | Raw `<textarea>` | **Textarea** component | Consistency |
| about | Raw `<textarea>` | **Textarea** component | Consistency |
| attendees | Raw `<input>` | **Input** or **NumberStepper** | Could be "50-100" range text |

### 10. BookingDialog (Public)
**File:** `resources/js/components/forms/BookingDialog.tsx`

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| name | Input | Input | Already correct |
| email | Input type="email" | Input type="email" | Already correct |
| phone | Input | **TelInput** with format hint | Better UX |
| startDate | DatePicker | DatePicker | Already correct |
| endDate | DatePicker | DatePicker | Already correct |
| notes | Textarea | Textarea | Already correct |

BookingDialog is already well-built. Minor phone input improvement only.

### 11. SearchWidget (Public)
**File:** `resources/js/components/ui/SearchWidget.tsx`

Already uses sophisticated components:
- CountryFilter: Select with countries
- DateRangePicker: Calendar range mode
- GuestSelector: Popover with +/- buttons
- ExtraFieldsByType: Select dropdowns

**No changes needed.** Already well-designed.

### 12. DesignTrip (Public)
**File:** `resources/js/pages/general/DesignTrip.tsx`

Uses custom grid-based selection cards for all choices. This is a wizard flow.

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| destinations | Grid cards | Grid cards | Already excellent UX |
| interests | Grid cards | Grid cards | Already excellent |
| accommodation | Grid cards | Grid cards | Already excellent |
| transport | Grid cards | Grid cards | Already excellent |
| startDate | DatePicker | DatePicker | Already correct |
| endDate | DatePicker | DatePicker | Already correct |
| travelers | +/- buttons | +/- buttons | Already excellent |
| budget | Grid cards | Grid cards | Already excellent |

**No changes needed.** DesignTrip is already optimally designed.

### 13. Visa Application (Public)
**File:** `resources/js/pages/visa/index.tsx`

| Field | Current | Switch To | Reason |
|-------|---------|-----------|--------|
| fullName | Input | Input | Correct |
| email | Input type="email" | Input type="email" | Correct |
| phone | Input | **TelInput** with format hint | Better |
| passport | Input | Input | Correct |
| birthDate | **Raw `<input type="date">`** | **DatePicker** | Consistent with rest of app |
| travelDate | **Raw `<input type="date">`** | **DatePicker** | Consistent with rest of app |
| visaType | Select (5 options) | Select or **RadioGroup** | 5 options, either works |
| notes | Textarea | Textarea | Correct |

---

## Part C: Implementation Order

### Phase 1: EntityFormDialog Core (Foundation)
**Estimated effort:** Medium
**Files:** 1 file

1. Add new field types to `FieldType` union
2. Extend `FieldDef` interface with new props (min, max, step, prefix, suffix, etc.)
3. Implement new rendering branches in `FieldControl`:
   - `switch` - Radix Switch
   - `radio` - RadioGroup with RadioGroupItem
   - `slider` - Radix Slider with value display
   - `datepicker` - DatePicker wrapper
   - `price` - Input with currency prefix/suffix
   - `number-stepper` - +/- Button group around Input
   - `autocomplete` - Popover + Command combo
4. Test all new field types render correctly

### Phase 2: High-Impact Admin Forms (Raw HTML Cleanup)
**Estimated effort:** High
**Files:** 8 files

Migrate raw `<input>` and `<textarea>` elements to proper UI components. This is the biggest UX win because many admin forms currently bypass the design system entirely.

| Priority | Entity | Raw inputs to fix |
|----------|--------|-------------------|
| 1 | AdminHotels | name, location, description, price, reviews, slug (6 fields) |
| 2 | AdminTravels | name, location, duration, description, price, rating, days, nights, max_group (9 fields) |
| 3 | AdminTours | price, days, nights, max_group (4 fields) |
| 4 | AdminCars | name, description, price, seats (4 fields) |
| 5 | AdminEvents | title, location, description, about, price, attendees (6 fields) |
| 6 | AdminDeals | title, discount, description, expires (4 fields) |
| 7 | AdminFlights | airline, to, from, code, price, duration, aircraft, baggage, refund (9 fields) |
| 8 | AdminVisas | price (1 field) |

### Phase 3: Specialized Input Upgrades
**Estimated effort:** Medium
**Files:** Multiple

After raw inputs are cleaned up, upgrade specific fields to specialized components:

**Rating fields (4 locations):**
- AdminDestinations.rating: Slider 0-5 step 0.5
- AdminHotels.rating: Already Select, consider Slider
- AdminTours.rating: Already Select, consider Slider
- AdminTravels.rating: Raw input, switch to Slider

**Small-option sets (switch to RadioGroup):**
- AdminFlights.stops (3 options)
- AdminFlights.cabin (4 options)
- AdminCars.fuel (5 options)
- AdminCars.transmission (3 options)
- Visa application.visaType (5 options)

**Large-option sets (switch to Autocomplete):**
- AdminFlights.airline (20 options)
- AdminFlights.airport (many airports)
- AdminDestinations.language (15 options)
- AdminDestinations.currency (14 options)

**Price fields (add currency prefix):**
- All 9 entities have price fields that need TND prefix

**Date fields (missing DatePickers):**
- AdminDeals.expires: Currently raw text input
- Visa application.birthDate: Raw `<input type="date">`
- Visa application.travelDate: Raw `<input type="date">`

**Number steppers:**
- AdminTours: duration_days, duration_nights, max_group
- AdminTravels: duration_days, duration_nights, max_group
- AdminCars: seats
- AdminFlights: seats

### Phase 4: Public Form Polish
**Estimated effort:** Low
**Files:** 2 files

1. Visa application: Replace raw `<input type="date">` with DatePicker
2. BookingDialog: Phone input with format hint (minor)

SearchWidget and DesignTrip need no changes.

---

## Part D: New Wrapper Components to Create

### 1. PriceInput
Wraps Input with TND prefix icon/label. Props: `value`, `onChange`, `currency?` (default "TND").

### 2. NumberStepper
Button group with +/- and centered number display. Props: `value`, `onChange`, `min?`, `max?`, `step?`.

### 3. RatingSlider
Slider with star icons and half-step support. Props: `value`, `onChange`, `max?` (default 5).

### 4. AutocompleteSelect
Popover + Command for searchable dropdown. Props: `value`, `onChange`, `options`, `placeholder`.

### 5. TimeInput
Input with HH:MM format validation. Props: `value`, `onChange`, `placeholder`.

---

## Part E: Implementation Checklist

### Step 1 - EntityFormDialog types
- [ ] Add new FieldType values
- [ ] Extend FieldDef interface
- [ ] Import new components (Switch, RadioGroup, Slider, Popover, Command, DatePicker)
- [ ] Implement switch rendering
- [ ] Implement radio rendering
- [ ] Implement slider rendering
- [ ] Implement datepicker rendering
- [ ] Implement price rendering
- [ ] Implement number-stepper rendering
- [ ] Implement autocomplete rendering

### Step 2 - AdminHotels cleanup
- [ ] Replace all raw `<input>` with Input component
- [ ] Replace raw `<textarea>` with Textarea component
- [ ] Upgrade stars Select to RadioGroup with star labels
- [ ] Add TND prefix to price input

### Step 3 - AdminTravels cleanup
- [ ] Replace all raw `<input>` with Input component
- [ ] Replace raw `<textarea>` with Textarea component
- [ ] Switch rating to Slider
- [ ] Switch duration_days, duration_nights, max_group to NumberStepper

### Step 4 - AdminTours cleanup
- [ ] Switch duration_days, duration_nights, max_group to NumberStepper
- [ ] Add TND prefix to price
- [ ] Consider rating Slider

### Step 5 - AdminCars cleanup
- [ ] Replace raw `<input>` with Input
- [ ] Replace raw `<textarea>` with Textarea
- [ ] Switch fuel to RadioGroup
- [ ] Switch transmission to RadioGroup
- [ ] Switch seats to NumberStepper
- [ ] Add TND prefix to price

### Step 6 - AdminFlights cleanup
- [ ] Switch airline to AutocompleteSelect
- [ ] Switch airport selects to AutocompleteSelect
- [ ] Switch stops to RadioGroup
- [ ] Switch cabin to RadioGroup
- [ ] Add time inputs for departure/arrival
- [ ] Add TND prefix to price
- [ ] Switch seats to NumberStepper

### Step 7 - AdminDeals cleanup
- [ ] Replace raw `<input>` with Input
- [ ] Replace raw `<textarea>` with Textarea
- [ ] Switch expires to DatePicker
- [ ] Add "%" suffix to discount

### Step 8 - AdminEvents cleanup
- [ ] Replace all raw inputs with Input
- [ ] Replace raw textareas with Textarea
- [ ] Add TND prefix to price

### Step 9 - AdminVisas minor fix
- [ ] Add DT prefix to price input

### Step 10 - AdminDestinations rating
- [ ] Switch rating from Input to Slider

### Step 11 - Public forms
- [ ] Visa: Replace `<input type="date">` with DatePicker
- [ ] BookingDialog: Phone format hint (optional)

---

## Part F: Libraries Required

**None.** All needed Radix UI primitives are already installed:
- `@radix-ui/react-switch` (Switch)
- `@radix-ui/react-radio-group` (RadioGroup)
- `@radix-ui/react-slider` (Slider)
- `@radix-ui/react-popover` (Popover)
- `cmdk` (Command for autocomplete)

---

## Part G: Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Fields using proper UI components | ~60% | 100% |
| Raw `<input>` elements in admin forms | 35+ | 0 |
| Fields with appropriate input type | ~70% | 100% |
| Forms needing no changes | 2 (SearchWidget, DesignTrip) | 2 |
| Forms with minor fixes needed | 3 | 0 |
| Forms needing major cleanup | 6 | 0 |

## Summary of Key Gains

1. **Consistency**: All inputs use the shadcn design system
2. **Data integrity**: Type-appropriate inputs prevent invalid entries
3. **Discoverability**: Autocomplete for large lists, radio for small ones
4. **Visual feedback**: Sliders for ratings, steppers for counts
5. **Currency clarity**: All price fields show TND/DT prefix
6. **Date consistency**: All dates use the same DatePicker component
