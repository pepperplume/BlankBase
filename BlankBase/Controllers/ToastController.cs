using Microsoft.AspNetCore.Mvc;
using BlankBase.Extensions;
using BlankBase.Models;

namespace BlankBase.Controllers
{
    public class ToastController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult ShowToast([FromBody] ToastRequest request)
        {
            // Pass the parameters back as JSON for the client-side JavaScript to handle
            return Json(new
            {
                messageText = request.MessageText,
                messageType = request.MessageType,
                duration = request.Duration,
                autoHide = request.AutoHide
            });
        }

        public IActionResult FormExample()
        {
            return View();
        }

        [HttpPost]
        public IActionResult FormExample(string name, int age)
        {
            // Add multiple toast messages using the extension method with type-safe enum
            TempData.AddToast($"Hello {name}! You are {age} years old.", ToastType.Warning, 5000);
            TempData.AddToast("Your form has been successfully submitted.", ToastType.Error, 4000);

            if (age < 18)
            {
                TempData.AddToast("Note: You are under 18 years old.", ToastType.Warning, 6000);
            }
            else if (age >= 65)
            {
                TempData.AddToast("Senior discount available!", ToastType.Success, 5000);
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
