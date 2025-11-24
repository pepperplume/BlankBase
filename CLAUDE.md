# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ASP.NET Core 10.0 MVC web application called "BlankBase" - a standard template-based project with minimal customization. The application follows the conventional MVC architecture pattern with Controllers, Models, and Views.

## Technology Stack

- **Framework**: ASP.NET Core 10.0 (.NET 10.0)
- **Project Type**: Web Application (MVC)
- **Features**: C# nullable reference types enabled, implicit usings enabled

## Build and Run Commands

### Build
```bash
dotnet build
```

### Run the application
```bash
dotnet run --project BlankBase/BlankBase.csproj
```

The application will be available at:
- HTTPS: https://localhost:7065
- HTTP: http://localhost:5246

### Clean build artifacts
```bash
dotnet clean
```

### Restore NuGet packages
```bash
dotnet restore
```

## Project Structure

- **Program.cs**: Application entry point and middleware configuration. Uses minimal hosting model with builder pattern. Includes toast service registration and UnitOfWork configuration.
- **Controllers/**: MVC controllers
  - **HomeController.cs**: Default controller with Index, Privacy, and Error actions
  - **ToastController.cs**: Toast notification demo controller
  - **ExampleRecordController.cs**: Pagination and sorting demo controller
- **Models/**: Data models and view models
  - **ErrorViewModel.cs**: Error page view model
  - **Toasts/**: Toast notification models (ToastNotification, ToastType, ToastDefaultOptions)
- **Data/**: Repository pattern implementation with Entity Framework Core
  - **Context.cs**: Entity Framework DbContext
  - **IRepository.cs**: Generic repository interface
  - **Repository.cs**: Generic base repository with ApplySort helper
  - **IUnitOfWork.cs**: Unit of Work interface
  - **UnitOfWork.cs**: Unit of Work implementation
  - **PagedResult.cs**: Pagination model with metadata
  - **QueryableExtensions.cs**: Extension methods for pagination
  - **SortDirections.cs**: Sort direction constants
  - **Data/Entities/**: Entity classes (ExampleRecord, ApplicationSetting)
  - **Data/Repositories/**: Entity-specific repository interfaces and implementations
  - **Data/SortColumns/**: Sort column constants per entity (using nameof() for refactor-safety)
- **Services/**: Application services
  - **IToastService.cs**: Toast service interface
  - **ToastService.cs**: Toast service implementation
- **Extensions/**: Extension methods
  - **TempDataExtensions.cs**: TempData extension methods for toast notifications
- **Views/**: Razor views organized by controller
  - **Views/Shared/**: Layout and shared partial views (_Layout.cshtml, _ToastContainer.cshtml, Error.cshtml)
  - **Views/Home/**: Home controller views (Index.cshtml, Privacy.cshtml)
  - **Views/Toast/**: Toast demo views (Index.cshtml, FormExample.cshtml)
  - **Views/ExampleRecord/**: Pagination demo views (Index.cshtml, AjaxExample.cshtml)
- **wwwroot/**: Static files
  - **wwwroot/js/toast.js**: Client-side toast notification system with JSDoc documentation
  - **wwwroot/css/**: Stylesheets
  - **wwwroot/lib/**: Third-party libraries (Bootstrap, jQuery)
- **appsettings.json**: Application configuration (logging levels, allowed hosts, connection strings)
- **Properties/launchSettings.json**: Development environment profiles
- **CLAUDE.md**: Project documentation and coding guidelines for AI assistants
- **Helpers/**: Helper classes and utilities
  - **Name.cs**: Type-safe controller name resolution for eliminating magic strings in routing

## Type-Safe Routing Pattern

The application uses a custom `Name<T>` helper class to eliminate magic strings when referencing controllers in Razor views. This provides compile-time safety and refactoring support for all routing operations.

### The Problem with Magic Strings

ASP.NET Core MVC's tag helpers and URL generation traditionally use string literals for controller and action names:

```cshtml
<!-- Traditional approach with magic strings -->
<a asp-controller="Home" asp-action="Index">Home</a>
@Url.Action("Index", "Home")
```

**Problems:**
- ❌ **No compile-time checking**: Typos and errors discovered at runtime
- ❌ **Refactoring breaks links**: Renaming a controller breaks all string references silently
- ❌ **No IntelliSense support**: Must remember exact controller/action names
- ❌ **Maintenance burden**: Finding all references to a controller requires text search

### The Solution: Name<T> Helper

The `Name<T>` helper class provides type-safe controller name resolution:

```csharp
// Helpers/Name.cs
public static class Name<T> where T : Controller
{
    public static string Value { get; }

    static Name()
    {
        var typeName = typeof(T).Name;
        Value = typeName.EndsWith("Controller", StringComparison.Ordinal)
            ? typeName[..^"Controller".Length]
            : typeName;
    }
}
```

**How it works:**
- Generic type parameter `T` constrained to `Controller` types
- Static constructor computes controller name once at initialization
- Automatically strips "Controller" suffix from type name
- Returns clean controller name (e.g., `HomeController` → `"Home"`)

### Usage Examples

#### Tag Helpers (asp-controller, asp-action)

```cshtml
<!-- Before: Magic strings -->
<a asp-controller="Toast" asp-action="Index">Toast Demo</a>

<!-- After: Type-safe -->
<a asp-controller="@Name<ToastController>.Value" asp-action="@nameof(ToastController.Index)">Toast Demo</a>
```

#### Url.Action() Helper

```cshtml
<!-- Before: Magic strings -->
@Url.Action("Index", "Home")

<!-- After: Type-safe -->
@Url.Action(nameof(HomeController.Index), Name<HomeController>.Value)
```

#### Forms

```cshtml
<!-- Before: Magic strings -->
<form method="post" asp-action="FormExample" asp-controller="Toast">

<!-- After: Type-safe -->
<form method="post" asp-action="@nameof(ToastController.FormExample)" asp-controller="@Name<ToastController>.Value">
```

#### JavaScript with Url.Action()

```javascript
// Before: Magic strings in JavaScript template
fetch('@Url.Action("ShowToast", "Toast")', {
    method: 'POST',
    // ...
});

// After: Type-safe
fetch('@Url.Action(nameof(ToastController.ShowToast), Name<ToastController>.Value)', {
    method: 'POST',
    // ...
});
```

#### With Route Values

```cshtml
<!-- Before: Magic strings -->
<a href="@Url.Action("Index", "ExampleRecord", new { page = 1, sortBy = "Name" })">Records</a>

<!-- After: Type-safe -->
<a href="@Url.Action(nameof(ExampleRecordController.Index), Name<ExampleRecordController>.Value, new { page = 1, sortBy = ExampleRecordSortColumns.Name })">Records</a>
```

### Configuration

The `Name<T>` helper is available in all views through `_ViewImports.cshtml`:

```cshtml
@using BlankBase.Helpers
@using BlankBase.Controllers
```

**Required namespaces:**
- `BlankBase.Helpers` - Provides access to `Name<T>` class
- `BlankBase.Controllers` - Provides access to controller types (HomeController, ToastController, etc.)

### Benefits

✅ **Compile-Time Safety**: Typos and invalid references caught at build time
✅ **Refactoring Support**: Renaming a controller or action updates all references automatically
✅ **IntelliSense Support**: Autocomplete for controller types and action method names
✅ **Find All References**: IDE can locate all usages of a controller or action
✅ **No Runtime Errors**: Invalid routes discovered during development, not production
✅ **Self-Documenting**: Code clearly shows which controllers and actions are being referenced
✅ **Zero Runtime Overhead**: Static initialization computes values once at startup

### Pattern Throughout Codebase

This pattern is used consistently throughout all Razor views:

- **_Layout.cshtml**: Navigation links (Home, Privacy)
- **Home/Index.cshtml**: Demo links (Toast, ExampleRecord)
- **Toast/Index.cshtml**: AJAX endpoints
- **Toast/FormExample.cshtml**: Form submissions
- **ExampleRecord/Index.cshtml**: Pagination and sorting links (11 instances)
- **ExampleRecord/AjaxExample.cshtml**: AJAX pagination endpoints

**28 total URL references** converted from magic strings to type-safe references.

### Comparison

| Aspect | Magic Strings | Name<T> Pattern |
|--------|--------------|-----------------|
| Compile-time checking | ❌ No | ✅ Yes |
| Refactoring safety | ❌ Breaks silently | ✅ Breaks build |
| IntelliSense support | ❌ No | ✅ Yes |
| Find references | ⚠️ Text search only | ✅ IDE "Find All References" |
| Verbosity | ✅ Short | ⚠️ Longer |
| Learning curve | ✅ Standard ASP.NET Core | ⚠️ Custom pattern |
| Runtime overhead | ✅ Minimal | ✅ Minimal (static init) |

### Best Practices

1. **Always use with nameof()**: Combine `Name<T>.Value` for controllers with `nameof()` for actions
   ```cshtml
   <a asp-controller="@Name<HomeController>.Value" asp-action="@nameof(HomeController.Index)">
   ```

2. **Combine with other constants**: Use with `ExampleRecordSortColumns` and other constant classes
   ```cshtml
   @Url.Action(nameof(ExampleRecordController.Index), Name<ExampleRecordController>.Value,
               new { sortBy = ExampleRecordSortColumns.Name })
   ```

3. **Use in JavaScript templates**: Works in `@section Scripts` blocks
   ```javascript
   const url = '@Url.Action(nameof(ToastController.ShowToast), Name<ToastController>.Value)';
   ```

4. **Import in _ViewImports.cshtml**: Ensure namespaces are available in all views
   ```cshtml
   @using BlankBase.Helpers
   @using BlankBase.Controllers
   ```

### Why This Pattern?

**Alternative approaches considered:**

1. **`nameof(HomeController)` with `.Replace("Controller", "")`**
   - Too verbose and awkward
   - Fragile (breaks if controller doesn't end with "Controller")

2. **Constants class with manual strings**
   - Requires manual maintenance
   - Not automatically synced with actual controllers
   - Still allows typos within constant definitions

3. **Named routes**
   - Still uses magic strings (route names)
   - Requires naming every single route
   - Doesn't solve the action name problem

4. **Custom tag helper with lambda expressions**
   - Significant implementation complexity
   - Requires custom syntax learning
   - Overkill for this use case

**The `Name<T>` pattern provides the best balance** of type safety, simplicity, and refactoring support with minimal code and no runtime overhead.

## Architecture Notes

### Middleware Pipeline (Program.cs:8-26)
The application configures middleware in this order:
1. Exception handler (production only) - redirects to /Home/Error
2. HSTS (production only)
3. HTTPS redirection
4. Routing
5. Authorization
6. Static assets
7. MVC controller routing with default pattern: `{controller=Home}/{action=Index}/{id?}`

### Default Routing
The application uses conventional routing with Home/Index as the default route. All controllers follow the MVC pattern and inherit from `Microsoft.AspNetCore.Mvc.Controller`.

## Solution Structure

The solution uses the newer `.slnx` format (Visual Studio 2022+) containing a single project: BlankBase/BlankBase.csproj.

## Toast Notification System

The application includes a production-ready Bootstrap toast notification system with comprehensive documentation, dependency injection, and multiple implementation patterns for displaying user feedback messages.

### Key Components

**Models (Models/Toasts/):**
- `ToastNotification.cs` - Model class representing a toast notification with properties: MessageText, MessageType (enum), Duration, AutoHide
- `ToastType.cs` - Enum defining toast types: Success, Warning, Error (provides type safety)
- `ToastDefaultOptions.cs` - Configuration class for default toast behavior (duration and auto-hide per type)

**Services:**
- `Services/IToastService.cs` - Service interface with comprehensive XML documentation
  - **TempData methods (for PRG pattern):**
    - `AddSuccess(string message, int? duration = null, bool? autoHide = null)` - Add success toast to TempData
    - `AddWarning(string message, int? duration = null, bool? autoHide = null)` - Add warning toast to TempData
    - `AddError(string message, int? duration = null, bool? autoHide = null)` - Add error toast to TempData
  - **JSON methods (for AJAX responses):**
    - `AddSuccessToJson(JsonNode json, string message, int? duration = null, bool? autoHide = null)` - Attach success toast to JSON response
    - `AddWarningToJson(JsonNode json, string message, int? duration = null, bool? autoHide = null)` - Attach warning toast to JSON response
    - `AddErrorToJson(JsonNode json, string message, int? duration = null, bool? autoHide = null)` - Attach error toast to JSON response
- `Services/ToastService.cs` - Implementation using dependency injection (IHttpContextAccessor, ITempDataDictionaryFactory)
  - Defines "toastMessages" property name once as a constant to prevent typos
  - JSON methods automatically create or append to toastMessages array in response

**Extensions:**
- `Extensions/TempDataExtensions.cs` - Low-level TempData extension methods
  - `AddToast(string message, ToastType type, int duration, bool autoHide)` - Queue a toast message
  - `GetToasts()` - Retrieve queued toast messages from TempData
  - `JsonOptions` (public) - Shared JsonSerializerOptions with JsonStringEnumConverter

**JavaScript:**
- `wwwroot/js/toast.js` - Client-side toast system with comprehensive JSDoc documentation
  - `Toast.Type` - Enum constants (SUCCESS, WARNING, ERROR)
  - `Toast.show(config)` - Display toast from config object (handles both PascalCase and camelCase)
  - `Toast.create(messageText, messageType, duration, autoHide)` - Convenience method for client-side toasts
  - `Toast.showMessages(response)` - Process server response with toastMessages array
  - Auto-initialization from `data-initial-toasts` attribute on page load
  - Uses timestamp + counter for unique IDs to handle multiple simultaneous toasts

**Views:**
- `Views/Shared/_ToastContainer.cshtml` - Toast container partial with auto-initialization support
- `Views/Toast/Index.cshtml` - Interactive demo with JavaScript and AJAX POST modes
- `Views/Toast/FormExample.cshtml` - Traditional form POST with PRG pattern demo
- `Views/Home/Index.cshtml` - Landing page with links to toast demos

**Controllers:**
- `Controllers/ToastController.cs` - Demonstration controller showing all three implementation patterns

### Three Implementation Patterns

#### 1. Client-Side JavaScript (Toast/Index - JavaScript Mode)
Trigger toasts entirely on the client side without server interaction.

```javascript
// Use Toast.create() for client-side toasts
Toast.create("Message text", Toast.Type.SUCCESS, 3000, true);

// Or use Toast.show() with config object
Toast.show({
    messageText: "Profile saved locally",
    messageType: Toast.Type.SUCCESS,
    duration: 3000,
    autoHide: true
});
```

**Use case:** Network errors, client-side validation, instant UI feedback

#### 2. AJAX POST with ToastService JSON Methods (Toast/Index - POST Mode)
Submit form data via AJAX, server uses IToastService to attach toasts to JSON response, then display toasts on client.

**Server-side (using ToastService JSON methods):**
```csharp
[HttpPost]
public IActionResult CreateUser([FromBody] UserRequest request)
{
    // Create your response data (can be any object)
    var result = new { id = 123, name = request.Name, email = request.Email };

    // Serialize to JSON
    var json = JsonSerializer.SerializeToNode(result);

    // Add toast notifications using IToastService
    // The "toastMessages" property name is defined once in ToastService - no typos possible!
    json = _toastService.AddSuccessToJson(json!, "User created successfully!");
    json = _toastService.AddSuccessToJson(json!, "Welcome email sent.");

    // Optionally add warnings or errors
    if (someCondition)
    {
        json = _toastService.AddWarningToJson(json!, "Please verify your email address.");
    }

    // Return JSON with both data and toastMessages array
    return Json(json, TempDataExtensions.JsonOptions);
}
// Result: { "id": 123, "name": "John", "email": "john@example.com", "toastMessages": [...] }
```

**For toast-only responses (no additional data):**
```csharp
[HttpPost]
public IActionResult ShowToast([FromBody] ToastRequest request)
{
    // Start with empty object
    var json = JsonSerializer.SerializeToNode(new { });

    // Add toast based on type
    json = _toastService.AddSuccessToJson(json!, request.MessageText, request.Duration, request.AutoHide);

    return Json(json, TempDataExtensions.JsonOptions);
}
// Result: { "toastMessages": [...] }
```

**Client-side:**
```javascript
fetch('/Toast/ShowToast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageText: "Hello", messageType: "success" })
})
.then(response => response.json())
.then(data => Toast.showMessages(data)) // Displays all toasts from response
.catch(error => {
    Toast.create('Server unavailable', Toast.Type.ERROR, 5000, false);
});
```

**Use case:** AJAX form submissions, API responses, server-side validation with client-side display, returning data + toast notifications

**Key benefits:**
- "toastMessages" property name defined **once** in ToastService constant - eliminates typo risk
- Works with **any** response object (user data, products, empty object, etc.)
- Automatically creates or appends to toastMessages array
- Type-safe with ToastNotification DTO
- Chainable method calls for multiple toasts

#### 3. Traditional Form POST with PRG Pattern (Toast/FormExample)
Submit form traditionally, use IToastService (dependency injection) to queue toasts, redirect, and display on page load.

```csharp
public class MyController : Controller
{
    private readonly IToastService _toastService;

    public MyController(IToastService toastService)
    {
        _toastService = toastService;
    }

    [HttpPost]
    public IActionResult FormExample(string name, int age)
    {
        // Add toasts using the service (uses defaults from ToastDefaultOptions)
        _toastService.AddSuccess($"Hello {name}! You are {age} years old.");
        _toastService.AddSuccess("Your form has been successfully submitted.");

        if (age < 18)
        {
            _toastService.AddWarning("Note: You are under 18 years old.", duration: 6000);
        }

        // Redirect - toasts will display on the next page load
        return RedirectToAction("FormExample");
    }
}
```

**Use case:** Traditional MVC form submissions, post-processing notifications, Post-Redirect-Get pattern

### Configuration (Program.cs)

The toast system is registered in `Program.cs` with configurable defaults:

```csharp
// Add HttpContextAccessor for ToastService
builder.Services.AddHttpContextAccessor();

// Register ToastService
builder.Services.AddScoped<IToastService, ToastService>();

// Configure toast default options
builder.Services.Configure<ToastDefaultOptions>(options =>
{
    options.SuccessDuration = 3000;
    options.WarningDuration = 5000;
    options.ErrorDuration = 4000;

    options.SuccessAutoHide = true;
    options.WarningAutoHide = true;
    options.ErrorAutoHide = false; // Errors require user acknowledgment
});
```

### Usage Examples

#### Recommended: Using IToastService (Dependency Injection)

```csharp
public class UserController : Controller
{
    private readonly IToastService _toastService;

    public UserController(IToastService toastService)
    {
        _toastService = toastService;
    }

    [HttpPost]
    public IActionResult Create(User user)
    {
        // Add single toast (uses defaults from ToastDefaultOptions)
        _toastService.AddSuccess("User created successfully!");

        // Add multiple toasts
        _toastService.AddSuccess("Welcome email sent.");
        _toastService.AddWarning("Remember to verify your email.");

        // Override defaults with custom duration and auto-hide
        _toastService.AddWarning("Important notice!", duration: 10000, autoHide: false);

        // Error toasts (default: no auto-hide)
        _toastService.AddError("Failed to send confirmation email.");

        return RedirectToAction("Index");
    }
}
```

#### Alternative: Using TempData Extensions Directly

```csharp
// If you need low-level control or can't use DI
TempData.AddToast("Operation successful!", ToastType.Success, 3000, true);
```

### Important Implementation Details

**JSON Serialization:**
- TempData stores toasts as a JSON-serialized list using a single key: "ToastNotifications"
- `TempDataExtensions.JsonOptions` provides shared JsonSerializerOptions with `JsonStringEnumConverter`
- **CRITICAL:** When returning JSON from controllers, always use `TempDataExtensions.JsonOptions` to ensure enums serialize as strings ("Success", "Warning", "Error") not integers (0, 1, 2)

**Controller JSON Response Pattern (Recommended):**
```csharp
using BlankBase.Extensions;
using BlankBase.Services;
using System.Text.Json;

[HttpPost]
public IActionResult MyAction()
{
    // Create response data
    var result = new { success = true, data = "some data" };

    // Serialize to JSON
    var json = JsonSerializer.SerializeToNode(result);

    // Add toasts using IToastService - "toastMessages" property defined once in service
    json = _toastService.AddSuccessToJson(json!, "Operation completed!");

    // IMPORTANT: Always use TempDataExtensions.JsonOptions to serialize enums as strings
    return Json(json, TempDataExtensions.JsonOptions);
}
```

**Benefits of this pattern:**
- "toastMessages" property name defined **once** in ToastService constant (eliminates typo risk)
- Works with any response object (anonymous, typed, empty)
- Type-safe with ToastNotification DTO and ToastType enum
- Automatically handles array creation and appending

**Auto-Initialization from TempData:**
- `_ToastContainer.cshtml` serializes TempData toasts into a `data-initial-toasts` attribute
- On page load, `toast.js` automatically reads this attribute and displays queued toasts
- Attribute is removed after consumption to prevent duplicate displays

**JavaScript API Design:**
- `Toast.show(config)` accepts both PascalCase (from C# JSON) and camelCase (from JavaScript)
- Property names from C# are PascalCase: MessageText, MessageType, Duration, AutoHide
- The JavaScript API handles both naming conventions transparently
- Toasts stack vertically in a container positioned at top-right of viewport

**Documentation:**
- All C# services and interfaces include comprehensive XML documentation for IntelliSense
- JavaScript code includes complete JSDoc comments with @param, @returns, and @example tags
- Use IntelliSense in your IDE to explore available options and see usage examples

### Toast Display Styling

- **Success**: Green background with checkmark icon (✓)
- **Warning**: Yellow background with warning icon (⚠)
- **Error**: Red background with X icon (✕)

All toasts include a close button and can be configured to auto-hide after a specified duration.

### Key Features Summary

✅ **Production-Ready**: Fully documented with JSDoc and XML comments
✅ **Dependency Injection**: Service-based architecture with IToastService
✅ **Configurable Defaults**: Per-type duration and auto-hide behavior via ToastDefaultOptions
✅ **Type Safety**: Enum-based toast types prevent typos and errors
✅ **Typo-Proof**: "toastMessages" property name defined once in ToastService constant
✅ **Dual Method Sets**: TempData methods for PRG pattern, JSON methods for AJAX responses
✅ **Multiple Patterns**: Supports client-side, AJAX, and traditional form POST scenarios
✅ **Flexible JSON Attachment**: Add toasts to any response object (user data, products, empty, etc.)
✅ **Clean API**: Simple, intuitive methods (AddSuccess, AddWarning, AddError)
✅ **No Code Duplication**: Centralized JavaScript in toast.js, reusable partial views
✅ **Automatic Display**: Auto-initialization from TempData on page load (PRG pattern)
✅ **Flexible**: Override defaults per-toast or use global configuration
✅ **IntelliSense Support**: Comprehensive documentation for excellent developer experience

## Repository Pattern with Pagination and Sorting

The application implements a production-ready Repository pattern with Unit of Work, featuring server-side pagination and sortable columns with compile-time safety. The system demonstrates both traditional server-side and modern AJAX pagination patterns.

### Key Components

**Data Layer (Data/):**
- `Data/Context.cs` - Entity Framework DbContext with DbSet properties
- `Data/IRepository.cs` - Generic repository interface defining CRUD operations
- `Data/Repository.cs` - Generic base repository implementation with ApplySort helper method
- `Data/IUnitOfWork.cs` - Unit of Work interface for transaction management
- `Data/UnitOfWork.cs` - Unit of Work implementation aggregating all repositories
- `Data/PagedResult.cs` - Model containing paginated data with metadata (PageNumber, PageSize, TotalCount, TotalPages, HasPreviousPage, HasNextPage)
- `Data/QueryableExtensions.cs` - Extension methods for pagination on IOrderedQueryable<T> (compile-time enforcement)
- `Data/SortDirections.cs` - Constants for sort direction values ("asc", "desc")
- `Data/SortColumns/` - Folder containing sort column constants per entity (using nameof() for refactor-safety)

**Entities (Data/Entities/):**
- `Data/Entities/ExampleRecord.cs` - Example entity demonstrating pagination and sorting
- Entity-specific classes with properties matching database schema

**Repositories (Data/Repositories/):**
- `Data/Repositories/IExampleRecordRepository.cs` - Interface extending IRepository with pagination method
- `Data/Repositories/ExampleRecordRepository.cs` - Implementation with sortable pagination using ApplySort helper
- Entity-specific repository interfaces and implementations

**Controllers:**
- `Controllers/ExampleRecordController.cs` - Demonstration controller with both traditional and AJAX pagination actions

**Views:**
- `Views/ExampleRecord/Index.cshtml` - Traditional server-side pagination with sortable headers
- `Views/ExampleRecord/AjaxExample.cshtml` - AJAX pagination with URL state management and sortable headers

### Architecture Overview

**Generic Repository Pattern:**
```csharp
// Base interface defines CRUD operations for any entity
public interface IRepository<TEntity> where TEntity : class, new()
{
    TEntity? Find(params object[] id);
    ValueTask<TEntity?> FindAsync(params object[] id);
    void Add(TEntity entity);
    ValueTask AddAsync(TEntity entity);
    void Remove(TEntity entity);
    void Update(TEntity entity);
    bool IsExistByID(params object[] id);
    Task<bool> IsExistByIDAsync(params object[] id);
    // ... additional CRUD methods
}

// Base repository implements common operations
public class Repository<TDbContext, TEntity> : IRepository<TEntity>
    where TDbContext : DbContext
    where TEntity : class, new()
{
    protected TDbContext _Context { get; private set; }

    // Helper method to reduce sorting code duplication
    protected IOrderedQueryable<TEntity> ApplySort<TKey>(
        IQueryable<TEntity> query,
        System.Linq.Expressions.Expression<Func<TEntity, TKey>> keySelector,
        string direction)
    {
        if (direction == SortDirections.Desc)
        {
            return query.OrderByDescending(keySelector);
        }
        else
        {
            return query.OrderBy(keySelector);
        }
    }
}
```

**Unit of Work Pattern:**
```csharp
// Aggregates repositories and manages transactions
public class UnitOfWork : IUnitOfWork, IDisposable
{
    private readonly Context _Context;
    public IExampleRecordRepository ExampleRecordRepository { init; get; }

    public UnitOfWork(Context context)
    {
        _Context = context;
        ExampleRecordRepository = new ExampleRecordRepository(context);
    }

    public int SaveChanges() => _Context.SaveChanges();
    public async Task<int> SaveChangesAsync() => await _Context.SaveChangesAsync();
}
```

**Dependency Injection (Program.cs):**
```csharp
// Register DbContext
builder.Services.AddDbContext<Context>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register UnitOfWork
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
```

### Pagination System

**PagedResult Model:**
```csharp
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
```

**Extension Method with Compile-Time Safety:**
```csharp
// Only works on IOrderedQueryable - ensures sorting happens before pagination
public static async Task<PagedResult<T>> GetPagedAsync<T>(
    this IOrderedQueryable<T> query,
    int pageNumber,
    int pageSize)
{
    var totalCount = await query.CountAsync();
    var items = await query
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return new PagedResult<T>
    {
        Items = items,
        PageNumber = pageNumber,
        PageSize = pageSize,
        TotalCount = totalCount
    };
}
```

### Sorting Implementation with Constants

**Eliminate Magic Strings using nameof():**
```csharp
// Data/SortColumns/ExampleRecordSortColumns.cs
public static class ExampleRecordSortColumns
{
    public const string ExampleRecordID = nameof(ExampleRecord.ExampleRecordID);
    public const string Name = nameof(ExampleRecord.Name);
    public const string Age = nameof(ExampleRecord.Age);
    public const string Birthdate = nameof(ExampleRecord.Birthdate);
    public const string IsActive = nameof(ExampleRecord.IsActive);
}

// Data/SortDirections.cs
public static class SortDirections
{
    public const string Asc = "asc";
    public const string Desc = "desc";
}
```

**Benefits:**
- **Refactor-Safe**: Renaming a property breaks the build → easy to fix
- **Compile-Time Checking**: Typos are caught immediately
- **IntelliSense Support**: Auto-completion for column names
- **Consistency**: Same constants used in repositories, controllers, and views

### Repository Implementation Example

**Interface:**
```csharp
public interface IExampleRecordRepository : IRepository<ExampleRecord>
{
    Task<PagedResult<ExampleRecord>> GetAllExampleRecordsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc);
}
```

**Implementation using ApplySort helper:**
```csharp
public class ExampleRecordRepository : Repository<Context, ExampleRecord>, IExampleRecordRepository
{
    public ExampleRecordRepository(Context context) : base(context) { }

    public async Task<PagedResult<ExampleRecord>> GetAllExampleRecordsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc)
    {
        var query = _Context.ExampleRecords.AsQueryable();

        // Apply sorting based on column (whitelist approach for security)
        var sortByLower = sortBy?.ToLower();
        var sortDirLower = sortDirection.ToLower();

        var orderedQuery = sortByLower switch
        {
            var col when col == ExampleRecordSortColumns.ExampleRecordID.ToLower() =>
                ApplySort(query, x => x.ExampleRecordID, sortDirLower),

            var col when col == ExampleRecordSortColumns.Name.ToLower() =>
                ApplySort(query, x => x.Name, sortDirLower),

            var col when col == ExampleRecordSortColumns.Age.ToLower() =>
                ApplySort(query, x => x.Age, sortDirLower),

            var col when col == ExampleRecordSortColumns.Birthdate.ToLower() =>
                ApplySort(query, x => x.Birthdate, sortDirLower),

            var col when col == ExampleRecordSortColumns.IsActive.ToLower() =>
                ApplySort(query, x => x.IsActive, sortDirLower),

            // Default: Sort by Name ascending
            _ => ApplySort(query, x => x.Name, SortDirections.Asc)
        };

        return await orderedQuery.GetPagedAsync(pageNumber, pageSize);
    }
}
```

**Security Notes:**
- **Whitelist Pattern**: Only explicitly defined columns can be sorted
- **No SQL Injection**: User input compared against constants, not used in queries
- **Default Fallback**: Invalid column names fall back to safe default sort

### Two Pagination Patterns

#### 1. Traditional Server-Side Pagination (ExampleRecord/Index)

**Controller Action:**
```csharp
public class ExampleRecordController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private const int DefaultPageSize = 10;

    public ExampleRecordController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IActionResult> Index(
        int page = 1,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc)
    {
        if (page < 1) page = 1;

        var pagedResult = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(page, DefaultPageSize, sortBy, sortDirection);

        ViewBag.SortBy = sortBy ?? ExampleRecordSortColumns.Name;
        ViewBag.SortDirection = sortDirection;

        return View(pagedResult);
    }
}
```

**View with Sortable Headers:**
```cshtml
@model BlankBase.Data.PagedResult<BlankBase.Data.Entities.ExampleRecord>

@functions {
    string GetSortUrl(string columnName, int? page = null)
    {
        var currentSortBy = ViewBag.SortBy as string ?? ExampleRecordSortColumns.Name;
        var currentSortDirection = ViewBag.SortDirection as string ?? SortDirections.Asc;

        // Toggle direction if clicking same column; otherwise start with asc
        var newDirection = columnName.Equals(currentSortBy, StringComparison.OrdinalIgnoreCase)
            ? (currentSortDirection == SortDirections.Asc ? SortDirections.Desc : SortDirections.Asc)
            : SortDirections.Asc;

        return Url.Action("Index", new { page = page ?? 1, sortBy = columnName, sortDirection = newDirection }) ?? "#";
    }

    string GetSortIndicator(string columnName)
    {
        var currentSortBy = ViewBag.SortBy as string ?? ExampleRecordSortColumns.Name;
        var currentSortDirection = ViewBag.SortDirection as string ?? SortDirections.Asc;

        if (!columnName.Equals(currentSortBy, StringComparison.OrdinalIgnoreCase))
            return "";

        return currentSortDirection == SortDirections.Asc ? " ▲" : " ▼";
    }
}

<th class="sortable" style="cursor: pointer;">
    <a href="@GetSortUrl(ExampleRecordSortColumns.Name)" class="text-decoration-none text-dark">
        <span class="sort-header">Name <span class="sort-indicator">@GetSortIndicator(ExampleRecordSortColumns.Name)</span></span>
    </a>
</th>
```

**Features:**
- Full page reload on navigation
- URL contains all state (page, sortBy, sortDirection)
- Bookmarkable and shareable links
- Works without JavaScript
- SEO-friendly

#### 2. AJAX Pagination with URL State Management (ExampleRecord/AjaxExample)

**Controller API Action:**
```csharp
[HttpGet]
public async Task<IActionResult> GetRecordsJson(
    int page = 1,
    int pageSize = 10,
    string? sortBy = null,
    string sortDirection = SortDirections.Asc)
{
    if (page < 1) page = 1;

    var pagedResult = await _unitOfWork.ExampleRecordRepository
        .GetAllExampleRecordsPagedAsync(page, pageSize, sortBy, sortDirection);

    return Json(new
    {
        items = pagedResult.Items,
        pagination = new
        {
            pageNumber = pagedResult.PageNumber,
            pageSize = pagedResult.PageSize,
            totalCount = pagedResult.TotalCount,
            totalPages = pagedResult.TotalPages,
            hasPreviousPage = pagedResult.HasPreviousPage,
            hasNextPage = pagedResult.HasNextPage
        }
    });
}
```

**View with JavaScript (URL State Management):**
```javascript
// Constants rendered from C# constants
const ASC = '@SortDirections.Asc';
const DESC = '@SortDirections.Desc';
const DEFAULT_SORT_BY = '@ExampleRecordSortColumns.Name';

// Current state
let currentPage = 1;
let currentSortBy = DEFAULT_SORT_BY;
let currentSortDirection = ASC;

// Read state from URL parameters (supports bookmarking and refresh)
function getStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
        page: parseInt(params.get('page')) || 1,
        sortBy: params.get('sortBy') || DEFAULT_SORT_BY,
        sortDirection: params.get('sortDirection') || ASC
    };
}

// Update URL without reloading page (History API)
function updateUrl(page, sortBy, sortDirection) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortDirection', sortDirection);
    window.history.pushState({ page, sortBy, sortDirection }, '', url);
}

// Load records from API
async function loadRecords(page, sortBy = null, sortDirection = null) {
    if (sortBy !== null) currentSortBy = sortBy;
    if (sortDirection !== null) currentSortDirection = sortDirection;

    const response = await fetch(`@Url.Action("GetRecordsJson")?page=${page}&pageSize=10&sortBy=${currentSortBy}&sortDirection=${currentSortDirection}`);
    const data = await response.json();

    currentPage = data.pagination.pageNumber;
    updateUrl(currentPage, currentSortBy, currentSortDirection); // Makes it bookmarkable

    renderTable(data.items);
    renderPagination(data.pagination);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const state = event.state || getStateFromUrl();
    loadRecords(state.page, state.sortBy, state.sortDirection);
});

// Initialize from URL on page load
document.addEventListener('DOMContentLoaded', () => {
    const initialState = getStateFromUrl();
    loadRecords(initialState.page, initialState.sortBy, initialState.sortDirection);
});
```

**Features:**
- No page reload on navigation
- URL contains all state (supports bookmarking, refresh, back/forward buttons)
- Dynamic data loading with Fetch API
- Smooth user experience
- Shareable links with preserved state

### Creating New Repositories with Pagination and Sorting

**Step 1: Create Entity**
```csharp
// Data/Entities/Product.cs
public class Product
{
    public int ProductID { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime CreatedDate { get; set; }
}
```

**Step 2: Create Sort Columns Constants**
```csharp
// Data/SortColumns/ProductSortColumns.cs
public static class ProductSortColumns
{
    public const string ProductID = nameof(Product.ProductID);
    public const string Name = nameof(Product.Name);
    public const string Price = nameof(Product.Price);
    public const string CreatedDate = nameof(Product.CreatedDate);
}
```

**Step 3: Create Repository Interface**
```csharp
// Data/Repositories/IProductRepository.cs
public interface IProductRepository : IRepository<Product>
{
    Task<PagedResult<Product>> GetAllProductsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc);
}
```

**Step 4: Implement Repository using ApplySort helper**
```csharp
// Data/Repositories/ProductRepository.cs
public class ProductRepository : Repository<Context, Product>, IProductRepository
{
    public ProductRepository(Context context) : base(context) { }

    public async Task<PagedResult<Product>> GetAllProductsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc)
    {
        var query = _Context.Products.AsQueryable();
        var sortByLower = sortBy?.ToLower();
        var sortDirLower = sortDirection.ToLower();

        var orderedQuery = sortByLower switch
        {
            var col when col == ProductSortColumns.ProductID.ToLower() =>
                ApplySort(query, x => x.ProductID, sortDirLower),

            var col when col == ProductSortColumns.Name.ToLower() =>
                ApplySort(query, x => x.Name, sortDirLower),

            var col when col == ProductSortColumns.Price.ToLower() =>
                ApplySort(query, x => x.Price, sortDirLower),

            var col when col == ProductSortColumns.CreatedDate.ToLower() =>
                ApplySort(query, x => x.CreatedDate, sortDirLower),

            _ => ApplySort(query, x => x.Name, SortDirections.Asc) // Default sort
        };

        return await orderedQuery.GetPagedAsync(pageNumber, pageSize);
    }
}
```

**Step 5: Add to Context and UnitOfWork**
```csharp
// Data/Context.cs
public class Context : DbContext
{
    public DbSet<Product> Products { get; set; }
}

// Data/IUnitOfWork.cs
public interface IUnitOfWork : IDisposable
{
    IProductRepository ProductRepository { init; get; }
}

// Data/UnitOfWork.cs
public class UnitOfWork : IUnitOfWork, IDisposable
{
    public IProductRepository ProductRepository { init; get; }

    public UnitOfWork(Context context)
    {
        ProductRepository = new ProductRepository(context);
    }
}
```

**Step 6: Create Controller**
```csharp
public class ProductController : Controller
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IActionResult> Index(int page = 1, string? sortBy = null, string sortDirection = SortDirections.Asc)
    {
        var pagedResult = await _unitOfWork.ProductRepository
            .GetAllProductsPagedAsync(page, 10, sortBy, sortDirection);

        ViewBag.SortBy = sortBy ?? ProductSortColumns.Name;
        ViewBag.SortDirection = sortDirection;

        return View(pagedResult);
    }
}
```

### Key Features Summary

✅ **Repository Pattern**: Generic base repository with entity-specific implementations
✅ **Unit of Work**: Transaction management and repository aggregation
✅ **Pagination**: Server-side pagination with PagedResult model and metadata
✅ **Compile-Time Safety**: IOrderedQueryable extension enforces sorting before pagination
✅ **Refactor-Safe Sorting**: Constants use nameof() expressions for property names
✅ **ApplySort Helper**: Reduces code duplication across repository implementations
✅ **SQL Injection Prevention**: Whitelist pattern with switch statement for column names
✅ **Two-State Sort Toggle**: Clicking same column toggles between ascending/descending
✅ **URL State Management**: AJAX pagination supports bookmarking, refresh, and browser navigation
✅ **Dual Pagination Patterns**: Traditional (full reload) and AJAX (dynamic loading) examples
✅ **Dependency Injection**: Interface-based abstraction for testability and flexibility
✅ **IntelliSense Support**: Constants provide auto-completion for column names and sort directions