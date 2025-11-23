/**
 * Toast notification system for Bootstrap toast display.
 * Used site-wide for showing user feedback messages.
 *
 * @namespace Toast
 * @example
 * // Client-side toast
 * Toast.create("Operation successful", Toast.Type.SUCCESS, 3000, true);
 *
 * @example
 * // Server response with toastMessages array
 * Toast.showMessages(response);
 */

/**
 * Toast notification object - Public API
 * @type {Object}
 */
const Toast = {
    /**
     * Container element ID (internal use only)
     * @private
     * @type {string}
     */
    _CONTAINER_ID: 'toastContainer',

    /**
     * Counter for generating unique toast IDs (internal use only)
     * Ensures unique IDs even when multiple toasts are created simultaneously
     * @private
     * @type {number}
     */
    _idCounter: 0,

    /**
     * Toast type constants - use these when creating toasts.
     * @readonly
     * @enum {string}
     * @example
     * Toast.create("Success!", Toast.Type.SUCCESS);
     * Toast.create("Warning!", Toast.Type.WARNING);
     * Toast.create("Error!", Toast.Type.ERROR);
     */
    Type: Object.freeze({
        /** Success message type - green background with checkmark */
        SUCCESS: 'success',
        /** Warning message type - yellow background with warning icon */
        WARNING: 'warning',
        /** Error message type - red background with X icon */
        ERROR: 'error'
    }),

    /**
     * Toast type configuration mapping (internal use only)
     * Maps type strings to Bootstrap classes and display properties
     * @private
     * @type {Object.<string, {bgClass: string, icon: string, title: string}>}
     */
    _CONFIG: {
        'success': {
            bgClass: 'bg-success text-white',
            icon: '✓',
            title: 'Success'
        },
        'warning': {
            bgClass: 'bg-warning',
            icon: '⚠',
            title: 'Warning'
        },
        'error': {
            bgClass: 'bg-danger text-white',
            icon: '✕',
            title: 'Error'
        }
    },

    /**
     * Display a toast notification from a configuration object.
     * Accepts both PascalCase (from C# JSON serialization) and camelCase (from JavaScript).
     *
     * @param {Object} config - Toast configuration object
     * @param {string} config.messageText - The message text to display (supports PascalCase: MessageText)
     * @param {string} config.messageType - Toast type: 'success', 'warning', or 'error' (supports PascalCase: MessageType)
     * @param {number} [config.duration=3000] - Display duration in milliseconds (supports PascalCase: Duration)
     * @param {boolean} [config.autoHide=true] - Whether to auto-hide the toast (supports PascalCase: AutoHide)
     * @returns {void}
     *
     * @example
     * // JavaScript style (camelCase)
     * Toast.show({
     *     messageText: "Profile updated successfully",
     *     messageType: "success",
     *     duration: 3000,
     *     autoHide: true
     * });
     *
     * @example
     * // From server response (PascalCase)
     * Toast.show({
     *     MessageText: "Profile updated successfully",
     *     MessageType: "Success",
     *     Duration: 5000,
     *     AutoHide: false
     * });
     */
    show: function(config) {
        // Extract values, handling both PascalCase and camelCase
        const messageText = config.messageText || config.MessageText;
        const messageType = config.messageType || config.MessageType;
        const duration = config.duration !== undefined ? config.duration :
                        (config.Duration !== undefined ? config.Duration : 3000);
        const autoHide = config.autoHide !== undefined ? config.autoHide :
                        (config.AutoHide !== undefined ? config.AutoHide : true);

        // Generate unique ID using timestamp + counter to handle multiple toasts created simultaneously
        const toastId = 'toast-' + Date.now() + '-' + (++this._idCounter);
        const toast = this._createElement(toastId, messageText, messageType);

        // Append to container
        document.getElementById(this._CONTAINER_ID).appendChild(toast);

        // Initialize and show the toast
        const toastElement = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastElement, {
            autohide: autoHide,
            delay: duration
        });

        bsToast.show();

        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function () {
            toastElement.remove();
        });
    },

    /**
     * Convenience method for creating toasts with individual parameters.
     * Useful for client-side toasts like network errors, validation feedback, etc.
     *
     * @param {string} messageText - The message text to display
     * @param {string} messageType - Toast type: 'success', 'warning', or 'error' (use Toast.Type constants)
     * @param {number} duration - Display duration in milliseconds
     * @param {boolean} autoHide - Whether to auto-hide the toast
     * @returns {void}
     *
     * @example
     * // Network error handling
     * fetch('/api/data')
     *     .catch(error => {
     *         Toast.create('Server unavailable', Toast.Type.ERROR, 5000, false);
     *     });
     *
     * @example
     * // Client-side validation
     * if (age < 18) {
     *     Toast.create('You must be 18 or older', Toast.Type.WARNING, 4000, true);
     * }
     */
    create: function(messageText, messageType, duration, autoHide) {
        return this.show({
            messageText: messageText,
            messageType: messageType,
            duration: duration,
            autoHide: autoHide
        });
    },

    /**
     * Process server response and display toast messages.
     * Expects response object with toastMessages array property.
     * Each toast in the array will be displayed sequentially.
     *
     * @param {Object} response - Server response object
     * @param {Array.<{MessageText: string, MessageType: string, Duration: number, AutoHide: boolean}>} response.toastMessages - Array of toast notification objects
     * @returns {void}
     *
     * @example
     * // AJAX POST that returns multiple toasts
     * fetch('/Toast/ShowToast', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ messageText: "Hello", messageType: "success" })
     * })
     * .then(response => response.json())
     * .then(data => Toast.showMessages(data));
     *
     * @example
     * // Expected server response format
     * // {
     * //   toastMessages: [
     * //     { MessageText: "First message", MessageType: "Success", Duration: 3000, AutoHide: true },
     * //     { MessageText: "Second message", MessageType: "Warning", Duration: 5000, AutoHide: true }
     * //   ]
     * // }
     */
    showMessages: function(response) {
        // Early return if no toastMessages
        if (!response || !response.toastMessages || !Array.isArray(response.toastMessages)) {
            return;
        }

        // Display each toast
        response.toastMessages.forEach(toast => {
            this.show(toast);
        });
    },

    /**
     * Create toast DOM element (internal use only).
     * Generates a Bootstrap toast element with the appropriate styling and content.
     *
     * @private
     * @param {string} id - Unique ID for the toast element
     * @param {string} message - Message text to display
     * @param {string} type - Toast type ('success', 'warning', or 'error')
     * @returns {HTMLDivElement} The created toast DOM element
     */
    _createElement: function(id, message, type) {
        // Get configuration for the toast type (case-insensitive, default to success)
        const config = this._CONFIG[type.toLowerCase()] || this._CONFIG[this.Type.SUCCESS];

        // Create toast HTML
        const toastDiv = document.createElement('div');
        toastDiv.id = id;
        toastDiv.className = 'toast';
        toastDiv.setAttribute('role', 'alert');
        toastDiv.setAttribute('aria-live', 'assertive');
        toastDiv.setAttribute('aria-atomic', 'true');

        toastDiv.innerHTML = `
            <div class="toast-header ${config.bgClass}">
                <strong class="me-auto">${config.icon} ${config.title}</strong>
                <button type="button" class="btn-close ${type.toLowerCase() === this.Type.WARNING ? '' : 'btn-close-white'}" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        return toastDiv;
    }
};

/**
 * Auto-initialize toasts from server (TempData).
 * On page load, checks for data-initial-toasts attribute on the toast container
 * and displays any toasts queued from the server via TempData.
 *
 * This enables the Post-Redirect-Get pattern where toasts are queued during POST
 * and displayed after redirect to GET.
 *
 * @listens DOMContentLoaded
 * @example
 * // Server-side (C#):
 * // TempData.AddToast("Welcome!", ToastType.Success);
 * // return RedirectToAction("Index");
 * //
 * // Client-side:
 * // On page load, this handler automatically displays the "Welcome!" toast
 */
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById(Toast._CONTAINER_ID);

    if (container && container.hasAttribute('data-initial-toasts')) {
        const initialToastsJson = container.getAttribute('data-initial-toasts');
        const initialToasts = JSON.parse(initialToastsJson);

        if (initialToasts && initialToasts.length > 0) {
            initialToasts.forEach(function(toast) {
                Toast.show(toast);
            });
        }

        // Clean up - remove the attribute after consumption
        container.removeAttribute('data-initial-toasts');
    }
});
