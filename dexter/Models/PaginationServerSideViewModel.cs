using BlankBase.Data;

namespace BlankBase.Models;

/// <summary>
/// View model for server-side pagination controls.
/// Contains all necessary data to render pagination info and navigation controls.
/// </summary>
public class PaginationServerSideViewModel
{
    /// <summary>
    /// Current page number (1-indexed).
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items across all pages.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages.
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Whether there is a previous page available.
    /// </summary>
    public bool HasPreviousPage { get; set; }

    /// <summary>
    /// Whether there is a next page available.
    /// </summary>
    public bool HasNextPage { get; set; }

    /// <summary>
    /// Current sort column name.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Current sort direction ("asc" or "desc").
    /// </summary>
    public string SortDirection { get; set; } = SortDirections.Asc;

    /// <summary>
    /// Controller name for URL generation (use Name&lt;TController&gt;.Value).
    /// </summary>
    public string ControllerName { get; set; } = string.Empty;

    /// <summary>
    /// Action name for URL generation (use nameof(Controller.Action)).
    /// </summary>
    public string ActionName { get; set; } = string.Empty;

    /// <summary>
    /// Creates a PaginationServerSideViewModel from a PagedResult and routing information.
    /// </summary>
    /// <typeparam name="T">Type of items in the paged result</typeparam>
    /// <param name="pagedResult">The paged result containing pagination metadata</param>
    /// <param name="sortBy">Current sort column</param>
    /// <param name="sortDirection">Current sort direction</param>
    /// <param name="controllerName">Controller name for URL generation</param>
    /// <param name="actionName">Action name for URL generation</param>
    /// <returns>A new PaginationServerSideViewModel instance</returns>
    public static PaginationServerSideViewModel FromPagedResult<T>(
        PagedResult<T> pagedResult,
        string? sortBy,
        string sortDirection,
        string controllerName,
        string actionName)
    {
        return new PaginationServerSideViewModel
        {
            PageNumber = pagedResult.PageNumber,
            PageSize = pagedResult.PageSize,
            TotalCount = pagedResult.TotalCount,
            TotalPages = pagedResult.TotalPages,
            HasPreviousPage = pagedResult.HasPreviousPage,
            HasNextPage = pagedResult.HasNextPage,
            SortBy = sortBy,
            SortDirection = sortDirection,
            ControllerName = controllerName,
            ActionName = actionName
        };
    }
}
