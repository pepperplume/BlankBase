using Microsoft.EntityFrameworkCore;

namespace BlankBase.Data;

/// <summary>
/// Extension methods for IOrderedQueryable to support pagination.
/// These methods are intended for use inside Repository classes only.
/// </summary>
public static class QueryableExtensions
{
    /// <summary>
    /// Paginates an ordered query and returns a PagedResult with metadata.
    /// IMPORTANT: Only works on IOrderedQueryable - you must call OrderBy/OrderByDescending first.
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <param name="query">The ordered query to paginate</param>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The number of items per page</param>
    /// <returns>A PagedResult containing the items and pagination metadata</returns>
    public static PagedResult<T> GetPaged<T>(
        this IOrderedQueryable<T> query,
        int pageNumber,
        int pageSize)
    {
        var totalCount = query.Count();

        var items = query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResult<T>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    /// <summary>
    /// Asynchronously paginates an ordered query and returns a PagedResult with metadata.
    /// IMPORTANT: Only works on IOrderedQueryable - you must call OrderBy/OrderByDescending first.
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <param name="query">The ordered query to paginate</param>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The number of items per page</param>
    /// <returns>A Task containing a PagedResult with the items and pagination metadata</returns>
    public static async Task<PagedResult<T>> GetPagedAsync<T>(
        this IOrderedQueryable<T> query,
        int pageNumber,
        int pageSize)
    {
        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
