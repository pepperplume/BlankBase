namespace BlankBase.Helpers;

/// <summary>
/// Central registry of all partial view names.
/// Eliminates magic strings and provides IntelliSense for partial view references.
/// </summary>
/// <remarks>
/// IMPORTANT CONVENTION: When renaming a partial view file, update the corresponding constant here.
/// This ensures all usages are updated through IntelliSense and find-all-references.
/// When creating a new partial view, immediately add a constant for it here.
/// When deleting a partial view, remove its constant (compiler will show what breaks).
/// </remarks>
public static class PartialViews
{
    /// <summary>
    /// _PaginationServerSide.cshtml - Server-side pagination controls with info and navigation.
    /// Used for traditional full-page-reload pagination with sortable columns.
    /// </summary>
    public const string PaginationServerSide = "_PaginationServerSide";

    /// <summary>
    /// _ToastContainer.cshtml - Toast notification container.
    /// Renders toast notifications from TempData and provides JavaScript initialization.
    /// </summary>
    public const string ToastContainer = "_ToastContainer";

    /// <summary>
    /// _ValidationScriptsPartial.cshtml - Client-side validation scripts.
    /// jQuery validation and unobtrusive validation libraries.
    /// </summary>
    public const string ValidationScripts = "_ValidationScriptsPartial";
}
