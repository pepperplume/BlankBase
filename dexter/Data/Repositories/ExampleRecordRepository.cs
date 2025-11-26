using BlankBase.Data.Entities;
using BlankBase.Data.SortColumns;

namespace BlankBase.Data.Repositories;

public class ExampleRecordRepository(Context context) : Repository<Context, ExampleRecord>(context), IExampleRecordRepository
{
    /// <summary>
    /// Example pagination method demonstrating fluent API usage with sorting.
    /// Gets all records with pagination and customizable sorting support.
    /// </summary>
    /// <param name="pageNumber">The page number (1-based)</param>
    /// <param name="pageSize">The number of items per page</param>
    /// <param name="sortBy">Column name to sort by (ExampleRecordID, Name, Age, Birthdate, IsActive)</param>
    /// <param name="sortDirection">Sort direction: "asc" or "desc"</param>
    /// <returns>A PagedResult containing the sorted and paginated records</returns>
    public async Task<PagedResult<ExampleRecord>> GetAllExampleRecordsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc)
    {
        var query = _Context.ExampleRecords.AsQueryable();

        // Apply sorting based on column (whitelist approach for security)
        // Using constants from ExampleRecordSortColumns and SortDirections for refactor-safety
        var sortByLower = sortBy?.ToLower();
        var sortDirLower = sortDirection.ToLower();

        var orderedQuery = sortByLower switch
        {
            var col when col == ExampleRecordSortColumns.ExampleRecordID.ToLower() =>
                ApplySort(query, x => x.ExampleRecordID, sortDirLower),

            var col when col == ExampleRecordSortColumns.Name.ToLower() =>
                ApplySort(query, x => x.Name, sortDirLower),

            var col when col == ExampleRecordSortColumns.Age.ToLower() =>
                ApplySort(query, x => x.Age, sortDirLower),

            var col when col == ExampleRecordSortColumns.Birthdate.ToLower() =>
                ApplySort(query, x => x.Birthdate, sortDirLower),

            var col when col == ExampleRecordSortColumns.IsActive.ToLower() =>
                ApplySort(query, x => x.IsActive, sortDirLower),

            // Default: Sort by Name ascending
            _ => ApplySort(query, x => x.Name, SortDirections.Asc)
        };

        return await orderedQuery.GetPagedAsync(pageNumber, pageSize);
    }

}