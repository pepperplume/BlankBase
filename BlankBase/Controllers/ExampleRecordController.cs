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
            },
            sort = new
            {
                sortBy = sortBy ?? ExampleRecordSortColumns.Name,
                sortDirection = sortDirection
            }
        }, TempDataExtensions.JsonOptions);
    }
}
