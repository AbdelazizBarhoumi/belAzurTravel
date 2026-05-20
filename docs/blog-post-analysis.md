# Blog Post Entity Analysis

## Overview
The `BlogPost` entity manages blog posts within the system. It uses the `blog_posts` table in the database and is accessed through `App\Models\BlogPost`.

## Database Schema (`database/migrations/2026_05_13_011000_create_catalog_tables.php`)
The table structure is defined as:
- `id`: BigInt (Primary Key)
- `slug`: String (Unique)
- `title`: JSON
- `excerpt`: JSON
- `date`: String
- `category`: JSON
- `image`: String
- `content`: JSON (nullable)
- `timestamps`

## Model Definition (`app/Models/BlogPost.php`)
- **Fillable:** `['slug', 'title', 'excerpt', 'date', 'category_key', 'category', 'image', 'content']`
- **Casts:** `['title' => 'array', 'excerpt' => 'array', 'category' => 'array', 'content' => 'array']`

## Observations & Inconsistencies

### 1. Data Type for `date`
- **Database:** `string`
- **Model:** No cast specified for `date`.
- **Inconsistency:** Storing dates as strings in the database is prone to formatting issues. It would be better to use `date` or `datetime` types for better queryability and consistency.

### 2. Redundancy in `category` vs `category_key`
- The `BlogPost` model has both `category` and `category_key` in `$fillable`, but `category` is a JSON field in the database.
- Migration `2026_05_19_151622_add_category_key_to_catalog_tables.php` indicates that `category_key` is being added to `blog_posts`.
- **Inconsistency:** The model needs to be updated to reflect the new `category_key` field in the database, and the relationship between `category_key` and the `category` JSON field needs clarification.

### 3. API Payload (`app/Http/Controllers/Api/BlogPostController.php`)
- The `payload` method manually maps the model to an array.
- The `index` and `show` methods use `Cache` which might lead to stale data if not cleared on update.

## Summary
The `BlogPost` entity is structurally simple but contains potential issues regarding date handling and redundant category information. The addition of `category_key` in the latest migrations suggests an ongoing migration towards a more structured category system that is not yet fully reflected in the `BlogPost` model's `$fillable` configuration or the API controllers.
