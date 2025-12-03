using BlankBase.Data;
using BlankBase.Data.SortColumns;
using BlankBase.Extensions;
using BlankBase.Models;
using Microsoft.AspNetCore.Mvc;

namespace BlankBase.Controllers;

/// <summary>
/// Example controller demonstrating pagination patterns using the Repository pattern.
/// Shows both traditional server-side pagination and modern AJAX-based pagination.
/// </summary>
public class ExampleRecordController : Controller
{
    private readonly IUnitOfWork _unitOfWork;
    private const int DefaultPageSize = 10;

    public ExampleRecordController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Traditional server-side pagination with full page reload.
    /// Demonstrates the classic MVC pattern with page links and sortable columns.
    /// </summary>
    /// <param name="page">The page number (1-based)</param>
    /// <param name="sortBy">Column to sort by</param>
    /// <param name="sortDirection">Sort direction (asc or desc)</param>
    /// <returns>View with paginated and sorted data</returns>
    public async Task<IActionResult> Index(int page = 1, string? sortBy = null, string sortDirection = SortDirections.Asc)
    {
        if (page < 1) page = 1;

        var pagedResult = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(page, DefaultPageSize, sortBy, sortDirection);

        var viewModel = new ExampleRecordIndexViewModel
        {
            PagedResult = pagedResult,
            SortBy = sortBy ?? ExampleRecordSortColumns.Name,
            SortDirection = sortDirection
        };

        return View(viewModel);
    }

    /// <summary>
    /// Example page demonstrating AJAX-based pagination.
    /// Data is loaded dynamically via JavaScript without page reload.
    /// </summary>
    /// <returns>View with AJAX pagination UI</returns>
    public IActionResult AjaxExample()
    {
        return View();
    }

    /// <summary>
    /// API endpoint that returns paginated records as JSON.
    /// Used by the AJAX pagination example with sortable columns.
    /// </summary>
    /// <param name="page">The page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="sortBy">Column to sort by</param>
    /// <param name="sortDirection">Sort direction (asc or desc)</param>
    /// <returns>JSON containing paginated data and metadata</returns>
    [HttpGet]
    public async Task<IActionResult> GetRecordsJson(int page = 1, int pageSize = 10, string? sortBy = null, string sortDirection = SortDirections.Asc)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var pagedResult = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(page, pageSize, sortBy, sortDirection);

        // Format data for Gluer (server-side formatting instead of client-side)
        var formattedItems = pagedResult.Items.Select(record => new
        {
            record.ExampleRecordID,
            record.Name,
            record.Age,
            BirthdateFormatted = record.Birthdate.ToString("d"), // Short date format
            StatusText = record.IsActive ? "Active" : "Inactive",
            StatusClass = record.IsActive ? "badge bg-success" : "badge bg-secondary"
        });

        return Json(new
        {
            items = formattedItems,
            pagination = new
            {
                pageNumber = pagedResult.PageNumber,
                pageSize = pagedResult.PageSize,
                totalCount = pagedResult.TotalCount,
                totalPages = pagedResult.TotalPages,
                hasPreviousPage = pagedResult.HasPreviousPage,
                hasNextPage = pagedResult.HasNextPage
            },
            sort = new
            {
                sortBy = sortBy ?? ExampleRecordSortColumns.Name,
                sortDirection = sortDirection
            }
        }, TempDataExtensions.JsonOptions);
    }

    /// <summary>
    /// Demonstrates EntityCache usage for merging multiple query results with automatic deduplication.
    /// This pattern is useful in orchestration scenarios where you need to combine results from multiple queries
    /// while ensuring each entity appears only once (based on its ID).
    /// </summary>
    /// <returns>View showing cached and merged results</returns>
    public async Task<IActionResult> CacheExample()
    {
        // Create an EntityCache with type-safe key selector (int for ExampleRecordID)
        var cache = new EntityCache<Data.Entities.ExampleRecord, int>(x => x.ExampleRecordID);

        // Query 1: Get first page of records sorted by Name
        var page1Results = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(1, 5, ExampleRecordSortColumns.Name, SortDirections.Asc);
        cache.AddRange(page1Results.Items);

        // Query 2: Get second page of records sorted by Age
        var page2Results = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(2, 5, ExampleRecordSortColumns.Age, SortDirections.Desc);
        cache.AddRange(page2Results.Items); // Automatically deduplicates if any IDs overlap

        // Query 3: Get third page of records sorted by Birthdate
        var page3Results = await _unitOfWork.ExampleRecordRepository
            .GetAllExampleRecordsPagedAsync(3, 5, ExampleRecordSortColumns.Birthdate, SortDirections.Asc);
        cache.AddRange(page3Results.Items); // Keeps first occurrence, ignores duplicates

        // Type-safe lookup example
        if (cache.TryGet(1, out var specificRecord))
        {
            // Do something with the specific record
            ViewBag.FoundRecord = specificRecord;
        }

        // Get all unique records from cache
        var allUniqueRecords = cache.GetAll().ToList();

        ViewBag.CacheCount = cache.Count;
        ViewBag.Query1Count = page1Results.Items.Count;
        ViewBag.Query2Count = page2Results.Items.Count;
        ViewBag.Query3Count = page3Results.Items.Count;
        ViewBag.TotalQueriedCount = page1Results.Items.Count + page2Results.Items.Count + page3Results.Items.Count;

        return View(allUniqueRecords);
    }
}
