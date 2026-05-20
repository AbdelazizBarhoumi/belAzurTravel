# SupportInquiry Entity Analysis

## Overview
The `SupportInquiry` entity manages communication between users (clients) and the system administration/support team. This document analyzes the end-to-end data flow, persistence, and consistency across the application.

## Database Schema (Migration: `2026_05_13_013000_create_support_inquiries_table.php`)
- **Table**: `support_inquiries`
- **Columns**:
    - `id`: bigIncrements
    - `user_id`: foreignId (nullable)
    - `assigned_to`: foreignId (nullable, references `users`)
    - `client`: JSON
    - `subject`: JSON
    - `message`: JSON
    - `status`: string (default: 'new')
    - `priority`: string (default: 'medium')
    - `replies`: JSON (nullable)
    - `resolved_at`: timestamp (nullable)
    - `timestamps`: created_at, updated_at

## Model Configuration (`app/Models/SupportInquiry.php`)
- **Fillable**: `user_id`, `assigned_to`, `client`, `subject`, `message`, `status`, `priority`, `replies`, `resolved_at`
- **Casts**:
    - `client`: array
    - `subject`: array
    - `message`: array
    - `replies`: array
    - `resolved_at`: datetime

## Data Flow Analysis

### 1. Creation (`App\Http\Controllers\Api\ClientController::createSupport`)
- **Input**: `subject` (string), `message` (string).
- **Transformation**:
    - `subject` and `message` are converted into an array of localized keys (`fr`, `ar`, `en`) via `localized()` method, containing the same string for all keys.
    - `client` is stored as an array of `['name' => ..., 'email' => ...]`.
- **Inconsistency**: The frontend sends strings, but the DB expects JSON (as defined by `array` cast in the model). The current implementation forces the same content for all languages, ignoring the multi-lingual intent of the JSON field.

### 2. Retrieval/API Exposure
- **Client Side (`App\Http\Controllers\Api\ClientController::support`)**:
    - Returns `subject`, `message`, `status`, `priority`, `replies`, `created_at`.
    - Note: `client` info is NOT returned to the client user.
- **Assistant Side (`App\Http\Controllers\Api\AssistantController::inquiryPayload`)**:
    - Returns `id`, `client`, `subject`, `message`, `status`, `priority`, `replies`, `created_at`.

### 3. Updating/Replying (`App\Http\Controllers\Api\AssistantController`)
- **updateInquiry**: Allows updating `status` ('new', 'in-progress', 'resolved') and `priority`.
- **reply**: Appends a new array object to `replies`. The structure of each reply is:
    - `author_id`, `author` (name), `message`, `created_at`.

## Identified Inconsistencies & Risks
1. **Localization**: The multi-lingual structure of `subject` and `message` (JSON) is not fully utilized; it is just a container for the same string repeated 3 times.
2. **Type/Schema**: The migration uses `json` columns, and the model uses `array` casts, which is consistent. However, the application logic assumes the contents of these JSON fields adhere to specific schemas (e.g., reply structure, localized content) which are not enforced by the database.
3. **Data Exposure**: `ClientController` exposes the `subject` and `message` directly from the database without filtering based on the user's preferred language. If the intent is to show localized content, the logic currently returns the entire JSON blob to the frontend instead of the localized value.
