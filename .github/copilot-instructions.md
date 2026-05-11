 # IoT-REAP — GitHub Copilot Master Instructions
 > Place this file at `.github/copilot-instructions.md` so Copilot reads it automatically in every file.
 > Last updated: February 2026 | Project: IoT-REAP | Stack: Laravel 11 + React 18 + TypeScript + Proxmox + Guacamole

 ---

 ## 0. WHO YOU ARE HELPING

 You are assisting a **final-year engineering student** building IoT-REAP:
 a secure industrial remote operations platform for Industry 4.0.

 The developer is:
 - Comfortable with Laravel (MVC, Eloquent, APIs, queues)
 - Beginner in React/TypeScript — **explain TypeScript patterns when you use them**
 - Experienced with Git, Docker, PHPUnit, Postman

 Your job is to help build production-quality code, not just working code.
 When you suggest something, it must be correct, secure, and follow the patterns below.

 ---

 ## 1. ABSOLUTE RULES — NEVER VIOLATE THESE

 ```
 NEVER put business logic in a Controller.
 NEVER query the database directly from a Controller.
 NEVER use DB::statement() or DB::select() raw — use Eloquent or Repository methods.
 NEVER store secrets in code — always use env() / config().
 NEVER store sensitive auth tokens in localStorage — prefer session cookies (SameSite) for web auth. Use Zustand for user state only.
 NEVER generate migrations with wrong column types — always check existing schema first.
 NEVER suggest dd() or var_dump() in production code paths.
 NEVER use any in TypeScript — define proper interfaces.
 NEVER generate a feature without its corresponding test stub.
 NEVER suggest storing passwords in plain text or using MD5/SHA1 for hashing.
 NEVER modify the main or develop branch directly.
 NEVER commit .env files.
 ```

 ---

 ## 2. PROJECT ARCHITECTURE

 ### 2.1 Laravel — Request Lifecycle (FOLLOW THIS EXACTLY)

 ```
 HTTP Request
     │
     ▼
 FormRequest          ← validates input, authorizes role
     │
     ▼
 Controller           ← thin: receives request, calls one service method, returns response
     │
     ▼
 Service              ← ALL business logic lives here
     │
     ▼
 Repository           ← ALL database queries live here
     │
     ▼
 Model / Eloquent     ← relationships, casts, scopes only
     │
     ▼
 API Resource         ← shapes the JSON response, hides internal fields
 ```

 **Controller must look like this — no exceptions:**
 ```php
 public function store(CreateVMSessionRequest $request): JsonResponse
 {
     $session = $this->vmSessionService->provision(
         user: auth()->user(),
         templateId: $request->validated('template_id'),
         duration: $request->validated('duration_minutes'),
     );

     return response()->json(new VMSessionResource($session), 201);
 }
 ```

 **Service must look like this:**
 ```php
 // Services are NOT static. They are injected via constructor DI.
 // Services throw domain exceptions — never return null on failure.
 // Services dispatch events and jobs — Controllers do not.
 public function provision(User $user, int $templateId, int $duration): VMSession
 {
     $this->quotaService->assertNotExceeded($user);
     $node = $this->loadBalancer->selectNode();
     $vmId = $this->proxmoxClient->cloneTemplate($templateId, $node);
     $session = $this->vmSessionRepository->create([...]);
     CleanupVMJob::dispatch($session)->delay(now()->addMinutes($duration));
     event(new VMSessionCreated($session));
     return $session;
 }
 ```

 **Repository must look like this:**
 ```php
 // Repositories return Models or Collections — never arrays.
 // Repositories never throw HTTP exceptions — only domain exceptions.
 public function create(array $data): VMSession
 {
     return VMSession::create($data);
 }

 public function findActiveByUser(User $user): Collection
 {
     return VMSession::where('user_id', $user->id)
         ->where('status', VMSessionStatus::ACTIVE)
         ->with(['template', 'node'])
         ->get();
 }
 ```

 ### 2.2 React/TypeScript — Component Rules

 ```
 pages/          ← route-level, fetches data, passes to components
 components/     ← pure presentational, receives props, no direct API calls
 hooks/          ← all data fetching logic (useVMSession, useRobotTelemetry)
 api/            ← axios instances, typed API functions
 store/          ← Zustand stores (auth, notifications)
 types/          ← all TypeScript interfaces
 ```

 **Component must look like this:**
 ```tsx
 // Always type props explicitly — never use React.FC without generics
 // Never fetch data inside a component body — use custom hooks
 // Always handle loading and error states

 interface VMCardProps {
   session: VMSession;
   onTerminate: (sessionId: string) => void;
 }

 export function VMCard({ session, onTerminate }: VMCardProps) {
   return (
     <div className="...">
       {/* content */}
     </div>
   );
 }
 ```

 **Custom hook must look like this:**
 ```tsx
 // hooks/useVMSession.ts
 export function useVMSession(sessionId: string) {
   const [session, setSession] = useState<VMSession | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     vmApi.getSession(sessionId)
       .then(setSession)
       .catch(e => setError(e.message))
       .finally(() => setLoading(false));
   }, [sessionId]);

   return { session, loading, error };
 }
 ```

 ---

 ## 3. API INTEGRATION RULES

 ### 3.1 Proxmox API

 I have a Proxmox API client already implemented. When working with Proxmox:

 ```
 ALWAYS use the ProxmoxClient service — never call Guzzle/Http directly for Proxmox.
 ALWAYS handle PVE API errors — they return 200 with errors in the body sometimes.
 ALWAYS use API tokens (PVEAPIToken), never username/password in code.
 ALWAYS check node availability before provisioning.
 NEVER hardcode node names or VMID ranges — use config/proxmox.php.
 NEVER assume a clone operation is instant — always poll for completion.
 ```

 **Proxmox config structure (config/proxmox.php):**
 ```php
 return [
     'host'          => env('PROXMOX_HOST'),
     'port'          => env('PROXMOX_PORT', 8006),
     'token_id'      => env('PROXMOX_TOKEN_ID'),
     'token_secret'  => env('PROXMOX_TOKEN_SECRET'),
     'verify_ssl'    => env('PROXMOX_VERIFY_SSL', true),
     'timeout'       => env('PROXMOX_TIMEOUT', 30),
     'template_vmid_range' => [100, 199],
     'session_vmid_range'  => [200, 999],
 ];
 ```

 **Error handling pattern for Proxmox:**
 ```php
 try {
     $result = $this->proxmoxClient->cloneTemplate($templateId, $node);
 } catch (ProxmoxApiException $e) {
     Log::error('Proxmox clone failed', [
         'template_id' => $templateId,
         'node' => $node,
         'error' => $e->getMessage(),
     ]);
     throw new VMProvisioningException("Failed to provision VM: {$e->getMessage()}");
 }
 ```

 ### 3.2 Guacamole API

 I have a Guacamole API client already implemented. When working with Guacamole:

 ```
 ALWAYS use the GuacamoleClient service — never call Http directly for Guacamole.
 ALWAYS generate one-time tokens — never reuse connection tokens.
 ALWAYS delete connections when sessions end — never leave orphaned connections.
 NEVER expose the Guacamole admin credentials to the frontend.
 NEVER store Guacamole connection IDs in client-side storage.
 ALWAYS set connection timeouts to match the session duration.
 ```

 **Guacamole config structure (config/guacamole.php):**
 ```php
 return [
     'url'      => env('GUACAMOLE_URL'),
     'username' => env('GUACAMOLE_USERNAME'),
     'password' => env('GUACAMOLE_PASSWORD'),
     'data_source' => env('GUACAMOLE_DATA_SOURCE', 'MySQL'),
 ];
 ```

 **Connection creation pattern:**
 ```php
 // Always pass protocol-specific params from config, not hardcoded
 $connection = $this->guacamoleClient->createConnection([
     'name'       => "session-{$session->id}",
     'protocol'   => $session->template->protocol, // 'rdp', 'vnc', 'ssh'
     'parameters' => $this->buildConnectionParams($session),
 ]);
 ```

 ### 3.3 MQTT (Mosquitto)

 ```
 NEVER publish raw user input to MQTT — always validate and sanitize first.
 ALWAYS authenticate MQTT connections — no anonymous connections in production.
 ALWAYS use QoS 1 for robot commands (at least once delivery).
 ALWAYS use topic format: robot/{robot_id}/{type} — never deviate.
 NEVER allow users to publish to robot/{id}/telemetry — only ESP32 publishes there.
 ```

 ---

 ## 4. SECURITY RULES

 ### 4.1 Authentication & Authorization

 ```php
 // ALWAYS use FormRequest for authorization — not Controller
 public function authorize(): bool
 {
     return $this->user()->can('provision-vm');
 }

 // ALWAYS scope queries to the authenticated user
 // BAD:
 VMSession::find($id);
 // GOOD:
 VMSession::where('user_id', auth()->id())->findOrFail($id);

 // ALWAYS use Laravel Gates for admin actions
 Gate::authorize('admin-only');
 ```

 ### 4.2 Input Validation

 ```php
 // ALWAYS validate every input field — no exceptions
 // ALWAYS use specific rules — never just 'string' alone
 public function rules(): array
 {
     return [
         'template_id'       => ['required', 'integer', 'exists:vm_templates,id'],
         'duration_minutes'  => ['required', 'integer', 'min:30', 'max:240'],
         'session_type'      => ['required', Rule::in(['ephemeral', 'persistent'])],
     ];
 }
 ```

 ### 4.3 Frontend Security

 ```typescript
 // For web (Breeze) session-based auth:
 // - Use cookies (SameSite) and CSRF tokens. Set `axios.defaults.withCredentials = true`.
 // - NEVER send sensitive tokens in localStorage. Use Zustand for user state only.
 // - ALWAYS validate API responses against TypeScript interfaces before using.
 // api/client.ts
 axiosInstance.defaults.withCredentials = true;
 // Let axios send and receive cookies; backend provides `XSRF-TOKEN` cookie for CSRF protection.
 axiosInstance.interceptors.response.use(undefined, error => {
     // On 419/CSRF or 401-like responses, clear user state and redirect to login if needed.
     return Promise.reject(error);
 });
 ```

 ### 4.4 SQL & Injection

 ```php
 // ALWAYS use Eloquent or parameterized queries
 // NEVER use string interpolation in queries
 // BAD:
 DB::select("SELECT * FROM users WHERE name = '$name'");
 // GOOD:
 User::where('name', $name)->first();
 ```

 ---

 ## 5. TESTING RULES

 ### 5.1 Laravel Tests

 ```
 EVERY Service method must have at least one Unit test.
 EVERY API endpoint must have at least one Feature test.
 ALWAYS use RefreshDatabase trait in Feature tests.
 ALWAYS use factories — never insert test data manually.
 ALWAYS mock external services (ProxmoxClient, GuacamoleClient) in tests.
 NEVER test private methods — test through public interface.
 ```

 **Feature test pattern:**
 ```php
 public function test_engineer_can_provision_vm(): void
 {
     $user = User::factory()->engineer()->create();
     $template = VMTemplate::factory()->windows11()->create();

     // Mock external dependency
     $this->mock(ProxmoxClient::class)
          ->shouldReceive('cloneTemplate')
          ->once()
          ->andReturn(201);

     $response = $this->actingAs($user)
          ->postJson('/api/v1/sessions', [
              'template_id'      => $template->id,
              'duration_minutes' => 60,
          ]);

     $response->assertCreated()
              ->assertJsonStructure(['data' => ['id', 'status', 'expires_at']]);
 }

 public function test_unauthenticated_user_cannot_provision_vm(): void
 {
     $response = $this->postJson('/api/v1/sessions', []);
     $response->assertUnauthorized();
 }
 ```

 ### 5.2 React Tests

 ```typescript
 // ALWAYS write a test file alongside every component in components/
 // Use React Testing Library — never test implementation details
 // ALWAYS mock API calls with MSW (Mock Service Worker)
 // Test what the user sees — not internal state
 ```

