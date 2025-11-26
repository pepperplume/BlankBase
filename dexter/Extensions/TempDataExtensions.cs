using BlankBase.Models.Toasts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BlankBase.Extensions
{
    public static class TempDataExtensions
    {
        private const string ToastKey = "ToastNotifications";

        // Configure JSON serialization to serialize enums as strings (not integers)
        // Public so views can use the same serialization settings
        public static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() }
        };

        public static void AddToast(this ITempDataDictionary tempData, string messageText, ToastType messageType = ToastType.Success, int duration = 3000, bool autoHide = true)
        {
            var toast = new ToastNotification(messageText, messageType, duration, autoHide);
            AddToast(tempData, toast);
        }

        public static void AddToast(this ITempDataDictionary tempData, ToastNotification toast)
        {
            var toasts = GetToasts(tempData);
            toasts.Add(toast);
            tempData[ToastKey] = JsonSerializer.Serialize(toasts, JsonOptions);
        }

        public static List<ToastNotification> GetToasts(this ITempDataDictionary tempData)
        {
            if (tempData.ContainsKey(ToastKey) && tempData[ToastKey] is string json)
            {
                try
                {
                    var toasts = JsonSerializer.Deserialize<List<ToastNotification>>(json, JsonOptions);
                    return toasts ?? new List<ToastNotification>();
                }
                catch (JsonException)
                {
                    // Corrupted or invalid JSON - return empty list
                    return new List<ToastNotification>();
                }
            }
            return new List<ToastNotification>();
        }
    }
}
