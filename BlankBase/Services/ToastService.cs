using BlankBase.Extensions;
using BlankBase.Models.Toasts;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace BlankBase.Services
{
    /// <summary>
    /// Implementation of IToastService for adding toast notifications to TempData.
    /// Registered as a scoped service in Program.cs for dependency injection.
    /// </summary>
    /// <remarks>
    /// This service uses IHttpContextAccessor to access the current HTTP request's TempData,
    /// allowing it to be injected into controllers and other services.
    /// Default toast durations and auto-hide behavior are configured via ToastDefaultOptions.
    /// </remarks>
    public class ToastService : IToastService
    {
        private readonly ITempDataDictionaryFactory _tempDataFactory;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ToastDefaultOptions _options;

        /// <summary>
        /// Property name for toast messages array in JSON responses.
        /// Defined once to prevent typos across the codebase.
        /// </summary>
        private const string ToastMessagesKey = "toastMessages";

        /// <summary>
        /// Gets the TempData dictionary for the current HTTP request.
        /// </summary>
        /// <remarks>
        /// Accesses HttpContext through IHttpContextAccessor to retrieve TempData.
        /// This property is private and used internally by the Add* methods.
        /// </remarks>
        private ITempDataDictionary TempData =>
            _tempDataFactory.GetTempData(_httpContextAccessor.HttpContext!);

        /// <summary>
        /// Initializes a new instance of the ToastService class.
        /// </summary>
        /// <param name="tempDataFactory">Factory for creating TempData instances</param>
        /// <param name="httpContextAccessor">Accessor for the current HTTP context</param>
        /// <param name="options">Configuration options for default toast behavior</param>
        public ToastService(
            ITempDataDictionaryFactory tempDataFactory,
            IHttpContextAccessor httpContextAccessor,
            IOptions<ToastDefaultOptions> options)
        {
            _tempDataFactory = tempDataFactory;
            _httpContextAccessor = httpContextAccessor;
            _options = options.Value;
        }

        /// <inheritdoc />
        public void AddSuccess(string message, int? duration = null, bool? autoHide = null)
        {
            TempData.AddToast(
                message,
                ToastType.Success,
                duration ?? _options.SuccessDuration,
                autoHide ?? _options.SuccessAutoHide);
        }

        /// <inheritdoc />
        public void AddWarning(string message, int? duration = null, bool? autoHide = null)
        {
            TempData.AddToast(
                message,
                ToastType.Warning,
                duration ?? _options.WarningDuration,
                autoHide ?? _options.WarningAutoHide);
        }

        /// <inheritdoc />
        public void AddError(string message, int? duration = null, bool? autoHide = null)
        {
            TempData.AddToast(
                message,
                ToastType.Error,
                duration ?? _options.ErrorDuration,
                autoHide ?? _options.ErrorAutoHide);
        }

        /// <inheritdoc />
        public JsonNode AddSuccessToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null)
        {
            return AddToastToJson(
                jsonData,
                message,
                ToastType.Success,
                duration ?? _options.SuccessDuration,
                autoHide ?? _options.SuccessAutoHide);
        }

        /// <inheritdoc />
        public JsonNode AddWarningToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null)
        {
            return AddToastToJson(
                jsonData,
                message,
                ToastType.Warning,
                duration ?? _options.WarningDuration,
                autoHide ?? _options.WarningAutoHide);
        }

        /// <inheritdoc />
        public JsonNode AddErrorToJson(JsonNode jsonData, string message, int? duration = null, bool? autoHide = null)
        {
            return AddToastToJson(
                jsonData,
                message,
                ToastType.Error,
                duration ?? _options.ErrorDuration,
                autoHide ?? _options.ErrorAutoHide);
        }

        /// <summary>
        /// Internal helper method to add a toast notification to a JSON object.
        /// Creates the toastMessages array if it doesn't exist, or appends to it if it does.
        /// </summary>
        private JsonNode AddToastToJson(JsonNode jsonData, string message, ToastType type, int duration, bool autoHide)
        {
            // Ensure we have a JsonObject to work with
            var jsonObject = jsonData?.AsObject() ?? new JsonObject();

            // Get or create the toastMessages array
            JsonArray toastsArray;
            if (!jsonObject.ContainsKey(ToastMessagesKey))
            {
                toastsArray = new JsonArray();
                jsonObject[ToastMessagesKey] = toastsArray;
            }
            else
            {
                toastsArray = jsonObject[ToastMessagesKey]!.AsArray();
            }

            // Create the toast notification
            var notification = new ToastNotification
            {
                MessageText = message,
                MessageType = type,
                Duration = duration,
                AutoHide = autoHide
            };

            // Serialize and add to array
            var notificationNode = JsonSerializer.SerializeToNode(notification, TempDataExtensions.JsonOptions);
            toastsArray.Add(notificationNode);

            return jsonObject;
        }
    }
}
