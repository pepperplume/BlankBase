namespace BlankBase.Data;

/// <summary>
/// Constants for sort direction values.
/// Provides a single source of truth for ascending and descending sort directions.
/// </summary>
/// <example>
/// Usage in controller:
/// <code>
/// public async Task&lt;IActionResult&gt; Index(string sortDirection = SortDirections.Asc)
/// </code>
///
/// Usage in repository:
/// <code>
/// var orderedQuery = sortDirection == SortDirections.Desc
///     ? query.OrderByDescending(x => x.Name)
///     : query.OrderBy(x => x.Name);
/// </code>
///
/// Usage in views:
/// <code>
/// @if (currentSortDirection == SortDirections.Asc)
/// </code>
/// </example>
public static class SortDirections
{
    /// <summary>
    /// Ascending sort direction
    /// </summary>
    public const string Asc = "asc";

    /// <summary>
    /// Descending sort direction
    /// </summary>
    public const string Desc = "desc";
}
