using BlankBase.Data.Entities;

namespace BlankBase.Data.Repositories;

public class ApplicationSettingRepository(Context context) : Repository<Context, ApplicationSetting>(context), IApplicationSettingRepository
{
    private static int EXAMPLE_ID => 1;

    public async Task<ApplicationSetting> FindExampleID() => await _GetSettingAsync(EXAMPLE_ID);

    private async Task<ApplicationSetting> _GetSettingAsync(int appSettingID)
    {
        var setting = await _Context.ApplicationSettings.FindAsync(appSettingID);

        if (setting is null) throw new KeyNotFoundException($"Application Setting with ID {appSettingID} was not found.");

        return setting;
    }
}