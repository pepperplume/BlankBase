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
- **Models/**: Data models, view models, toast models, PaginationServerSideViewModel
- **Data/**: Repository pattern with EF Core
  - Context, IRepository, Repository (with ApplySort helper)
  - IUnitOfWork, UnitOfWork
  - PagedResult, QueryableExtensions
  - Entities/, Repositories/, SortColumns/ (nameof() constants)
- **Services/**: IToastService, ToastService
- **Extensions/**: TempDataExtensions (toast helpers)
- **Helpers/**: Name.cs (type-safe controller routing), PartialViews.cs (type-safe partial view references)
- **Views/**: Razor views by controller + Shared/ (_PaginationServerSide.cshtml, _ToastContainer.cshtml)
- **wwwroot/js/**: JavaScript utility classes
  - toast.js (Toast class - notification system)
  - dom.js (Dom class - DOM manipulation utilities)
  - pagination.js (AjaxPagination class - AJAX pagination with sorting)
  - template-renderer.js (TemplateRenderer class - HTML template population)
- **wwwroot/**: Static files (css/, lib/)

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

## Type-Safe Partial View References

Uses `PartialViews` static class to eliminate magic strings when referencing partial views. See `Helpers/PartialViews.cs`.

**Usage:**
```cshtml
<!-- Instead of magic strings: -->
@await Html.PartialAsync("_PaginationServerSide", model)

<!-- Use type-safe constants: -->
@await Html.PartialAsync(PartialViews.PaginationServerSide, model)
```

**Available Constants:**
- `PartialViews.PaginationServerSide` - _PaginationServerSide.cshtml
- `PartialViews.ToastContainer` - _ToastContainer.cshtml
- `PartialViews.ValidationScripts` - _ValidationScriptsPartial.cshtml

**Convention:**
1. **Creating new partial** → Immediately add constant to `PartialViews.cs`
2. **Renaming partial** → Update constant value in `PartialViews.cs` (find-all-references shows usages)
3. **Deleting partial** → Remove constant (compiler shows what breaks)

**Benefits:**
- Single source of truth (change string in ONE place)
- IntelliSense support
- Find-all-references works
- Refactoring support
- Consistent with `SortColumns` pattern

**Configuration:** Available via `_ViewImports.cshtml` imports (`BlankBase.Helpers`).

## Reusable Pagination Component

**PaginationServerSideViewModel** - Reusable view model for traditional server-side pagination.

**Usage in Views:**
```cshtml
@await Html.PartialAsync(PartialViews.PaginationServerSide, PaginationServerSideViewModel.FromPagedResult(
    Model.PagedResult,
    Model.SortBy,
    Model.SortDirection,
    Name<YourController>.Value,
    nameof(YourController.YourAction)
))
```

**Features:**
- Renders pagination info ("Showing X to Y of Z records")
- Renders pagination controls (Previous/Next, page numbers with ellipsis)
- Maintains sort state across page navigation
- Fully reusable across any controller/action with server-side pagination

**Components:**
- **Model**: `Models/PaginationServerSideViewModel.cs` (FromPagedResult factory method)
- **View**: `Views/Shared/_PaginationServerSide.cshtml`
- **Example**: `ExampleRecord/Index.cshtml:77`

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
- **JavaScript**: wwwroot/js/toast.js (Toast class with `#` private members)
- **Views**: _ToastContainer.cshtml (auto-initialization from TempData)

**Demo Controllers/Views:** ToastController, Toast/Index, Toast/FormExample

**Note:** See "JavaScript Utility Classes" section for detailed Toast class documentation.

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
- Uses AjaxPagination class for pagination controls
- Uses TemplateRenderer class for table rendering
- Uses Dom class for show/hide state management

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

## JavaScript Utility Classes

Modern JavaScript utilities using ES2022+ class patterns with true privacy (`#` private fields). All utilities follow consistent patterns: static methods for singleton-like behavior, clear descriptive names (no cryptic `$()`), and Bootstrap integration where possible.

### Design Principles

- **Class-based with static methods** - Matches C# static utility class pattern
- **True privacy with `#`** - Private fields/methods use `#` prefix (enforced by language, not convention)
- **No `_` convention** - Modern JS uses `#` for actual privacy, not underscore naming
- **Bootstrap integration** - Leverage existing Bootstrap classes (`d-none`, `fade`, etc.)
- **Accessibility built-in** - `aria-hidden` attributes automatically managed
- **Consistent naming** - `Toast`, `Dom`, `TemplateRenderer`, `AjaxPagination` (not `*Utils`)

### Toast Class

Refactored from object literal to class with `#` private members. Handles Bootstrap toast notifications with three integration patterns.

**File:** `wwwroot/js/toast.js`

**Usage:**
```javascript
// Client-side toast
Toast.create("Operation successful", Toast.Type.SUCCESS, 3000, true);

// Server response with toastMessages array
fetch(url, {...}).then(r => r.json()).then(data => Toast.showMessages(data));
```

**Public API:**
- `Toast.Type` - Frozen enum (SUCCESS, WARNING, ERROR)
- `Toast.show(config)` - Display toast from config object (PascalCase and camelCase support)
- `Toast.create(messageText, messageType, duration, autoHide)` - Convenience method
- `Toast.showMessages(response)` - Process server response with toastMessages array

**Private members:**
- `#CONTAINER_ID` - Toast container element ID
- `#idCounter` - Counter for unique toast IDs
- `#CONFIG` - Toast type configuration (bg classes, icons, titles)
- `#createElement(id, message, type)` - Build toast DOM element

**Key features:**
- Handles both PascalCase (C# JSON) and camelCase (JavaScript)
- Auto-initialization from TempData via `data-initial-toasts` attribute
- Automatic cleanup after toast hidden
- Bootstrap toast component integration

### Dom Utility Class

DOM manipulation utilities for element visibility, transitions, and class management. Leverages Bootstrap's `d-none` class and includes accessibility support.

**File:** `wwwroot/js/dom.js`

**Usage:**
```javascript
// Query elements
const element = Dom.get('#myElement');
const items = Dom.getAll('.item');

// Show/hide
Dom.show('#content');
Dom.hide('#loading');
Dom.toggle('#menu');

// Conditional (React-style)
Dom.showIf('#error', hasError);
Dom.hideIf('#content', isLoading);

// Transitions
Dom.fadeOut('#loading', 300, () => {
    Dom.fadeIn('#content', 300);
});

// Class utilities
Dom.addClass('#element', 'active');
Dom.removeClass('#element', 'disabled');
Dom.toggleClass('#menu', 'open');
```

**Query methods:**
- `Dom.get(selector)` - Get single element (optimized for ID selectors)
- `Dom.getAll(selector)` - Get all matching elements as Array (not NodeList)

**Show/Hide (Bootstrap-powered):**
- `Dom.show(selector)` - Remove `d-none`, set `aria-hidden="false"`
- `Dom.hide(selector)` - Add `d-none`, set `aria-hidden="true"`
- `Dom.toggle(selector)` - Toggle `d-none` class

**Conditional visibility:**
- `Dom.showIf(selector, condition)` - Show if true, hide if false
- `Dom.hideIf(selector, condition)` - Hide if true, show if false

**Multiple elements:**
- `Dom.showAll(selector)` - Show all matching elements
- `Dom.hideAll(selector)` - Hide all matching elements

**CSS transitions:**
- `Dom.fadeIn(selector, duration)` - Fade in with CSS transition
- `Dom.fadeOut(selector, duration, callback)` - Fade out with callback

**Class utilities:**
- `Dom.addClass(selector, className)` - Add class to element
- `Dom.removeClass(selector, className)` - Remove class from element
- `Dom.toggleClass(selector, className)` - Toggle class on element

**Utility methods:**
- `Dom.isVisible(selector)` - Check if element is visible

**Key features:**
- Bootstrap `d-none` class instead of inline styles
- Accessibility via `aria-hidden` attributes
- ID selector optimization (fast path for `#elementId`)
- Accepts selector string or Element object
- CSS transition support for animations

### AjaxPagination Class

Reusable AJAX pagination controls with URL state management and optional column sorting. Handles pagination rendering, URL synchronization, and browser navigation.

**File:** `wwwroot/js/pagination.js`

**Usage:**
```javascript
const pagination = new AjaxPagination({
    controlsContainer: 'paginationControls',
    infoContainer: 'paginationInfo',
    pageInfoContainer: 'pageInfo',
    onPageChange: (page, sortBy, sortDir) => loadRecords(page, sortBy, sortDir),
    urlParams: { page: 'page', sortBy: 'sortBy', sortDirection: 'sortDirection' },
    defaults: { page: 1, sortBy: 'Name', sortDirection: 'asc' },
    sorting: {
        enabled: true,
        headerSelector: '.sortable',
        columnAttribute: 'data-column',
        sortConstants: { asc: ASC, desc: DESC },
        indicators: { asc: ' ▲', desc: ' ▼', none: '' }
    }
});

// After fetching data from API:
pagination.render(data.pagination, currentSortBy, currentSortDirection);
```

**Constructor options:**
- `controlsContainer` - ID of element for pagination buttons
- `infoContainer` - ID of element for "Showing X to Y of Z" text
- `pageInfoContainer` - ID of element for "Page X of Y" text
- `onPageChange` - Callback when page changes: `(page, sortBy, sortDirection) => {}`
- `urlParams` - URL parameter names (customizable)
- `defaults` - Default values for page, sortBy, sortDirection
- `sorting` - Optional sorting configuration

**Public methods:**
- `render(pagination, sortBy, sortDirection)` - Render pagination controls and update URL
- `getStateFromUrl()` - Read state from URL query parameters
- `updateUrl(page, sortBy, sortDirection)` - Update URL without page reload
- `getCurrentPage()` - Get current page number
- `getCurrentSort()` - Get current sort state
- `handleColumnClick(columnName)` - Handle column header click (if sorting enabled)
- `updateSortIndicators()` - Update sort indicators in headers (if sorting enabled)

**Sorting configuration:**
- `enabled` - Enable/disable sorting (default: false)
- `headerSelector` - CSS selector for sortable headers (default: `.sortable`)
- `columnAttribute` - Data attribute for column name (default: `data-column`)
- `sortConstants` - ASC/DESC values (for C# constant integration)
- `indicators` - Sort indicator symbols (default: ▲/▼)

**Key features:**
- URL state management via History API (bookmarkable URLs)
- Browser back/forward button support (popstate events)
- Bootstrap pagination classes
- Integrated sorting with visual indicators
- Auto-attaches click handlers to sortable headers
- Configurable URL parameters and defaults

**Example:** See `ExampleRecord/AjaxExample.cshtml` for complete implementation

### TemplateRenderer Class

Generic utility for populating HTML `<template>` elements with data using data attributes. Enables defining table structure in Razor/HTML instead of JavaScript.

**File:** `wwwroot/js/template-renderer.js`

**Usage:**
```cshtml
<!-- Define structure in HTML template -->
<template id="recordRowTemplate">
    <tr>
        <td data-field="ExampleRecordID"></td>
        <td data-field="Name"></td>
        <td data-field="Age"></td>
        <td data-field="Birthdate" data-format="date"></td>
        <td>
            <span data-field="IsActive"
                  data-true-class="badge bg-success"
                  data-false-class="badge bg-secondary"
                  data-true-text="Active"
                  data-false-text="Inactive"></span>
        </td>
    </tr>
</template>

<script>
// JavaScript just populates from data
TemplateRenderer.render('recordRowTemplate', 'recordsTableBody', items);
</script>
```

**Public methods:**
- `TemplateRenderer.populate(templateNode, data)` - Populate cloned template with data
- `TemplateRenderer.render(templateId, containerId, items, beforeAppend)` - Render list of items

**Data attribute conventions:**
- `data-field="PropertyName"` - Populate from `data.PropertyName`
- `data-format="date"` - Format as localized date
- `data-format="datetime"` - Format as localized datetime
- `data-format="html"` - Insert as raw HTML (use with caution!)
- Boolean mapping:
  - `data-true-class` / `data-false-class` - Apply class based on boolean
  - `data-true-text` / `data-false-text` - Set text based on boolean

**Private methods:**
- `#handleBooleanField(element, value)` - Handle boolean to badge/class mapping
- `#formatDate(value)` - Format dates
- `#formatDateTime(value)` - Format datetimes

**Key features:**
- HTML structure lives in Razor (edit styling without touching JS)
- Automatic HTML escaping by default (security)
- Boolean to badge/class mapping (Bootstrap badges)
- Supports multiple space-separated classes
- Reusable across any template + data combination

**Benefits:**
- ✅ Change table styling in HTML/CSS (no JavaScript edits)
- ✅ Reorder columns in Razor (structure where it belongs)
- ✅ Add/remove fields easily (just update template)
- ⚠️ Only touch JavaScript when structure fundamentally changes

**Example:** See `ExampleRecord/AjaxExample.cshtml` for complete implementation

### JavaScript Class Pattern Notes

**Why classes over object literals?**
- True privacy with `#` (vs fake privacy with `_`)
- Modern JavaScript standard (ES2022+)
- Consistent with C# static utility classes
- Can add instance methods later if needed

**`#` vs `_` for privacy:**
- `_underscore` - Convention only (not enforced, old pattern)
- `#hash` - Language-enforced privacy (modern, recommended)
- Object literals can't use `#` (class-only feature)

**Browser support for `#` private fields:**
- Chrome 74+ (2019), Firefox 90+ (2021), Safari 14.1+ (2021), Edge 79+ (2020)
- Not supported in IE11 (but project targets modern browsers)

**Naming convention:**
- Use clear names: `Toast`, `Dom`, `TemplateRenderer` (not `ToastUtils`)
- Match C# naming: `StringHelper`, `MathUtils` pattern
- Avoid cryptic symbols: No `$()` (confusing for beginners)
