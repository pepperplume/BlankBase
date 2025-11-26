using BlankBase.Data.Entities;

namespace BlankBase.Data.SortColumns;

/// <summary>
/// Constants for ExampleRecord sortable column names.
/// Uses nameof() for refactor-safety - if properties are renamed, this will fail to compile.
/// This eliminates magic strings and provides a single source of truth for sort column names.
/// </summary>
/// <example>
/// Usage in views:
/// <code>
/// &lt;th data-column="@ExampleRecordSortColumns.Name"&gt;Name&lt;/th&gt;
/// </code>
///
/// Usage in repository:
/// <code>
/// var orderedQuery = sortBy switch
/// {
///     ExampleRecordSortColumns.Name => query.OrderBy(x => x.Name),
///     _ => query.OrderBy(x => x.Name)
/// };
/// </code>
/// </example>
public static class ExampleRecordSortColumns
{
    /// <summary>
    /// Sort by ExampleRecordID column
    /// </summary>
    public const string ExampleRecordID = nameof(ExampleRecord.ExampleRecordID);

    /// <summary>
    /// Sort by Name column
    /// </summary>
    public const string Name = nameof(ExampleRecord.Name);

    /// <summary>
    /// Sort by Age column
    /// </summary>
    public const string Age = nameof(ExampleRecord.Age);

    /// <summary>
    /// Sort by Birthdate column
    /// </summary>
    public const string Birthdate = nameof(ExampleRecord.Birthdate);

    /// <summary>
    /// Sort by IsActive column
    /// </summary>
    public const string IsActive = nameof(ExampleRecord.IsActive);
}
