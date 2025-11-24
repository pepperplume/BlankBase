# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASP.NET Core 10.0 MVC web application called "BlankBase" - a template-based project following conventional MVC architecture with Controllers, Models, and Views.

## Technology Stack

- **Framework**: ASP.NET Core 10.0 (.NET 10.0)
- **Project Type**: Web Application (MVC)
- **Features**: C# nullable reference types enabled, implicit usings enabled

## Build and Run Commands

```bash
# Build
dotnet build

# Run
dotnet run --project BlankBase/BlankBase.csproj
```

Application URLs:
- HTTPS: https://localhost:7065
- HTTP: http://localhost:5246

## Project Structure

- **Program.cs**: Entry point, middleware configuration, service registration (Toast, UnitOfWork)
- **Controllers/**: MVC controllers (HomeController, ToastController, ExampleRecordController)
- **Models/**: Data models, view models, toast models
- **Data/**: Repository pattern with EF Core
  - Context, IRepository, Repository (with ApplySort helper)
  - IUnitOfWork, UnitOfWork
  - PagedResult, QueryableExtensions
  - Entities/, Repositories/, SortColumns/ (nameof() constants)
- **Services/**: IToastService, ToastService
- **Extensions/**: TempDataExtensions (toast helpers)
- **Helpers/**: Name.cs (type-safe controller routing)
- **Views/**: Razor views by controller + Shared/
- **wwwroot/**: Static files (js/toast.js, css/, lib/)

## Type-Safe Routing Pattern

Uses `Name<T>` helper class to eliminate magic strings in routing. See `Helpers/Name.cs`.

**Usage:**
```cshtml
<!-- Controller names -->
<a asp-controller="@Name<ToastController>.Value" asp-action="@nameof(ToastController.Index)">

<!-- URL generation -->
@Url.Action(nameof(HomeController.Index), Name<HomeController>.Value)

<!-- With route values -->
@Url.Action(nameof(ExampleRecordController.Index), Name<ExampleRecordController>.Value,
            new { page = 1, sortBy = ExampleRecordSortColumns.Name })
```

**Benefits:** Compile-time safety, refactoring support, IntelliSense, no runtime errors.

**Configuration:** Available via `_ViewImports.cshtml` imports (`BlankBase.Helpers`, `BlankBase.Controllers`).

## Architecture Notes

**Middleware Pipeline (Program.cs):**
1. Exception handler (production) → /Home/Error
2. HSTS (production)
3. HTTPS redirection
4. Routing
5. Authorization
6. Static assets
7. MVC routing: `{controller=Home}/{action=Index}/{id?}`

**Default Route:** Home/Index

## Toast Notification System

Production-ready Bootstrap toast system with dependency injection. Three implementation patterns:

### 1. Client-Side JavaScript
```javascript
Toast.create("Message", Toast.Type.SUCCESS, 3000, true);
```

### 2. AJAX POST with JSON Methods
**Server:**
```csharp
var json = JsonSerializer.SerializeToNode(result);
json = _toastService.AddSuccessToJson(json!, "Success message!");
return Json(json, TempDataExtensions.JsonOptions); // CRITICAL: Use JsonOptions for enum serialization
```

**Client:**
```javascript
fetch(url, {...}).then(r => r.json()).then(data => Toast.showMessages(data));
```

### 3. Traditional POST-Redirect-Get
```csharp
_toastService.AddSuccess("Success message!");
return RedirectToAction("Index");
```

### Key Implementation Notes

**Service Registration (Program.cs):**
```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IToastService, ToastService>();
builder.Services.Configure<ToastDefaultOptions>(options => { /* ... */ });
```

**Critical JSON Serialization:**
- ALWAYS use `TempDataExtensions.JsonOptions` when returning JSON with toasts
- Ensures enums serialize as strings ("Success") not integers (0)
- "toastMessages" property name defined once in ToastService constant (typo-proof)

**Components:**
- **Services**: IToastService (TempData methods + JSON methods), ToastService
- **Models**: ToastNotification, ToastType enum, ToastDefaultOptions
- **Extensions**: TempDataExtensions (AddToast, GetToasts, JsonOptions)
- **JavaScript**: wwwroot/js/toast.js (Toast.show, Toast.create, Toast.showMessages)
- **Views**: _ToastContainer.cshtml (auto-initialization from TempData)

**Demo Controllers/Views:** ToastController, Toast/Index, Toast/FormExample

## Repository Pattern with Pagination and Sorting

Generic Repository + Unit of Work pattern with server-side pagination and type-safe sorting.

### Core Components

- **IRepository&lt;TEntity&gt;**: Generic CRUD interface
- **Repository&lt;TDbContext, TEntity&gt;**: Base implementation with `ApplySort` helper
- **IUnitOfWork / UnitOfWork**: Aggregates repositories, transaction management
- **PagedResult&lt;T&gt;**: Pagination metadata (PageNumber, PageSize, TotalCount, TotalPages, HasPreviousPage, HasNextPage)
- **QueryableExtensions**: `GetPagedAsync()` on `IOrderedQueryable<T>` (compile-time enforcement)
- **SortDirections**: Constants ("asc", "desc")
- **SortColumns/**: Per-entity constants using `nameof()` (e.g., ExampleRecordSortColumns)

### Two Pagination Patterns

**1. Traditional Server-Side (ExampleRecord/Index):**
- Full page reload
- URL contains state (page, sortBy, sortDirection)
- Bookmarkable, works without JS, SEO-friendly

**2. AJAX with URL State (ExampleRecord/AjaxExample):**
- No page reload
- URL updated via History API (bookmarkable, refresh, back/forward support)
- Fetch API for data loading

### Repository Implementation Pattern

**Entity-specific repository with sortable pagination:**
```csharp
public async Task<PagedResult<ExampleRecord>> GetAllExampleRecordsPagedAsync(
    int pageNumber, int pageSize, string? sortBy = null, string sortDirection = SortDirections.Asc)
{
    var query = _Context.ExampleRecords.AsQueryable();
    var sortByLower = sortBy?.ToLower();

    var orderedQuery = sortByLower switch
    {
        var col when col == ExampleRecordSortColumns.Name.ToLower() =>
            ApplySort(query, x => x.Name, sortDirection.ToLower()),
        // ... other columns
        _ => ApplySort(query, x => x.Name, SortDirections.Asc) // Default
    };

    return await orderedQuery.GetPagedAsync(pageNumber, pageSize);
}
```

**Security:** Whitelist pattern - only explicitly defined columns can be sorted (no SQL injection).

### Creating New Repositories

1. **Create Entity** (Data/Entities/)
2. **Create Sort Columns Constants** (Data/SortColumns/) using `nameof(Entity.Property)`
3. **Create Repository Interface** extending `IRepository<Entity>` with paged method
4. **Implement Repository** using `ApplySort` helper in switch statement
5. **Add to Context** (DbSet&lt;Entity&gt;) and **UnitOfWork** (property + initialization)
6. **Create Controller** injecting IUnitOfWork

### Service Registration (Program.cs)

```csharp
builder.Services.AddDbContext<Context>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
```

### Key Features

- **Repository Pattern**: Generic base + entity-specific implementations
- **Unit of Work**: Transaction management
- **Compile-Time Safety**: IOrderedQueryable enforces sorting before pagination
- **Refactor-Safe**: Constants use nameof() for property names
- **ApplySort Helper**: Reduces duplication
- **Type-Safe Sorting**: No magic strings
- **SQL Injection Prevention**: Whitelist pattern

## Entity Caching Pattern

Standalone `EntityCache<TEntity, TKey>` class for manual orchestration in controllers when you need to merge multiple query results with automatic deduplication.

### When to Use

- **Multiple queries need merging** - Combining results from different database queries into a single unique collection
- **Orchestration scenarios** - Complex business logic requiring entity accumulation across operations
- **Deduplication required** - Ensuring each entity appears only once (by ID) when results overlap
- **Request-scoped caching** - Temporary entity storage during a single operation or HTTP request

### Key Features

- ✅ **Type-safe keys** - Compile-time enforcement prevents wrong key types
- ✅ **Constructor-based keySelector** - Set once, use everywhere (no repetition)
- ✅ **Automatic deduplication** - Keeps first occurrence when duplicate keys are added
- ✅ **Simple API** - No dependency injection required, instantiate when needed
- ✅ **Clean separation** - Repositories remain unchanged, caching is opt-in

### Basic Usage

```csharp
// Create cache with type-safe key selector (set once in constructor)
var cache = new EntityCache<ExampleRecord, int>(x => x.ExampleRecordID);

