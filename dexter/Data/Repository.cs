using Microsoft.EntityFrameworkCore;

namespace BlankBase.Data;

public class Repository<TDbContext, TEntity> : IRepository<TEntity> 
    where TDbContext : DbContext
    where TEntity : class, new()
{
    protected TDbContext _Context { get; private set; }

    public Repository(TDbContext context)
    {
        _Context = context;
    }

    public virtual TEntity? Find(params object[] id) => _Context.Set<TEntity>().Find(id);
    public virtual async ValueTask<TEntity?> FindAsync(params object[] id) => await _Context.Set<TEntity>().FindAsync(id);

    public virtual void Add(TEntity entity) => _Context.Set<TEntity>().Add(entity);
    public virtual async ValueTask AddAsync(TEntity entity) => await _Context.Set<TEntity>().AddAsync(entity);
    public virtual void AddRange(IEnumerable<TEntity> entities) => _Context.Set<TEntity>().AddRange(entities);
    public virtual async Task AddRangeAsync(IEnumerable<TEntity> entities) => await _Context.Set<TEntity>().AddRangeAsync(entities);
    public virtual void AddRange(params TEntity[] entities) => _Context.Set<TEntity>().AddRange(entities);
    public virtual async Task AddRangeAsync(params TEntity[] entities) => await _Context.Set<TEntity>().AddRangeAsync(entities);

    public virtual void Remove(TEntity entity) => _Context.Set<TEntity>().Remove(entity);
    public virtual void RemoveRange(IEnumerable<TEntity> entities) => _Context.Set<TEntity>().RemoveRange(entities);
    public virtual void RemoveRange(params TEntity[] entities) => _Context.Set<TEntity>().RemoveRange(entities);

    public virtual void Update(TEntity entity) => _Context.Set<TEntity>().Update(entity);
    public virtual void UpdateRange(IEnumerable<TEntity> entities) => _Context.Set<TEntity>().UpdateRange(entities);
    public virtual void UpdateRange(params TEntity[] entities) => _Context.Set<TEntity>().UpdateRange(entities);

    public virtual bool IsExistByID(params object[] id) => ( Find(id) is not null );
    public virtual async Task<bool> IsExistByIDAsync(params object[] id) => (await FindAsync(id) is not null);

    /// <summary>
    /// Helper method to apply sorting to a query based on direction.
    /// Reduces duplication in repository sort implementations.
    /// </summary>
    /// <typeparam name="TKey">The type of the property being sorted by</typeparam>
    /// <param name="query">The queryable to sort</param>
    /// <param name="keySelector">Expression selecting the property to sort by</param>
    /// <param name="direction">Sort direction: "asc" or "desc" (use SortDirections constants)</param>
    /// <returns>An ordered queryable</returns>
    protected IOrderedQueryable<TEntity> ApplySort<TKey>(
        IQueryable<TEntity> query,
        System.Linq.Expressions.Expression<Func<TEntity, TKey>> keySelector,
        string direction)
    {
        if (direction == SortDirections.Desc)
        {
            return query.OrderByDescending(keySelector);
        }
        else
        {
            return query.OrderBy(keySelector);
        }
    }
}
