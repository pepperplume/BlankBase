using BlankBase.Data.Entities;

namespace BlankBase.Data.Repositories;

public interface IExampleRecordRepository : IRepository<ExampleRecord>
{
    Task<PagedResult<ExampleRecord>> GetAllExampleRecordsPagedAsync(
        int pageNumber,
        int pageSize,
        string? sortBy = null,
        string sortDirection = SortDirections.Asc);
}