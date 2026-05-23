# Notifications (Polling) — Hosting & Setup Notes

This document explains the polling-based notification system used in the project, designed for maximum compatibility with shared hosting environments (like OVH, HostGator, etc.) without requiring Redis or long-lived connections.

## Overview

The frontend uses a polling strategy to keep the notification bell and unread count updated. Instead of a persistent connection (SSE/WebSockets), the browser sends periodic requests to the standard Laravel API endpoints.

## Architecture

1. **Source of Truth**: The `notifications` table in the database.
2. **Backend**: standard Laravel `DatabaseNotification` system.
3. **Frontend**: React Query handles the polling logic in the `NotificationBell` component.
4. **Interval**: Requests are sent every **15 seconds** while the user is active.

## Requirements

- **No Redis required**: The system works entirely with the database.
- **No long-lived processes**: Works on standard PHP-FPM or Apache setups without special timeout configurations.
- **Authentication**: Polling only runs for authenticated users.

## Frontend Implementation Details

The `NotificationBell` component utilizes `@tanstack/react-query` with the following configuration:

- `refetchInterval: 15000`: Polls the server every 15 seconds.
- `refetchOnWindowFocus: true`: Forces a refresh when the user switches back to the browser tab, ensuring they see the latest updates immediately.
- `staleTime: 10000`: Prevents redundant requests if multiple components request the same data within a short window.

## Endpoints

The following standard API routes are polled:

- `GET /api/notifications/unread-count`: Returns the current unread count.
- `GET /api/notifications?limit=10`: Returns the 10 most recent notifications.

## Benefits for Shared Hosting

- **Compatibility**: Many shared hosts block long-running PHP processes or do not provide Redis. This system uses standard HTTP requests that work everywhere.
- **Simplicity**: No need for process supervisors (like Supervisor) or dedicated WebSocket servers (like Pusher or Laravel Reverb).
- **Resource Efficiency**: By polling only when the tab is active and using a 15-second interval, the load on the web server remains low even with multiple concurrent users.

## Setup & Configuration

No special configuration is needed. As long as your database is migrated (`php artisan migrate`), notifications will work.

Ensure your `.env` reflects a standard database-backed setup:

```env
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

## Testing

1. Log in to the application.
2. Open the browser's Network tab.
3. Observe requests to `unread-count` and `notifications` every 15 seconds.
4. Trigger a notification (e.g., create a booking) and confirm the bell updates on the next poll or when you refocus the tab.
