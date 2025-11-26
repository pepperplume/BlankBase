using Microsoft.AspNetCore.Mvc;
using BlankBase.Services;
using BlankBase.Models.Toasts;
using BlankBase.Extensions;
using System.Text.Json;

namespace BlankBase.Controllers
{
    public class ToastController : Controller
    {
        private readonly IToastService _toastService;

        public ToastController(IToastService toastService)
        {
            _toastService = toastService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult ShowToast([FromBody] ToastRequest request)
        {
            // Parse MessageType string to enum, default to Success if invalid
            if (!Enum.TryParse<ToastType>(request.MessageType, true, out var messageType))
            {
                messageType = ToastType.Success;
            }

            // Create an empty JSON object as the base
            var json = JsonSerializer.SerializeToNode(new { });

            // Add toast to JSON using ToastService based on message type
            // This demonstrates the new pattern: any object + toastMessages
            json = messageType switch
            {
                ToastType.Success => _toastService.AddSuccessToJson(json!, request.MessageText, request.Duration, request.AutoHide),
                ToastType.Warning => _toastService.AddWarningToJson(json!, request.MessageText, request.Duration, request.AutoHide),
                ToastType.Error => _toastService.AddErrorToJson(json!, request.MessageText, request.Duration, request.AutoHide),
                _ => _toastService.AddSuccessToJson(json!, request.MessageText, request.Duration, request.AutoHide)
            };

            json = _toastService.AddSuccessToJson(json, "it worked", request.Duration, request.AutoHide);

            // Return JSON with toastMessages array (property name defined once in ToastService)
            return Json(json, TempDataExtensions.JsonOptions);
        }

        public IActionResult FormExample()
        {
            return View();
        }

        [HttpPost]
        public IActionResult FormExample(string name, int age)
        {
            // Add multiple toast messages using the toast service
            _toastService.AddSuccess($"Hello {name}! You are {age} years old.", duration: 5000);
            _toastService.AddSuccess("Your form has been successfully submitted.");

            if (age < 18)
            {
                _toastService.AddWarning("Note: You are under 18 years old.", duration: 6000);
            }
            else if (age >= 65)
            {
                _toastService.AddSuccess("Senior discount available!", duration: 5000);
            }

            // Redirect to GET action (Post-Redirect-Get pattern)
            return RedirectToAction("FormExample");
        }
    }

    public class ToastRequest
    {
        public string MessageText { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public int Duration { get; set; }
        public bool AutoHide { get; set; }
    }
}
