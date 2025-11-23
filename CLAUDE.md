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

- **Program.cs**: Application entry point and middleware configuration. Uses minimal hosting model with builder pattern. Includes toast service registration and configuration.
- **Controllers/**: MVC controllers
  - **HomeController.cs**: Default controller with Index, Privacy, and Error actions
  - **ToastController.cs**: Toast notification demo controller
- **Models/**: Data models and view models
  - **ErrorViewModel.cs**: Error page view model
  - **Toasts/**: Toast notification models (ToastNotification, ToastType, ToastDefaultOptions)
- **Services/**: Application services
  - **IToastService.cs**: Toast service interface
  - **ToastService.cs**: Toast service implementation
- **Extensions/**: Extension methods
  - **TempDataExtensions.cs**: TempData extension methods for toast notifications
- **Views/**: Razor views organized by controller
  - **Views/Shared/**: Layout and shared partial views (_Layout.cshtml, _ToastContainer.cshtml, Error.cshtml)
  - **Views/Home/**: Home controller views (Index.cshtml, Privacy.cshtml)
  - **Views/Toast/**: Toast demo views (Index.cshtml, FormExample.cshtml)
- **wwwroot/**: Static files
  - **wwwroot/js/toast.js**: Client-side toast notification system with JSDoc documentation
  - **wwwroot/css/**: Stylesheets
  - **wwwroot/lib/**: Third-party libraries (Bootstrap, jQuery)
- **appsettings.json**: Application configuration (logging levels, allowed hosts)
- **Properties/launchSettings.json**: Development environment profiles
- **CLAUDE.md**: Project documentation and coding guidelines for AI assistants

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
