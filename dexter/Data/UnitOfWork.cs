using BlankBase.Data.Repositories;

namespace BlankBase.Data;

public class UnitOfWork : IUnitOfWork, IDisposable
{
    public bool IsDisposed { get; private set; }
    protected Context _Context { get; private set; }



    public IApplicationSettingRepository ApplicationSettingRepository { init; get; }
    public IExampleRecordRepository ExampleRecordRepository { init; get; }



    public UnitOfWork(Context context)
    {
        _Context = context;
        IsDisposed = false;

        ApplicationSettingRepository = new ApplicationSettingRepository(context);
        ExampleRecordRepository = new ExampleRecordRepository(context);
    }

    public int SaveChanges()
    {
        return _Context.SaveChanges();
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _Context.SaveChangesAsync();
    }

    public void Dispose()
    {
        if (IsDisposed) return;

        _Context.Dispose();
        IsDisposed = true;
    }
}
