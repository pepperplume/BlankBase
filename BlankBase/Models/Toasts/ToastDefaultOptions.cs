namespace BlankBase.Models.Toasts
{
    public class ToastDefaultOptions
    {
        public int SuccessDuration { get; set; } = 3000;
        public int WarningDuration { get; set; } = 5000;
        public int ErrorDuration { get; set; } = 4000;

        public bool SuccessAutoHide { get; set; } = true;
        public bool WarningAutoHide { get; set; } = true;
        public bool ErrorAutoHide { get; set; } = false;
    }
}
