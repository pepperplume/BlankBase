using BlankBase.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlankBase.Data;

public class Context : DbContext
{
    public DbSet<ApplicationSetting> ApplicationSettings { get; set; }
    public DbSet<ExampleRecord> ExampleRecords { get; set; }

    public Context(DbContextOptions options) : base(options)
    { }

}
