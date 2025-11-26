using BlankBase.Data.Repositories;

namespace BlankBase.Data;

public interface IUnitOfWork : IDisposable
{
    IApplicationSettingRepository ApplicationSettingRepository { init; get; }
    IExampleRecordRepository ExampleRecordRepository { init; get; }
    bool IsDisposed { get; }

    int SaveChanges();
    Task<int> SaveChangesAsync();
}