// Query 1: Get first batch of records
var results1 = await _unitOfWork.ExampleRecordRepository
    .GetAllExampleRecordsPagedAsync(1, 10);
cache.AddRange(results1.Items);

// Query 2: Get second batch (may have overlapping IDs)
var results2 = await _unitOfWork.ExampleRecordRepository
    .GetAllExampleRecordsPagedAsync(2, 10);
cache.AddRange(results2.Items); // Automatically deduplicates

// Query 3: Get specific records with different filters
var results3 = await SomeOtherQuery();
cache.AddRange(results3); // Keeps first occurrence of duplicates

// Get all unique entities
var allUniqueRecords = cache.GetAll().ToList();
```

### Available Methods

**Constructor:**
```csharp
EntityCache<TEntity, TKey>(Func<TEntity, TKey> keySelector)
```

**Adding entities:**
```csharp
cache.Add(entity);                  // Add single entity (uses constructor's keySelector)
cache.AddRange(entities);           // Add multiple entities (deduplicates automatically)
```

**Retrieving entities:**
```csharp
cache.TryGet(id, out entity);       // Type-safe lookup by ID
cache.Contains(id);                 // Check if ID exists (type-safe)
cache.GetAll();                     // Get all cached entities
cache.Count;                        // Number of cached entities
```

**Clearing:**
```csharp
cache.Clear();                      // Remove all entities from cache
```

### Type Safety

The generic `TKey` parameter ensures compile-time safety for all key-based operations:

```csharp
// int key type enforced
var cache = new EntityCache<ExampleRecord, int>(x => x.ExampleRecordID);

cache.TryGet(123, out var entity);      // ✅ Compiles
cache.TryGet("123", out var entity);    // ❌ Compile error - type mismatch!
cache.Contains(456);                    // ✅ Compiles
cache.Contains("456");                  // ❌ Compile error - type mismatch!
```

### Example: ExampleRecordController.CacheExample

See `Controllers/ExampleRecordController.cs:102` for a complete demonstration showing:
- Creating an EntityCache with constructor-based keySelector
- Querying the database multiple times with different sort orders
- Merging results with automatic deduplication
- Type-safe entity lookups
- Retrieving all unique cached entities

### Design Philosophy

**Why not integrate with repositories?**
- Keeps repositories simple and focused on data access
- Caching is opt-in - only use when needed
- Avoids adding complexity to every repository method
- Explicit control - developers decide when and where to cache

**Why manual instantiation instead of DI?**
- Simpler - no service registration required
- Explicit - clear when caching is being used
- Flexible - create multiple caches with different configurations if needed
- Lightweight - no overhead when not in use