---

## 6. GIT & COMMIT RULES

### Branch naming
```
feature/US-{id}-{short-kebab-description}   ← new stories
fix/{short-description}                      ← bug fixes
chore/{short-description}                    ← deps, config, tooling
refactor/{short-description}                 ← no behavior change
docs/{short-description}                     ← documentation only
```

### Commit message format (ENFORCED — never deviate)
```
{type}({scope}): {what changed, imperative mood, max 72 chars}

{optional body: why, not what}

{optional footer: Closes #XX}
```

**Types:** `feat` | `fix` | `test` | `refactor` | `chore` | `docs` | `perf`
**Scopes:** `auth` | `vm` | `guacamole` | `proxmox` | `robot` | `mqtt` | `scheduler` | `security` | `admin` | `ui`

**Examples:**
```
feat(vm): implement VM provisioning queue job

Dispatches ProvisionVMJob with retry logic and admin alerting
on third failure. Selects least-loaded node via LoadBalancer service.

Closes #7
```
```
test(auth): add feature tests for login rate limiting
fix(guacamole): handle connection token expiry on session extend
chore(deps): review authentication dependencies and remove unused packages
```

### PR rules
```
NEVER merge a PR with failing CI.
NEVER merge without updating the CHANGELOG.md entry for the sprint.
ALWAYS link the PR to its GitHub Issue with "Closes #XX".
ALWAYS write what changed AND how to test in the PR description.
```

