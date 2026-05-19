# Notifications (SSE) — Deployment & Setup Notes

This document explains how to deploy and run the Server-Sent Events (SSE) notifications pipeline added to the project.

Overview
--------
The frontend consumes a Server-Sent Events stream at `/api/notifications/stream`. The Laravel backend publishes per-user notification messages to Redis pub/sub channels (channel name `notifications:user:{id}`) after writing the notification to the database. The SSE controller subscribes to the authenticated user's Redis channel and streams messages as SSE events.

Requirements
------------
- Redis server accessible from the Laravel app (recommended)
- PHP process capable of long-running requests (Swoole / RoadRunner / Octane) or a webserver that will allow long-running streaming responses (note: classic PHP-FPM setups may time out; see alternatives below)
- `SESSION_DRIVER=redis` recommended to avoid session file locking when many concurrent polling clients exist
- (Optional) Queue worker (`php artisan queue:work`) if you enqueue notification jobs — not required for the current implementation which publishes immediately after notify(), but recommended for scaling

Configuration
-------------
1. Redis connection (in `.env`):

```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
SESSION_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

2. `config/database.php` already contains Redis configuration in a default Laravel app — ensure values above are correct for your environment.

3. Session driver

- Set `SESSION_DRIVER=redis` in `.env` and restart PHP/worker services. This reduces file-based session locking that causes heavy request latency when many browser tabs poll concurrently.

Running Redis locally (examples)
-------------------------------
- On macOS (Homebrew):

```bash
brew install redis
brew services start redis
```

- On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable --now redis-server
```

- On Windows: use WSL or Docker. Example (Docker):

```powershell
docker run -d --name bel_redis -p 6379:6379 redis:7
```

Running workers
---------------
If you elect to queue notifications or other jobs, run a worker:

```bash
php artisan queue:work --tries=3
```

For production, use a process supervisor (systemd, Supervisor, or Docker) to keep workers alive. Example Supervisor snippet:

```
[program:bel-queue-worker]
command=php /path/to/project/artisan queue:work redis --sleep=3 --tries=3 --timeout=60
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/bel/queue.log
```

Webserver & long-running requests
--------------------------------
The SSE controller subscribes to Redis and yields messages as they arrive. This requires PHP to be able to hold the response open for a long time. Options:

- Use a native PHP application server that supports long-running workers, e.g. Laravel Octane (Swoole or RoadRunner) — recommended for production SSE.
- If using PHP-FPM behind Nginx/Apache, ensure request timeouts are configured appropriately (`fastcgi_read_timeout` in Nginx), but be aware that PHP-FPM workers are a limited pool and long-held workers can exhaust capacity. For larger scale, prefer Octane or a dedicated SSE gateway.

Security and authentication
---------------------------
- The SSE endpoint is protected by your normal `auth` middleware; the controller uses the current authenticated user's id to subscribe to `notifications:user:{id}`.
- SSE uses cookies for session authentication (EventSource does not send custom headers by default). The frontend SSE client is configured to connect using same-origin credentials.

Testing the pipeline
--------------------
1. Start Redis and Laravel (with a server capable of streaming responses).
2. Open your app in a browser and inspect the Network tab. A request to `/api/notifications/stream` should be established and remain `200` with `text/event-stream` content type.
3. Trigger a notification (e.g., create a booking or support inquiry). After the backend stores the notification, it will publish to Redis and the SSE stream will receive an event named `notification`. The frontend should update the notifications cache and UI immediately.

If SSE does not work in your environment
---------------------------------------
If you cannot run long-lived requests, consider one of these alternatives:

- Use a WebSocket server (Pusher or laravel-websockets). This requires changing the broadcasting setup and using Laravel Echo on the frontend.
- Use a polling fallback with sensible defaults: increase poll interval (e.g., 30s), enable `refetchOnWindowFocus: true`, and ensure `refetchIntervalInBackground: false` to avoid background tabs polling.

Notes and caveats
-----------------
- The current implementation publishes the freshly-created database notification by reading the user's latest notification and publishing it. This is pragmatic but has potential (small) race conditions under extreme load — if you prefer to publish the notification payload from the Notification class directly, we can refactor that to avoid the DB read.
- Monitor Redis memory and connection counts in production; configure eviction policies and connection pooling as needed.

Questions / Next steps
---------------------
- I can add a small `php artisan` command or controller route to emit test notifications for QA.
- I can add an Octane / Supervisor example for production deployment if you'd like.
