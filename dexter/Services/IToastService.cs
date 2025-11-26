using System.Text.Json.Nodes;

namespace BlankBase.Services
{
    /// <summary>
    /// Service for adding toast notifications to TempData for display after redirects.
    /// Uses the Post-Redirect-Get pattern to show user feedback messages.
    /// Inject this service via dependency injection to queue toast messages.
    /// </summary>
    /// <remarks>
    /// Toast notifications are stored in TempData and displayed on the next page load.
    /// Default durations and auto-hide behavior are configured via ToastDefaultOptions in Program.cs.
    /// </remarks>
    /// <example>
    /// <code>
    /// public class UserController : Controller
    /// {
    ///     private readonly IToastService _toastService;
    ///
    ///     public UserController(IToastService toastService)
    ///     {
    ///         _toastService = toastService;
    ///     }
    ///
    ///     [HttpPost]
    ///     public IActionResult Create(User user)
    ///     {
    ///         // Save user...
    ///         _toastService.AddSuccess("User created successfully!");
    ///         return RedirectToAction("Index");
    ///     }
    /// }
    /// </code>
    /// </example>
    public interface IToastService
    {
        /// <summary>
        /// Adds a success toast notification to TempData.
        /// </summary>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses SuccessDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses SuccessAutoHide from ToastDefaultOptions.</param>
        /// <remarks>
        /// Success toasts display with a green background and checkmark icon.
        /// Default configuration: 3000ms duration, auto-hide enabled.
        /// </remarks>
        /// <example>
        /// <code>
        /// // Use default settings
        /// _toastService.AddSuccess("Operation completed!");
        ///
        /// // Custom duration
        /// _toastService.AddSuccess("Profile updated", duration: 5000);
        ///
        /// // Require manual dismissal
        /// _toastService.AddSuccess("Important: Settings saved", autoHide: false);
        /// </code>
        /// </example>
        void AddSuccess(string message, int? duration = null, bool? autoHide = null);

        /// <summary>
        /// Adds a warning toast notification to TempData.
        /// </summary>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses WarningDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses WarningAutoHide from ToastDefaultOptions.</param>
        /// <remarks>
        /// Warning toasts display with a yellow background and warning icon.
        /// Default configuration: 5000ms duration, auto-hide enabled.
        /// </remarks>
        /// <example>
        /// <code>
        /// // Use default settings
        /// _toastService.AddWarning("Password will expire soon");
        ///
        /// // Custom duration (longer for important warnings)
        /// _toastService.AddWarning("Account requires verification", duration: 8000);
        /// </code>
        /// </example>
        void AddWarning(string message, int? duration = null, bool? autoHide = null);

        /// <summary>
        /// Adds an error toast notification to TempData.
        /// </summary>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses ErrorDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses ErrorAutoHide from ToastDefaultOptions.</param>
        /// <remarks>
        /// Error toasts display with a red background and X icon.
        /// Default configuration: 4000ms duration, auto-hide DISABLED (requires user acknowledgment).
        /// </remarks>
        /// <example>
        /// <code>
        /// // Use default settings (won't auto-hide)
        /// _toastService.AddError("Failed to save changes");
        ///
        /// // Override to auto-hide for minor errors
        /// _toastService.AddError("Invalid input", autoHide: true);
        ///
        /// // Multiple error messages
        /// _toastService.AddError("Database connection failed");
        /// _toastService.AddError("Please try again later");
        /// </code>
        /// </example>
        void AddError(string message, int? duration = null, bool? autoHide = null);

        /// <summary>
        /// Adds a success toast notification to a JSON response object for AJAX endpoints.
        /// Creates or appends to the toastMessages array in the JSON structure.
        /// </summary>
        /// <param name="jsonData">The JSON data to attach the toast to (will be modified)</param>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses SuccessDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses SuccessAutoHide from ToastDefaultOptions.</param>
        /// <returns>The modified JSON data with toastMessages array attached</returns>
        /// <remarks>
        /// Use this method for AJAX/JavaScript-initiated responses where you need to return data + toast notifications.
        /// This is different from AddSuccess() which uses TempData for Post-Redirect-Get patterns.
        /// The toastMessages property is automatically created if it doesn't exist, or appended to if it does.
        /// </remarks>
        /// <example>
        /// <code>
        /// [HttpPost]
        /// public IActionResult CreateUser(User user)
        /// {
        ///     var result = new { id = 1, name = user.Name };
        ///     var json = JsonSerializer.SerializeToNode(result);
        ///     json = _toastService.AddSuccessToJson(json, "User created!");
        ///     return Json(json, TempDataExtensions.JsonOptions);
        /// }
        /// </code>
        /// </example>
        JsonNode AddSuccessToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null);

        /// <summary>
        /// Adds a warning toast notification to a JSON response object for AJAX endpoints.
        /// Creates or appends to the toastMessages array in the JSON structure.
        /// </summary>
        /// <param name="jsonData">The JSON data to attach the toast to (will be modified)</param>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses WarningDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses WarningAutoHide from ToastDefaultOptions.</param>
        /// <returns>The modified JSON data with toastMessages array attached</returns>
        /// <remarks>
        /// Use this method for AJAX/JavaScript-initiated responses where you need to return data + toast notifications.
        /// This is different from AddWarning() which uses TempData for Post-Redirect-Get patterns.
        /// The toastMessages property is automatically created if it doesn't exist, or appended to if it does.
        /// </remarks>
        /// <example>
        /// <code>
        /// [HttpPost]
        /// public IActionResult UpdateProfile(Profile profile)
        /// {
        ///     var result = new { success = true };
        ///     var json = JsonSerializer.SerializeToNode(result);
        ///     json = _toastService.AddSuccessToJson(json, "Profile updated");
        ///     json = _toastService.AddWarningToJson(json, "Please verify your email");
        ///     return Json(json, TempDataExtensions.JsonOptions);
        /// }
        /// </code>
        /// </example>
        JsonNode AddWarningToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null);

        /// <summary>
        /// Adds an error toast notification to a JSON response object for AJAX endpoints.
        /// Creates or appends to the toastMessages array in the JSON structure.
        /// </summary>
        /// <param name="jsonData">The JSON data to attach the toast to (will be modified)</param>
        /// <param name="message">The message text to display</param>
        /// <param name="duration">Optional duration in milliseconds. If null, uses ErrorDuration from ToastDefaultOptions.</param>
        /// <param name="autoHide">Optional auto-hide behavior. If null, uses ErrorAutoHide from ToastDefaultOptions.</param>
        /// <returns>The modified JSON data with toastMessages array attached</returns>
        /// <remarks>
        /// Use this method for AJAX/JavaScript-initiated responses where you need to return data + toast notifications.
        /// This is different from AddError() which uses TempData for Post-Redirect-Get patterns.
        /// The toastMessages property is automatically created if it doesn't exist, or appended to if it does.
        /// </remarks>
        /// <example>
        /// <code>
        /// [HttpPost]
        /// public IActionResult ProcessPayment(Payment payment)
        /// {
        ///     var result = new { success = false };
        ///     var json = JsonSerializer.SerializeToNode(result);
        ///     json = _toastService.AddErrorToJson(json, "Payment failed");
        ///     return Json(json, TempDataExtensions.JsonOptions);
        /// }
        /// </code>
        /// </example>
        JsonNode AddErrorToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null);
    }
}
