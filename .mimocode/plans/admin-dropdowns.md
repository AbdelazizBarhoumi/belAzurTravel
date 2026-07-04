# Admin CRUD Text-to-Dropdown Conversion Plan

## Architecture Context

- **No React Hook Form or Zod** — the project uses `EntityFormDialog` with declarative `SectionDef[]` and `FieldDef`
- Forms use flat `Record<string, unknown>` state via `setField(key, value)`
- `FieldDef.type === 'select'` with `options` array is already supported natively
- `SectionDef.render` callback allows fully custom UI (where CountrySelect/CitySelect are used)
- CountrySelect emits `(code: string, names: LocalizedName)` — code is the ISO 2-letter code
- `useCountryByCode(code)` returns `{code, name: {en, fr, ar}}` or null
- Flag emoji can be generated from ISO code via Unicode regional indicator symbols
- **AdminVoyages.tsx does not exist** — skip that page entirely

---

## Phase 1: New Shared Data & Components

### 1.1 Create `resources/js/data/adminSelectOptions.ts`

Static option lists for all dropdown fields across admin pages:

```ts
// --- Visa regions ---
export const VISA_REGIONS = [
    { value: 'Schengen', label: { en: 'Schengen', fr: 'Schengen', ar: 'شينغن' } },
    { value: 'EU', label: { en: 'European Union', fr: 'Union européenne', ar: 'الاتحاد الأوروبي' } },
    { value: 'GCC', label: { en: 'GCC', fr: 'CCG', ar: 'مجلس التعاون الخليجي' } },
    { value: 'Africa', label: { en: 'Africa', fr: 'Afrique', ar: 'أفريقيا' } },
    { value: 'Asia', label: { en: 'Asia', fr: 'Asie', ar: 'آسيا' } },
    { value: 'Americas', label: { en: 'Americas', fr: 'Amériques', ar: 'الأمريكيتين' } },
    { value: 'Oceania', label: { en: 'Oceania', fr: 'Océanie', ar: 'أوقيانوسيا' } },
    { value: 'Other', label: { en: 'Other', fr: 'Autre', ar: 'أخرى' } },
] as const;

// --- Flight stops ---
export const FLIGHT_STOPS = [
    { value: 'Direct', label: { en: 'Direct', fr: 'Direct', ar: 'مباشر' } },
    { value: '1 Stop', label: { en: '1 Stop', fr: '1 escale', ar: 'توقف واحد' } },
    { value: '2+ Stops', label: { en: '2+ Stops', fr: '2+ escales', ar: 'توقفان أو أكثر' } },
] as const;

// --- Cabin classes ---
export const CABIN_CLASSES = [
    { value: 'Economy', label: { en: 'Economy', fr: 'Économique', ar: 'الاقتصادية' } },
    { value: 'Premium Economy', label: { en: 'Premium Economy', fr: 'Économique supérieure', ar: 'الاقتصادية المميزة' } },
    { value: 'Business', label: { en: 'Business', fr: 'Affaires', ar: 'رجال أعمال' } },
    { value: 'First', label: { en: 'First', fr: 'Première', ar: 'الأولى' } },
] as const;

// --- Fuel types ---
export const FUEL_TYPES = [
    { value: 'Petrol', label: { en: 'Petrol', fr: 'Essence', ar: 'بنزين' } },
    { value: 'Diesel', label: { en: 'Diesel', fr: 'Diesel', ar: 'ديزل' } },
    { value: 'Electric', label: { en: 'Electric', fr: 'Électrique', ar: 'كهربائي' } },
    { value: 'Hybrid', label: { en: 'Hybrid', fr: 'Hybride', ar: 'هجين' } },
    { value: 'LPG', label: { en: 'LPG', fr: 'GPL', ar: 'غاز البترول المسال' } },
] as const;

// --- Transmission types ---
export const TRANSMISSION_TYPES = [
    { value: 'Automatic', label: { en: 'Automatic', fr: 'Automatique', ar: 'أوتوماتيك' } },
    { value: 'Manual', label: { en: 'Manual', fr: 'Manuelle', ar: 'يدوي' } },
    { value: 'Semi-Automatic', label: { en: 'Semi-Automatic', fr: 'Semi-automatique', ar: 'شبه أوتوماتيك' } },
] as const;

// --- Best time to visit (months) ---
export const BEST_TIME_OPTIONS = [
    { value: 'January', label: { en: 'January', fr: 'Janvier', ar: 'يناير' } },
    { value: 'February', label: { en: 'February', fr: 'Février', ar: 'فبراير' } },
    { value: 'March', label: { en: 'March', fr: 'Mars', ar: 'مارس' } },
    { value: 'April', label: { en: 'April', fr: 'Avril', ar: 'أبريل' } },
    { value: 'May', label: { en: 'May', fr: 'Mai', ar: 'مايو' } },
    { value: 'June', label: { en: 'June', fr: 'Juin', ar: 'يونيو' } },
    { value: 'July', label: { en: 'July', fr: 'Juillet', ar: 'يوليو' } },
    { value: 'August', label: { en: 'August', fr: 'Août', ar: 'أغسطس' } },
    { value: 'September', label: { en: 'September', fr: 'Septembre', ar: 'سبتمبر' } },
    { value: 'October', label: { en: 'October', fr: 'Octobre', ar: 'أكتوبر' } },
    { value: 'November', label: { en: 'November', fr: 'Novembre', ar: 'نوفمبر' } },
    { value: 'December', label: { en: 'December', fr: 'Décembre', ar: 'ديسمبر' } },
    { value: 'Year-round', label: { en: 'Year-round', fr: "Toute l'année", ar: 'على مدار السنة' } },
] as const;

// --- Star ratings ---
export const STAR_RATINGS = [
    { value: '1', label: '1 ★' },
    { value: '2', label: '2 ★★' },
    { value: '3', label: '3 ★★★' },
    { value: '4', label: '4 ★★★★' },
    { value: '5', label: '5 ★★★★★' },
] as const;

// --- Rating (0-5 as numbers) ---
export const RATING_OPTIONS = [
    { value: '0', label: '0' },
    { value: '0.5', label: '0.5' },
    { value: '1', label: '1' },
    { value: '1.5', label: '1.5' },
    { value: '2', label: '2' },
    { value: '2.5', label: '2.5' },
    { value: '3', label: '3' },
    { value: '3.5', label: '3.5' },
    { value: '4', label: '4' },
    { value: '4.5', label: '4.5' },
    { value: '5', label: '5' },
] as const;

// --- Airlines (common) ---
export const AIRLINES = [
    'Tunisair', 'Nouvelair', 'Transavia', 'Ryanair', 'easyJet',
    'Air France', 'Lufthansa', 'British Airways', 'Emirates',
    'Qatar Airways', 'Turkish Airlines', 'Saudi Arabian Airlines',
    'Royal Air Maroc', 'EgyptAir', 'Ethiopian Airlines',
    'KLM', 'Alitalia', 'Iberia', 'Swiss', 'Austrian Airlines',
    'Saudia', 'Gulf Air', 'Oman Air', 'Etihad Airways',
    'Airlines', 'Singapore Airlines', 'Cathay Pacific',
    'Thai Airways', 'Malaysia Airlines', 'Vietnam Airlines',
    'China Southern', 'China Eastern', 'Air China',
    'American Airlines', 'Delta', 'United Airlines',
    'Southwest Airlines', 'JetBlue', 'Spirit Airlines',
    'Aer Lingus', 'Norwegian', 'Wizz Air', 'Vueling',
    'Pegasus Airlines', 'Somon Air', 'Ariana Afghan Airlines',
    'Air Arabia', 'flydubai', 'SpiceJet', 'IndiGo',
    'Air India', 'SriLankan Airlines', 'Biman Bangladesh',
];

// --- Languages (common travel destinations) ---
export const LANGUAGES = [
    { value: 'Arabic', label: { en: 'Arabic', fr: 'Arabe', ar: 'العربية' } },
    { value: 'English', label: { en: 'English', fr: 'Anglais', ar: 'الإنجليزية' } },
    { value: 'French', label: { en: 'French', fr: 'Français', ar: 'الفرنسية' } },
    { value: 'Spanish', label: { en: 'Spanish', fr: 'Espagnol', ar: 'الإسبانية' } },
    { value: 'German', label: { en: 'German', fr: 'Allemand', ar: 'الألمانية' } },
    { value: 'Italian', label: { en: 'Italian', fr: 'Italien', ar: 'الإيطالية' } },
    { value: 'Portuguese', label: { en: 'Portuguese', fr: 'Portugais', ar: 'البرتغالية' } },
    { value: 'Turkish', label: { en: 'Turkish', fr: 'Turc', ar: 'التركية' } },
    { value: 'Hindi', label: { en: 'Hindi', fr: 'Hindi', ar: 'الهندية' } },
    { value: 'Thai', label: { en: 'Thai', fr: 'Thaï', ar: 'التايلندية' } },
    { value: 'Japanese', label: { en: 'Japanese', fr: 'Japonais', ar: 'اليابانية' } },
    { value: 'Chinese', label: { en: 'Chinese', fr: 'Chinois', ar: 'الصينية' } },
    { value: 'Russian', label: { en: 'Russian', fr: 'Russe', ar: 'الروسية' } },
    { value: 'Dutch', label: { en: 'Dutch', fr: 'Néerlandais', ar: 'الهولندية' } },
    { value: 'Malay', label: { en: 'Malay', fr: 'Malais', ar: 'الملايوية' } },
    { value: 'Korean', label: { en: 'Korean', fr: 'Coréen', ar: 'الكورية' } },
];

// --- Currencies ---
export const CURRENCIES = [
    { value: 'TND', label: { en: 'Tunisian Dinar (TND)', fr: 'Dinar tunisien (TND)', ar: 'الدينار التونسي (TND)' } },
    { value: 'EUR', label: { en: 'Euro (EUR)', fr: 'Euro (EUR)', ar: 'اليورو (EUR)' } },
    { value: 'USD', label: { en: 'US Dollar (USD)', fr: 'Dollar américain (USD)', ar: 'الدولار الأمريكي (USD)' } },
    { value: 'GBP', label: { en: 'British Pound (GBP)', fr: 'Livre sterling (GBP)', ar: 'الجنيه الإسترليني (GBP)' } },
    { value: 'CHF', label: { en: 'Swiss Franc (CHF)', fr: 'Franc suisse (CHF)', ar: 'الفرنك السويسري (CHF)' } },
    { value: 'TRY', label: { en: 'Turkish Lira (TRY)', fr: 'Lire turque (TRY)', ar: 'الليرة التركية (TRY)' } },
    { value: 'EGP', label: { en: 'Egyptian Pound (EGP)', fr: 'Livre égyptienne (EGP)', ar: 'الجنيه المصري (EGP)' } },
    { value: 'MAD', label: { en: 'Moroccan Dirham (MAD)', fr: 'Dirham marocain (MAD)', ar: 'الدرهم المغربي (MAD)' } },
    { value: 'AED', label: { en: 'UAE Dirham (AED)', fr: 'Dirham des EAU (AED)', ar: 'درهم الإمارات (AED)' } },
    { value: 'SAR', label: { en: 'Saudi Riyal (SAR)', fr: 'Riyal saoudien (SAR)', ar: 'الريال السعودي (SAR)' } },
    { value: 'JPY', label: { en: 'Japanese Yen (JPY)', fr: 'Yen japonais (JPY)', ar: 'الين الياباني (JPY)' } },
    { value: 'CAD', label: { en: 'Canadian Dollar (CAD)', fr: 'Dollar canadien (CAD)', ar: 'الدولار الكندي (CAD)' } },
    { value: 'AUD', label: { en: 'Australian Dollar (AUD)', fr: 'Dollar australien (AUD)', ar: 'الدولار الأسترالي (AUD)' } },
    { value: 'CNY', label: { en: 'Chinese Yuan (CNY)', fr: 'Yuan chinois (CNY)', ar: 'اليوان الصيني (CNY)' } },
    { value: 'INR', label: { en: 'Indian Rupee (INR)', fr: 'Roupie indienne (INR)', ar: 'الروبية الهندية (INR)' } },
    { value: 'KWD', label: { en: 'Kuwaiti Dinar (KWD)', fr: 'Dinar koweïtien (KWD)', ar: 'الدينار الكويتي (KWD)' } },
    { value: 'BHD', label: { en: 'Bahraini Dinar (BHD)', fr: 'Dinar bahreïni (BHD)', ar: 'الدينار البحريني (BHD)' } },
    { value: 'OMR', label: { en: 'Omani Rial (OMR)', fr: 'Rial omanais (OMR)', ar: 'الريال العماني (OMR)' } },
    { value: 'QAR', label: { en: 'Qatari Riyal (QAR)', fr: 'Riyal qatari (QAR)', ar: 'الريال القطري (QAR)' } },
];
```

