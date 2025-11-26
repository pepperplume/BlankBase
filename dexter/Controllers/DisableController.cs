using BlankBase.Extensions;
using BlankBase.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;

namespace BlankBase.Controllers;

/// <summary>
/// Demo controller showing Dom button state management usage patterns
/// </summary>
public class DisableController : Controller
{
    private readonly IToastService _toastService;

    public DisableController(IToastService toastService)
    {
        _toastService = toastService;
    }

    /// <summary>
    /// Display demo page with various button state examples
    /// </summary>
    public IActionResult Index()
    {
        return View();
    }

    /// <summary>
    /// Simulate an async operation with configurable delay
    /// </summary>
    /// <param name="delayMs">Delay in milliseconds (default: 2000)</param>
    [HttpPost]
    public async Task<IActionResult> SimulateOperation(int delayMs = 2000)
    {
        // Simulate processing time
        await Task.Delay(delayMs);

        var result = new JsonObject
        {
            ["success"] = true,
            ["processedAt"] = DateTime.Now.ToString("HH:mm:ss")
        };

        _toastService.AddSuccessToJson(result, "Operation completed successfully!");

        return Json(result, TempDataExtensions.JsonOptions);
    }
}
