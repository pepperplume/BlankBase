
namespace BlankBase.Data;

public interface IRepository<TEntity> where TEntity : class, new()
{
    void Add(TEntity entity);
    ValueTask AddAsync(TEntity entity);
    void AddRange(IEnumerable<TEntity> entities);
    void AddRange(params TEntity[] entities);
    Task AddRangeAsync(IEnumerable<TEntity> entities);
    Task AddRangeAsync(params TEntity[] entities);
    TEntity? Find(params object[] id);
    ValueTask<TEntity?> FindAsync(params object[] id);
    bool IsExistByID(params object[] id);
    Task<bool> IsExistByIDAsync(params object[] id);
    void Remove(TEntity entity);
    void RemoveRange(IEnumerable<TEntity> entities);
    void RemoveRange(params TEntity[] entities);
    void Update(TEntity entity);
    void UpdateRange(IEnumerable<TEntity> entities);
    void UpdateRange(params TEntity[] entities);
}