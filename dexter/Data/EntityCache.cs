namespace BlankBase.Data;

/// <summary>
/// Provides in-memory caching for entities with automatic deduplication.
/// Useful for orchestration scenarios where multiple database queries need to be merged into a single unique collection.
/// </summary>
/// <typeparam name="TEntity">The entity type to cache</typeparam>
/// <typeparam name="TKey">The key type used to identify entities (must be non-null)</typeparam>
public class EntityCache<TEntity, TKey> where TKey : notnull
{
    private readonly Dictionary<TKey, TEntity> _cache = new();
    private readonly Func<TEntity, TKey> _keySelector;

    /// <summary>
    /// Creates a new entity cache with the specified key selector function.
    /// </summary>
    /// <param name="keySelector">Function to extract the unique key from an entity (e.g., x => x.ID)</param>
    public EntityCache(Func<TEntity, TKey> keySelector)
    {
        _keySelector = keySelector ?? throw new ArgumentNullException(nameof(keySelector));
    }

    /// <summary>
    /// Adds a single entity to the cache. If an entity with the same key already exists, it is ignored (keeps first occurrence).
    /// </summary>
    /// <param name="entity">The entity to add</param>
    public void Add(TEntity entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        var key = _keySelector(entity);

        // Keep first occurrence - ignore duplicates
        if (!_cache.ContainsKey(key))
        {
            _cache[key] = entity;
        }
    }

    /// <summary>
    /// Adds multiple entities to the cache. Entities with duplicate keys are ignored (keeps first occurrence).
    /// </summary>
    /// <param name="entities">The entities to add</param>
    public void AddRange(IEnumerable<TEntity> entities)
    {
        if (entities == null)
            throw new ArgumentNullException(nameof(entities));

        foreach (var entity in entities)
        {
            var key = _keySelector(entity);

            // Keep first occurrence - ignore duplicates
            if (!_cache.ContainsKey(key))
            {
                _cache[key] = entity;
            }
        }
    }

    /// <summary>
    /// Attempts to retrieve an entity from the cache by its key.
    /// </summary>
    /// <param name="id">The key to search for</param>
    /// <param name="entity">The entity if found, or null if not found</param>
    /// <returns>True if the entity was found, false otherwise</returns>
    public bool TryGet(TKey id, out TEntity? entity)
    {
        return _cache.TryGetValue(id, out entity);
    }

    /// <summary>
    /// Checks if the cache contains an entity with the specified key.
    /// </summary>
    /// <param name="id">The key to search for</param>
    /// <returns>True if an entity with the specified key exists in the cache, false otherwise</returns>
    public bool Contains(TKey id)
    {
        return _cache.ContainsKey(id);
    }

    /// <summary>
    /// Returns all cached entities.
    /// </summary>
    /// <returns>An enumerable collection of all cached entities</returns>
    public IEnumerable<TEntity> GetAll()
    {
        return _cache.Values;
    }

    /// <summary>
    /// Clears all entities from the cache.
    /// </summary>
    public void Clear()
    {
        _cache.Clear();
    }

    /// <summary>
    /// Gets the number of entities currently in the cache.
    /// </summary>
    public int Count => _cache.Count;
}
