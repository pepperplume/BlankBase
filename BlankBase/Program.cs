using BlankBase.Models.Toasts;
using BlankBase.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add HttpContextAccessor for ToastService
builder.Services.AddHttpContextAccessor();

// Register ToastService
builder.Services.AddScoped<IToastService, ToastService>();

// Configure toast default options
builder.Services.Configure<ToastDefaultOptions>(options =>
{
    options.SuccessDuration = 3000;
    options.WarningDuration = 5000;
    options.ErrorDuration = 4000;

    options.SuccessAutoHide = true;
    options.WarningAutoHide = true;
    options.ErrorAutoHide = false; // Errors require user acknowledgment
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
