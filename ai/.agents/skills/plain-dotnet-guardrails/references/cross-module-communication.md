# Cross-Module Communication

How Plain Concepts modules communicate with each other ÔÇö permitted patterns and forbidden patterns.

## Synchronous (In-Process)

Modules communicate synchronously through **Contracts interfaces**.

**Pattern:**

1. **Module A** (provider) defines an interface in its `.Contracts` project:
   ```csharp
   // OrdersModule.Contracts
   public interface IOrderService
   {
       Task<decimal> GetOrderTotalAsync(Guid orderId, CancellationToken ct = default);
   }
   ```

2. **Module A** implements the interface in its main project:
   ```csharp
   // OrdersModule (implementation)
   internal sealed class OrderService : IOrderService
   {
       public async Task<decimal> GetOrderTotalAsync(Guid orderId, CancellationToken ct)
       {
           // implementation
       }
   }
   ```
   Registered in `OrdersModule.Add()`:
   ```csharp
   builder.Services.AddScoped<IOrderService, OrderService>();
   ```

3. **Module B** (consumer) takes `IOrderService` as a constructor parameter ÔÇö it only references `OrdersModule.Contracts`, not `OrdersModule` directly:
   ```csharp
   // InvoicingModule (consumer)
   public sealed class InvoicingModule : ModuleBase
   {
       public override void Add(IHostApplicationBuilder builder)
       {
           // InvoicingModule references OrdersModule.Contracts, not OrdersModule
           // The Server project wires both modules via DI at startup
       }
   }
   ```

4. The **Server** project references both modules. DI resolves `IOrderService` to `OrderService` at runtime ÔÇö Module B never knows the concrete type.

---

## Domain Events (In-Process, Synchronous)

Modules communicate reactively through **domain events**.

**Pattern:**

1. **Module A** raises a domain event in its entity:
   ```csharp
   // OrdersModule.Contracts/Public/Events/OrderCreatedEvent.cs
   public record OrderCreatedEvent(Guid OrderId, Guid CustomerId, decimal Total) : IDomainEvent;
   ```

2. **Module A** entity raises the event on state change:
   ```csharp
   public sealed class Order : BaseEntity<Guid>
   {
       public static ErrorOr<Order> Create(Guid customerId, decimal total)
       {
           var order = new Order { ... };
           order.Raise(new OrderCreatedEvent(order.Id, customerId, total));
           return order;
       }
   }
   ```

3. **`PublishDomainEventsInterceptor`** fires on `SaveChanges` ÔÇö collects all `IDomainEvent` instances from EF entities and dispatches them.

4. **Module B** defines a handler (in its own assembly):
   ```csharp
   // InvoicingModule
   internal sealed class OnOrderCreated : IDomainEventHandler<OrderCreatedEvent>
   {
       public async Task Handle(OrderCreatedEvent @event, CancellationToken ct)
       {
           // create draft invoice for the new order
       }
   }
   ```
   Registered automatically by `AddHandlersFromAssembly(typeof(InvoicingModule).Assembly)`.

**Key point:** Module B references `OrdersModule.Contracts` (for the event type), not `OrdersModule`. The event is raised in Module A's transaction; Module B's handler runs in the same transaction (synchronous in-process dispatch).

---

## Forbidden

**Direct class-to-class references between modules are forbidden** (enforced by MOD002 Roslyn analyzer):

```csharp
// FORBIDDEN ÔÇö Module B referencing Module A's implementation class
using MyApp.Modules.Orders.Features.Products.UseCases.Create;  // ÔØî

// FORBIDDEN ÔÇö Module B injecting Module A's DbContext
public class InvoicingHandler(OrdersDbContext ordersDb) { }     // ÔØî

// FORBIDDEN ÔÇö Module B calling Module A's handler directly
var result = await _createOrderHandler.Handle(command, ct);     // ÔØî
```

Only these cross-module references are permitted:
- `ModuleA.Contracts` types (interfaces + domain events)
- `{ProjectName}.BuildingBlocks` types (shared infrastructure)
- `{ProjectName}.Constants` types (shared constants)

---

## Future (Deferred to Phase 2+)

**Async messaging via integration bus (outbox pattern)** is deferred.

The `IIntegrationEvent` interface in `BuildingBlocks` is the placeholder hook for future async cross-module messaging (e.g., via Azure Service Bus, RabbitMQ, or MassTransit).

**Do not implement async messaging in Phase 1.** The domain event pattern (synchronous, in-process) is sufficient for the current scope.

When async messaging is added:
- A new `IIntegrationEventHandler<T>` will be introduced in `BuildingBlocks`.
- An outbox table will be added to each module's schema.
- A background worker will dispatch integration events reliably (at-least-once delivery).
- This is a future skill or phase ÔÇö not part of `plain-dotnet-module` or `plain-dotnet-use-cases`.