---

## 7. CODE STYLE & FORMATTING

### PHP / Laravel
```php
// Use named arguments for clarity when > 2 params
$session = $this->service->provision(
    user: $user,
    templateId: $request->validated('template_id'),
    duration: $request->validated('duration_minutes'),
);

// Use enums for status fields — never raw strings
enum VMSessionStatus: string {
    case PENDING   = 'pending';
    case ACTIVE    = 'active';
    case EXPIRED   = 'expired';
    case FAILED    = 'failed';
}

// Use readonly properties in DTOs
class VMProvisioningData {
    public function __construct(
        public readonly int $templateId,
        public readonly int $durationMinutes,
        public readonly string $sessionType,
    ) {}
}

// Always type method parameters and return types
public function provision(User $user, VMProvisioningData $data): VMSession
```

### TypeScript / React
```typescript
// Always define interface before component — never inline complex types
interface VMSession {
  id: string;
  status: 'pending' | 'active' | 'expired' | 'failed';
  templateName: string;
  expiresAt: string;  // ISO 8601
  guacamoleUrl: string | null;
}

// Always use optional chaining and nullish coalescing
const url = session?.guacamoleUrl ?? '/sessions';

// Always type API response wrappers
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
}
```

### File naming conventions
```
Laravel:
  Models          → PascalCase:   VMSession.php
  Controllers     → PascalCase:   VMSessionController.php
  Services        → PascalCase:   VMProvisioningService.php
  Repositories    → PascalCase:   VMSessionRepository.php
  FormRequests    → PascalCase:   CreateVMSessionRequest.php
  API Resources   → PascalCase:   VMSessionResource.php
  Jobs            → PascalCase:   ProvisionVMJob.php
  Events          → PascalCase:   VMSessionCreated.php
  Tests           → PascalCase:   VMSessionTest.php

React/TypeScript:
  Components      → PascalCase:   VMSessionCard.tsx
  Pages           → PascalCase:   VMSessionsPage.tsx
  Hooks           → camelCase:    useVMSession.ts
  Stores          → camelCase:    authStore.ts
  Types           → camelCase:    vmSession.types.ts
  API modules     → camelCase:    vmSession.api.ts
```

---

## 8. WHAT TO DO WHEN STUCK

If Copilot's suggestion doesn't match these patterns — **reject it** and write the correct comment to guide the next suggestion.

If a feature requires understanding the Proxmox or Guacamole API — **check the API files first** before generating anything.

If you are generating a new feature — **always generate in this order:**
1. Migration (if new table/column needed)
2. Model
3. Repository
4. Service
5. FormRequest
6. Controller route + method
7. API Resource
8. Feature test

Never skip steps. Never reorder.
