using BlankBase.Data.Entities;

namespace BlankBase.Data.Repositories;

public interface IApplicationSettingRepository : IRepository<ApplicationSetting>
{
    Task<ApplicationSetting> FindExampleID();
}