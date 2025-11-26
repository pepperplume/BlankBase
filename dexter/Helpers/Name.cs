using Microsoft.AspNetCore.Mvc;

namespace BlankBase.Helpers;

/// <summary>
/// Provides type-safe controller name resolution for use in Razor views.
/// Eliminates magic strings when using asp-controller tag helpers or Url.Action().
/// </summary>
/// <typeparam name="T">The controller type (must inherit from Controller)</typeparam>
/// <example>
/// In a Razor view:
/// <code>
/// @* Instead of magic strings: *@
/// &lt;a asp-controller="Toast" asp-action="Index"&gt;Link&lt;/a&gt;
///
/// @* Use type-safe references: *@
/// &lt;a asp-controller="@Name&lt;ToastController&gt;.Value" asp-action="@nameof(ToastController.Index)"&gt;Link&lt;/a&gt;
///
/// @* With Url.Action(): *@
/// @Url.Action(nameof(HomeController.Index), Name&lt;HomeController&gt;.Value)
/// </code>
/// </example>
public static class Name<T> where T : Controller
{
    /// <summary>
    /// Gets the controller name with the "Controller" suffix removed.
    /// This value is computed once at static initialization for performance.
    /// </summary>
    /// <example>
    /// Name&lt;ToastController&gt;.Value returns "Toast"
    /// Name&lt;HomeController&gt;.Value returns "Home"
    /// Name&lt;ExampleRecordController&gt;.Value returns "ExampleRecord"
    /// </example>
    public static string Value { get; }

    static Name()
    {
        var typeName = typeof(T).Name;

        // Remove "Controller" suffix if present
        Value = typeName.EndsWith("Controller", StringComparison.Ordinal)
            ? typeName[..^"Controller".Length]
            : typeName;
    }
}