### 1.2 Create `resources/js/components/ui/LocalizedSelect.tsx`

A reusable wrapper around the existing shadcn `Select` that displays localized labels:

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

interface LocalizedOption {
    value: string;
    label: string | { en: string; fr: string; ar: string };
}

interface LocalizedSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly LocalizedOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function LocalizedSelect({ value, onValueChange, options, placeholder, className, disabled }: LocalizedSelectProps) {
    const { lang } = useLanguage();

    const getLabel = (label: string | { en: string; fr: string; ar: string }): string => {
        if (typeof label === 'string') return label;
        return label[lang] || label.en || '';
    };

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {getLabel(opt.label)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
```

### 1.3 Create `resources/js/components/ui/AirportSelect.tsx`

A searchable airport/city dropdown (could be used for `from`/`to` in flights). Uses `useCities` from the existing hook, or a static list of major airports. This depends on whether the project wants city-based or airport-based selection.

**Option A (simpler)**: Use a static list of major airports with IATA codes.
**Option B (richer)**: Use `useCities` from the existing hook for city selection.

Recommendation: Start with **Option A** (static airport list) since flights need airport-level granularity. Create `resources/js/data/airports.ts` with ~100 major airports.

```ts
export const AIRPORTS = [
    { iata: 'TUN', city: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' }, country: 'TN' },
    { iata: 'NBE', city: { en: 'Monastir', fr: 'Monastir', ar: 'المنستير' }, country: 'TN' },
    { iata: 'DJE', city: { en: 'Djerba', fr: 'Djérbah', ar: 'جربة' }, country: 'TN' },
    { iata: 'TOB', city: { en: 'Tozeur', fr: 'Tozeur', ar: 'توزر' }, country: 'TN' },
    // ... more airports
] as const;
```

Then create `resources/js/components/ui/AirportSelect.tsx` that renders a `Select` with city name + IATA code.

---

## Phase 2: AdminVisas.tsx Changes

**File**: `resources/js/pages/admin/AdminVisas.tsx`

### Changes:
1. **Replace `code` text input with `CountrySelect`**:
   - Remove the `code` `<Input>` (lines 191-201)
   - Replace with `<CountrySelect>` that writes:
     - `code` → ISO code (e.g. "FR")
     - `flag` → generated from ISO code using Unicode regional indicators
     - `name_en`, `name_fr`, `name_ar` → from the `LocalizedName` returned by CountrySelect
   - The `onChange` callback:
     ```tsx
     <CountrySelect
         value={String(values.code ?? '')}
         onChange={(code, names) => {
             setField('code', code);
             setField('flag', countryCodeToFlag(code));
             setField('name_en', names.en);
             setField('name_fr', names.fr);
             setField('name_ar', names.ar);
         }}
     />
     ```

2. **Replace `flag` text input with read-only display** (lines 204-222):
   - Change to a read-only `<Input>` that shows the flag emoji, or remove it entirely since it auto-populates
   - Better: show as a small preview badge next to the CountrySelect

3. **Replace `name_en/fr/ar` text inputs with auto-populated fields** (lines 224-242):
   - These auto-populate from CountrySelect, so change to read-only or remove them
   - Since names are now auto-set by CountrySelect, the separate name fields can be removed from the form
   - OR keep them as editable overrides (in case user wants custom name)

4. **Replace `region_en/fr/ar` text inputs with `LocalizedSelect`** (lines 244-262):
   - Import `LocalizedSelect` and `VISA_REGIONS`
   - Replace the `<Input>` with:
     ```tsx
     <LocalizedSelect
         value={String(values[`region_${activeLang}`] ?? '')}
         onValueChange={(val) => {
             setField('region_en', val);
             setField('region_fr', val);
             setField('region_ar', val);
         }}
         options={VISA_REGIONS}
         placeholder={t('admin.visaForm.regionPlaceholder')}
     />
     ```
   - Note: Region values are the same across languages (e.g. "Schengen"), so all three language fields get the same value

5. **`processing_en/fr/ar` remains as text inputs** — no change needed

6. **Add `countryCodeToFlag` helper function** (utility, can be in `resources/js/lib/utils.ts` or inline):
   ```ts
   function countryCodeToFlag(code: string): string {
       return code
           .toUpperCase()
           .split('')
           .map((c) => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
           .join('');
   }
   ```

7. **Update validation**: Remove `flag` and `name_*` required checks since they auto-populate from country selection

---

## Phase 3: AdminFlights.tsx Changes

**File**: `resources/js/pages/admin/AdminFlights.tsx`

### Changes:

1. **Replace `from` text input with `AirportSelect` or city dropdown** (line 335):
   - Replace the `from` field in the `routeAndAirline` section
   - The `from` field is rendered as a generic text input via `fields` array in the `routeAndAirline` section (lines 327-344)
   - Need to change this section to use `render` instead of `fields` to support custom Select
   - Import `AIRPORTS` data and render a Select with airport options

2. **Replace `to` text input with `AirportSelect`** (line 308):
   - The `to` field is in the localized `renderLocalizedInputs` call (lines 294-322)
   - Change the `to` field rendering to use a Select instead of text input
   - Since `to` is localized (`to_en`, `to_fr`, `to_ar`), the Select should set all three

3. **Replace `airline` text input with airline dropdown** (line 301):
   - Similar to `to`, the `airline` field is in `renderLocalizedInputs`
   - Import `AIRLINES` and render a Select with airline options
   - Set `airline_en`, `airline_fr`, `airline_ar` all to the same value

4. **Replace `stops` text input with dropdown** (line 317):
   - Import `FLIGHT_STOPS` and render a Select
   - Set `stops_en`, `stops_fr`, `stops_ar` all to the same value

5. **Replace `cabin` text input with dropdown** (line 400):
   - Import `CABIN_CLASSES` and render a Select
   - Set `cabin_en`, `cabin_fr`, `cabin_ar` all to the same value

6. **Refactor `renderLocalizedInputs`** to support select fields:
   - Add a `type` parameter to the field definition: `'text' | 'select'`
   - For select fields, render a `Select` component instead of `<input>`
   - Or create a separate `renderLocalizedSelects` helper

**Approach**: The cleanest approach is to refactor the localized field rendering to accept an optional `options` array. When options are present, render a Select; otherwise render a text input.

```ts
function renderLocalizedInputs(
    values, setField, activeLang,
    fields: Array<{ key: string; label: string; placeholder: string; options?: Array<{value: string, label: string}> }>,
    sectionErrors,
) {
    // ... for each field, if field.options exists, render Select; else render input
}
```

---

## Phase 4: AdminHotels.tsx Changes

**File**: `resources/js/pages/admin/AdminHotels.tsx`

### Changes:

1. **Replace `stars` number input with star rating Select** (line 658-666):
   - The `stars` field is in the `pricing` section as a `FieldDef` with `type: 'number'`
   - Change to `type: 'select'` with `options: STAR_RATINGS`
   - Or change to a custom render with a star-select component
   - Simplest: change the field definition:
     ```ts
     {
         key: 'stars',
         label: t('admin.stars'),
         type: 'select',
         options: STAR_RATINGS.map(s => ({ label: s.label, value: s.value })),
         placeholder: t('admin.hotelForm.starsPlaceholder'),
         helpText: t('admin.hotelForm.starsHelp'),
     },
     ```

2. **Replace `rating` number input with rating Select** (line 645-653):
   - Similar approach — change to `type: 'select'` with `RATING_OPTIONS`
   - Or keep as number input but add a star-visual component
   - Simplest: change to select:
     ```ts
     {
         key: 'rating',
         label: t('admin.rating'),
         type: 'select',
         options: RATING_OPTIONS.map(r => ({ label: r.label, value: r.value })),
         placeholder: t('admin.hotelForm.ratingPlaceholder'),
         helpText: t('admin.hotelForm.ratingHelp'),
     },
     ```

3. **Country/City already use CountrySelect/CitySelect** — no changes needed

---

## Phase 5: AdminCars.tsx Changes

**File**: `resources/js/pages/admin/AdminCars.tsx`

### Changes:

1. **Replace `fuel_en/fr/ar` text inputs with fuel type dropdown** (lines 412-416):
   - The `fuel` field is in the localized fields array (lines 404-464)
   - Need to change the rendering logic to support select fields
   - Import `FUEL_TYPES` and render a Select
   - Since `fuel` is localized, the select value should be set for all three languages
   - Modify the localized field rendering to check if a field has `options` and render accordingly

2. **Replace `transmission_en/fr/ar` text inputs with transmission dropdown** (lines 418-424):
   - Import `TRANSMISSION_TYPES` and render a Select
   - Same approach as fuel

3. **`seats` remains as number input** — no change needed

**Approach**: Similar to flights, refactor the localized field rendering to support optional `options`. The current rendering loop (lines 403-464) iterates over an array of field definitions. Add an `options` property to each field definition entry.

```ts
const localizedFields = [
    {
        key: 'name',
        label: t('admin.name'),
        placeholder: t('admin.carForm.namePlaceholder'),
        helpText: t('admin.carForm.nameHint'),
    },
    {
        key: 'fuel',
        label: t('admin.carForm.fuel'),
        options: FUEL_TYPES, // new
    },
    {
        key: 'transmission',
        label: t('admin.carForm.transmission'),
        options: TRANSMISSION_TYPES, // new
    },
];
```

Then in the rendering loop, check `field.options` and render Select vs input accordingly.

---

## Phase 6: AdminDestinations.tsx Changes

**File**: `resources/js/pages/admin/AdminDestinations.tsx`

### Changes:

1. **Replace `bestTime_en/fr/ar` text inputs with month/season dropdown** (lines 906-911):
   - The `bestTime`, `language`, `currency`, `weather` fields are in the "destinationFacts" section (lines 897-966)
   - Currently all rendered as `<Input>` in a loop
   - Change `bestTime` to use `BEST_TIME_OPTIONS` Select

2. **Replace `language_en/fr/ar` text inputs with language dropdown** (lines 913-918):
   - Use `LANGUAGES` options

3. **Replace `currency_en/fr/ar` text inputs with currency dropdown** (lines 919-924):
   - Use `CURRENCIES` options

4. **`weather` remains as text input** — could also become a dropdown but user didn't request it

**Approach**: The destinationFacts section (lines 897-966) renders all fields in a loop. Refactor to handle select fields:

```tsx
const destinationFactFields = [
    { key: 'bestTime', options: BEST_TIME_OPTIONS },
    { key: 'language', options: LANGUAGES },
    { key: 'currency', options: CURRENCIES },
    { key: 'weather' }, // remains text
];

// In render:
{destinationFactFields.map((field) => {
    const fieldKey = localizedKey(field.key, activeLang);
    if (field.options) {
        return (
            <div key={fieldKey} className="space-y-2">
                <Label>{t(`admin.destinationForm.${field.key}`)}<LangBadge lang={activeLang} /></Label>
                <LocalizedSelect
                    value={String(values[fieldKey] ?? '')}
                    onValueChange={(val) => setField(fieldKey, val)}
                    options={field.options}
                />
            </div>
        );
    }
    return ( /* existing Input rendering */ );
})}
```

---

## Phase 7: AdminTours.tsx Changes

**File**: `resources/js/pages/admin/AdminTours.tsx`

### Changes:

1. **Replace `rating` number input with rating Select** (lines 480-512):
   - Import `RATING_OPTIONS`
   - Replace the `<input type="number">` with a `LocalizedSelect` or plain `Select`
   - Since rating is not localized, use a plain `Select`:
     ```tsx
     <Select
         value={String(values.rating ?? '')}
         onValueChange={(val) => setField('rating', val === '' ? null : Number(val))}
     >
         <SelectTrigger>
             <SelectValue placeholder={t('admin.tourForm.ratingPlaceholder')} />
         </SelectTrigger>
         <SelectContent>
             {RATING_OPTIONS.map((r) => (
                 <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
             ))}
         </SelectContent>
     </Select>
     ```

2. **`duration` remains as text input** — no change requested

---

## Phase 8: AdminVoyages.tsx — SKIPPED

File does not exist in the project. The user listed it but it's not present at `resources/js/pages/admin/AdminVoyages.tsx`. Skip entirely.

---

## Phase 9: Utility Function

### 9.1 Add `countryCodeToFlag` to `resources/js/lib/utils.ts`

```ts
export function countryCodeToFlag(code: string): string {
    return code
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
        .join('');
}
```

---

## Implementation Order

1. **Phase 1**: Create shared data files and components (foundation)
   - `resources/js/data/adminSelectOptions.ts`
   - `resources/js/components/ui/LocalizedSelect.tsx`
   - `resources/js/components/ui/AirportSelect.tsx` (optional, for flights)
   - `resources/js/data/airports.ts` (optional, for flights)
   - `countryCodeToFlag` utility function

2. **Phase 2**: AdminVisas.tsx (CountrySelect for code, auto-populate flag/names, region dropdown)

3. **Phase 3**: AdminFlights.tsx (airport dropdowns, airline, stops, cabin)

4. **Phase 4**: AdminHotels.tsx (stars, rating dropdowns)

5. **Phase 5**: AdminCars.tsx (fuel, transmission dropdowns)

6. **Phase 6**: AdminDestinations.tsx (bestTime, language, currency dropdowns)

7. **Phase 7**: AdminTours.tsx (rating dropdown)

---

## Summary of All Files

### New files to create:
1. `resources/js/data/adminSelectOptions.ts` — all static option lists
2. `resources/js/components/ui/LocalizedSelect.tsx` — reusable localized select
3. `resources/js/components/ui/AirportSelect.tsx` — airport/city select (optional)
4. `resources/js/data/airports.ts` — airport data (optional)

### Files to modify:
1. `resources/js/lib/utils.ts` — add `countryCodeToFlag` utility
2. `resources/js/pages/admin/AdminVisas.tsx` — CountrySelect for code, region dropdown
3. `resources/js/pages/admin/AdminFlights.tsx` — airport, airline, stops, cabin dropdowns
4. `resources/js/pages/admin/AdminHotels.tsx` — stars, rating dropdowns
5. `resources/js/pages/admin/AdminCars.tsx` — fuel, transmission dropdowns
6. `resources/js/pages/admin/AdminDestinations.tsx` — bestTime, language, currency dropdowns
7. `resources/js/pages/admin/AdminTours.tsx` — rating dropdown

### No npm packages needed:
- `country-state-city` and `i18n-iso-countries` are already installed
- Flag emoji generation uses native Unicode (no package needed)
- All dropdowns use the existing shadcn `Select` component
