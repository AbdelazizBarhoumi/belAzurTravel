# Blog Post Entity Analysis

## Overview
The `BlogPost` entity manages blog posts within the system. It uses the `blog_posts` table in the database and is accessed through `App\Models\BlogPost`.

## Database Schema (`database/migrations/2026_05_13_011120_create_blog_posts_table.php`)
The table structure is defined as:
- `id`: BigInt (Primary Key)
- `slug`: String (Unique)
- `category_key`: String (Nullable, Indexed)
- `title`: JSON
- `excerpt`: JSON
- `date`: String
- `category`: JSON
- `image`: String
- `content`: JSON (nullable)
- `timestamps`

## Model Definition (`app/Models/BlogPost.php`)
- **Fillable:** `['slug', 'title', 'excerpt', 'date', 'category_key', 'category', 'image', 'content']`
- **Casts:** 
  - `title`: `array`
  - `excerpt`: `array`
  - `category`: `array`
  - `content`: `array`
  - `date`: `date`

## Observations & Inconsistencies

### 1. Data Type for `date`
- **Database:** `string`
- **Model:** Casts to `date`.
- **Inconsistency:** Eloquent's `date` cast on a `string` column might cause casting issues if the format isn't strictly recognized by Carbon/PHP. While the model now casts it, the database still uses `string`. No immediate action required, but consider migration to `date` type in future.

### 2. Redundancy in `category` vs `category_key`
- The `BlogPost` model includes both `category` (JSON) and `category_key` (String).
- Controllers (`BlogPostController`) use both. 
- **Inconsistency:** The system maintains both, potentially leading to desync. The current implementation uses `category` (JSON) for public display, but `category_key` is available. Need to determine the intended primary source of truth for categories.

### 3. API Payload (`app/Http/Controllers/Api/BlogPostController.php`)
- The `payload` method manually maps the model to an array. It correctly includes `category` and `content`.
- Use of caching in `index` and `show` is implemented, but ensure cache clearing mechanisms (not shown in this file, likely in `AdminBlogPostController` or handled elsewhere) keep this data fresh.

## Summary
The `BlogPost` entity is structurally sound but holds redundant category information (`category` JSON vs `category_key` string). The model correctly casts the `date` string to a `date` object, which is good practice despite the database type mismatch. The current API controller correctly maps fields.
