# Dependency Injection & Convention over Configuration

Auto-discovery of handlers, validators, and modules — no manual wiring.

## Principle

Register components by **convention** (interface scanning, annotation scanning, naming convention)
rather than listing each one manually. When a developer adds a new handler, it is discovered
automatically — no registration code to remember.

## Convention-Based Registration

### Handler Discovery

All command handlers and query handlers are discovered by scanning packages/modules for types
that implement the handler interface or match a naming convention.

```
Scan module package
  → Find all types implementing CommandHandler interface
  → Register each with the appropriate lifetime
  → Repeat for QueryHandler interface
```

Each module scans **its own package** — not the host or another module's package.

### Validator Discovery

Input validators are discovered the same way — scan for types implementing the validator interface.

### Module Discovery

Modules self-register by implementing a module interface. The host scans loaded packages/modules at
startup and calls each module's initialization hook. No central module list.

## Pipeline Decorators (Cross-Cutting Concerns)

Cross-cutting behavior is applied via the **decorator pattern** — wrapping handlers in a chain of
decorators. Each decorator adds one concern.

### Standard Decorator Order

```
Incoming request
  └─ Logging decorator          (1st — captures start time, total duration)
       └─ Validation decorator  (2nd — runs validators; short-circuits on failure)
            └─ Caching decorator (3rd — returns cached result on hit; queries only)
                 └─ Handler     (4th — executes domain logic)
                      └─ Cache invalidation decorator (5th — evicts on write; commands only)
```

**Order matters.** Document the decorator chain for each project. Changing the order changes
behavior:

- If validation runs before logging, validation failures are not logged.
- If caching runs before validation, invalid but cached requests are served.

### Rules

1. **Register decorators in a single, explicit location** — not scattered across modules.
2. **Each decorator does one thing.** No "super decorator" that logs, validates, and caches.
3. **Decorators must not depend on specific handlers.** They wrap any handler generically.

## Language Examples

### .NET (Scrutor)

`AddHandlersFromAssembly(assembly)` scans for `IAppCommandHandler<,>` and `IAppQueryHandler<,>`.
`AddValidatorsFromAssembly(assembly)` scans for `AbstractValidator<T>`. Decorators registered via
Scrutor's `Decorate<>()`. Module discovery via `RegisterAppModules()` scanning for `IModule`.

### Java (Spring)

`@ComponentScan` discovers `@Service` and `@Component` types. `@Valid` triggers Bean Validation.
Decorators implemented via Spring AOP (`@Around` advice) or explicit `HandlerDecorator` chain.
Module discovery via `@SpringBootApplication` scanning or Spring Modulith.

### Python (dependency-injector / FastAPI)

`dependency_injector` container with auto-wiring. Validators via Pydantic models or custom
decorator-based validation. Middleware for cross-cutting concerns. Module discovery via entry-point
plugins or explicit package scanning.

### TypeScript (NestJS / tsyringe)

`@Injectable()` with module `providers` array. NestJS `@UsePipes()` for validation. Interceptors
(`@UseInterceptors()`) for logging and caching. Module discovery via `@Module({ imports: [...] })`.

### Go

Manual wiring in `main.go` using constructor injection (no DI container). Decorator pattern via
function wrapping: `func LoggingMiddleware(next Handler) Handler`. Module discovery via explicit
`RegisterModule()` calls in `main.go` — Go favors explicitness.
