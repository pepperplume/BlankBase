using BlankBase.Data;
using BlankBase.Data.Entities;
using BlankBase.Data.SortColumns;

namespace BlankBase.Models;

/// <summary>
/// Strongly-typed view model for the ExampleRecord Index page.
/// Wraps pagination data along with sorting state to avoid ViewBag usage.
/// </summary>
public class ExampleRecordIndexViewModel
{
    /// <summary>
    /// Paginated result containing the example records and pagination metadata.
    /// </summary>
    public PagedResult<ExampleRecord> PagedResult { get; set; } = new();

    /// <summary>
    /// Current sort column name (e.g., "Name", "Age", "Birthdate").
    /// </summary>
    public string SortBy { get; set; } = ExampleRecordSortColumns.Name;

    /// <summary>
    /// Current sort direction ("asc" or "desc").
    /// </summary>
    public string SortDirection { get; set; } = SortDirections.Asc;

    /// <summary>
    /// Gets the route values for sorting by a specific column.
    /// Handles toggle logic: if clicking the same column, toggles direction; otherwise starts with ascending.
    /// </summary>
    /// <param name="columnName">The column name to sort by</param>
    /// <param name="page">Optional page number (defaults to 1)</param>
    /// <returns>Anonymous object containing route values for URL generation</returns>
    public object GetSortRouteValues(string columnName, int? page = null)
    {
        var newDirection = GetNewSortDirection(columnName);
        return new { page = page ?? 1, sortBy = columnName, sortDirection = newDirection };
    }

    /// <summary>
    /// Gets the sort indicator (▲ or ▼) for a column header.
    /// Returns empty string if the column is not currently being sorted.
    /// </summary>
    /// <param name="columnName">The column name to check</param>
    /// <returns>Sort indicator string: " ▲" for ascending, " ▼" for descending, or empty string</returns>
    public string GetSortIndicator(string columnName)
    {
        if (!columnName.Equals(SortBy, StringComparison.OrdinalIgnoreCase))
            return "";

        return SortDirection == SortDirections.Asc ? " ▲" : " ▼";
    }

    /// <summary>
    /// Calculates the new sort direction when clicking a column header.
    /// If clicking the same column, toggles between asc/desc; otherwise starts with asc.
    /// </summary>
    /// <param name="columnName">The column being clicked</param>
    /// <returns>The new sort direction ("asc" or "desc")</returns>
    private string GetNewSortDirection(string columnName)
    {
        if (columnName.Equals(SortBy, StringComparison.OrdinalIgnoreCase))
        {
            return SortDirection == SortDirections.Asc ? SortDirections.Desc : SortDirections.Asc;
        }
        return SortDirections.Asc;
    }
}
