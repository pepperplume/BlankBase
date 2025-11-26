namespace BlankBase.Models.Toasts
{
    public class ToastNotification
    {
        public string MessageText { get; set; } = string.Empty;
        public ToastType MessageType { get; set; } = ToastType.Success;
        public int Duration { get; set; } = 3000;
        public bool AutoHide { get; set; } = true;

        public ToastNotification()
        {
        }

        public ToastNotification(string messageText, ToastType messageType = ToastType.Success, int duration = 3000, bool autoHide = true)
        {
            MessageText = messageText;
            MessageType = messageType;
            Duration = duration;
            AutoHide = autoHide;
        }
    }
}
