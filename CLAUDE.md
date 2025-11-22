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

- **Program.cs**: Application entry point and middleware configuration. Uses minimal hosting model with builder pattern.
- **Controllers/**: MVC controllers (currently only HomeController with Index, Privacy, and Error actions)
- **Models/**: Data models and view models (currently only ErrorViewModel)
- **Views/**: Razor views organized by controller
  - **Views/Shared/**: Layout and shared partial views (_Layout.cshtml, Error.cshtml)
  - **Views/Home/**: Home controller views (Index.cshtml, Privacy.cshtml)
- **wwwroot/**: Static files (CSS, JavaScript, images, libraries)
- **appsettings.json**: Application configuration (logging levels, allowed hosts)
- **Properties/launchSettings.json**: Development environment profiles

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

The application includes a comprehensive Bootstrap toast notification system with three different implementation patterns for displaying user feedback messages.

### Key Components

**Models:**
- `Models/ToastNotification.cs` - Model class representing a toast notification with properties: MessageText, MessageType (enum), Duration, AutoHide
- `Models/ToastType.cs` - Enum defining toast types: Success, Warning, Error (provides type safety)

**Extensions:**
- `Extensions/TempDataExtensions.cs` - Extension methods for TempData to add/retrieve toast notifications
  - `AddToast(string message, ToastType type, int duration, bool autoHide)` - Queue a toast message
  - `GetToasts()` - Retrieve queued toast messages from TempData
  - Uses `JsonStringEnumConverter` to serialize enums as strings for JavaScript compatibility

**Controllers:**
- `Controllers/ToastController.cs` - Demonstration controller with three toast implementation examples

**Views:**
- `Views/Toast/Index.cshtml` - Interactive demo with JavaScript and AJAX POST modes
- `Views/Toast/FormExample.cshtml` - Traditional form POST with PRG pattern demo
- `Views/Home/Index.cshtml` - Landing page with links to toast demos

### Three Implementation Patterns

#### 1. Client-Side JavaScript (Toast/Index - JavaScript Mode)
Trigger toasts entirely on the client side without server interaction.

```javascript
showToast("Message text", "Success", 3000, true);
```

**Use case:** Instant client-side validation feedback, UI state changes

#### 2. AJAX POST (Toast/Index - POST Mode)
Submit form data via AJAX, server returns JSON, then display toast.

```csharp
[HttpPost]
public IActionResult ShowToast([FromBody] ToastRequest request)
{
    return Json(new { messageText, messageType, duration, autoHide });
}
```

**Use case:** Server-side validation with client-side toast display

#### 3. Traditional Form POST with PRG Pattern (Toast/FormExample)
Submit form traditionally, use TempData to queue toasts, redirect, and display on page load.

```csharp
[HttpPost]
public IActionResult FormExample(string name, int age)
{
    TempData.AddToast($"Hello {name}!", ToastType.Success, 5000);
    TempData.AddToast("Form submitted successfully.", ToastType.Success);

    if (age < 18)
    {
        TempData.AddToast("You are under 18.", ToastType.Warning, 6000);
    }

    return RedirectToAction("FormExample");
}
```

**Use case:** Traditional MVC form submissions, post-processing notifications

### Usage Examples

#### Adding a Single Toast
```csharp
TempData.AddToast("Operation successful!", ToastType.Success);
```

#### Adding Multiple Toasts
```csharp
TempData.AddToast("User created successfully.", ToastType.Success, 5000);
TempData.AddToast("Welcome email sent.", ToastType.Success, 4000);
TempData.AddToast("Remember to verify your email.", ToastType.Warning, 6000);
```

#### Custom Duration and Auto-Hide
```csharp
TempData.AddToast("Important message!", ToastType.Warning, 10000, autoHide: false);
```

### Important Implementation Details

**JSON Serialization:**
- TempData stores toasts as a JSON-serialized list using a single key: "ToastNotifications"
- `JsonStringEnumConverter` ensures `ToastType` enums serialize as strings ("Success", "Warning", "Error") not integers (0, 1, 2)
- When serializing in views, always use `JsonSerializerOptions` with `JsonStringEnumConverter` to maintain enum string values

**View Serialization Pattern:**
```csharp
@using System.Text.Json
@using System.Text.Json.Serialization
@{
    var toasts = TempData.GetToasts();
    var jsonOptions = new JsonSerializerOptions
    {
        Converters = { new JsonStringEnumConverter() }
    };
}

<script>
    const toasts = @Html.Raw(JsonSerializer.Serialize(toasts, jsonOptions));
    toasts.forEach((toast) => {
        showToast(toast.MessageText, toast.MessageType, toast.Duration, toast.AutoHide);
    });
</script>
```

**JavaScript Type Handling:**
- Property names are PascalCase from C# serialization (MessageText, MessageType, Duration, AutoHide)
- The `createToastElement()` function handles both PascalCase ("Success") and lowercase ("success") for compatibility
- Toasts stack vertically in a container positioned at top-right of viewport

### Toast Display Styling

- **Success**: Green background with checkmark icon (✓)
- **Warning**: Yellow background with warning icon (⚠)
- **Error**: Red background with X icon (✕)

All toasts include a close button and can be configured to auto-hide after a specified duration.
