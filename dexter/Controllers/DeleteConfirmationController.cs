using BlankBase.Extensions;
using BlankBase.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;

namespace BlankBase.Controllers;

/// <summary>
/// Demo controller showing ConfirmDelete utility usage patterns
/// </summary>
public class DeleteConfirmationController : Controller
{
    private readonly IToastService _toastService;

    public DeleteConfirmationController(IToastService toastService)
    {
        _toastService = toastService;
    }

    /// <summary>
    /// Display demo page with various delete confirmation examples
    /// </summary>
    public IActionResult Index()
    {
        return View();
    }

    /// <summary>
    /// Demo delete endpoint - doesn't actually delete anything, just shows success toast
    /// </summary>
    /// <param name="id">Item ID (for demo purposes)</param>
    [HttpPost]
    public IActionResult Delete(int id)
    {
        // In a real app, you would delete the item here:
        // await _unitOfWork.YourRepository.DeleteAsync(id);
        // await _unitOfWork.SaveChangesAsync();

        // For demo, just return success message
        var result = new JsonObject
        {
            ["success"] = true,
            ["deletedId"] = id
        };

        _toastService.AddSuccessToJson(result, $"Item {id} deleted successfully!");

        return Json(result, TempDataExtensions.JsonOptions);
    }
}
