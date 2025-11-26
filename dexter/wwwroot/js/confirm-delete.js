/**
 * ConfirmDelete - Inline delete confirmation using Bootstrap popovers
 *
 * Declarative "flip cover" pattern for delete confirmations - shows a popover
 * next to the delete button instead of a modal dialog. Provides spatial proximity
 * and context preservation for better UX.
 *
 * @class ConfirmDelete
 * @example
 * // Basic delete
 * <button class="btn btn-danger"
 *         data-confirm-delete
 *         data-confirm-url="/ExampleRecord/Delete/123">
 *     Delete
 * </button>
 *
 * @example
 * // With warning about side effects
 * <button class="btn btn-danger"
 *         data-confirm-delete
 *         data-confirm-url="/ExampleRecord/Delete/123"
 *         data-confirm-warning="This will also remove all associated codes">
 *     Delete
 * </button>
 *
 * @example
 * // With auto-remove table row (opt-in)
 * <button class="btn btn-danger"
 *         data-confirm-delete
 *         data-confirm-url="/ExampleRecord/Delete/123"
 *         data-confirm-remove-row>
 *     Delete
 * </button>
 */
class ConfirmDelete {
    /**
     * Initialize confirmation handler on a delete button
     * Sets up click handler to show popover confirmation
     *
     * @param {Element} button - The delete button element
     * @returns {void}
     */
    static initialize(button) {
        const url = button.getAttribute('data-confirm-url');
        const warning = button.getAttribute('data-confirm-warning');
        const removeRow = button.hasAttribute('data-confirm-remove-row');

        if (!url) {
            console.error('ConfirmDelete: data-confirm-url attribute is required', button);
            return;
        }

        button.addEventListener('click', (e) => {
            e.preventDefault();
            ConfirmDelete.#showConfirmation(button, url, warning, removeRow);
        });
    }

    /**
     * Show confirmation popover next to button
     * @private
     * @param {Element} button - The delete button
     * @param {string} url - URL to POST delete request to
     * @param {string|null} warning - Optional warning message
     * @param {boolean} removeRow - Whether to auto-remove table row on success
     */
    static #showConfirmation(button, url, warning, removeRow) {
        const popoverContent = ConfirmDelete.#createPopoverContent(warning);

        // Create Bootstrap popover
        const popover = new bootstrap.Popover(button, {
            content: popoverContent,
            html: true,
            trigger: 'manual',
            placement: 'bottom',
            sanitize: false // We control the HTML content
        });

        popover.show();

        // Attach event listeners after popover is shown
        setTimeout(() => {
            const popoverElement = document.querySelector('.popover');
            if (!popoverElement) return;

            // Confirm button - perform delete
            const confirmBtn = popoverElement.querySelector('.confirm-delete-yes');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    ConfirmDelete.#handleConfirm(button, url, removeRow, popover);
                });
            }

            // Dismiss on click outside
            const dismissHandler = (e) => {
                if (popoverElement && !popoverElement.contains(e.target) && e.target !== button) {
                    popover.dispose();
                    document.removeEventListener('click', dismissHandler);
                }
            };
            document.addEventListener('click', dismissHandler);

            // Clean up listener when popover is disposed
            button.addEventListener('hidden.bs.popover', () => {
                document.removeEventListener('click', dismissHandler);
            }, { once: true });
        }, 100);
    }

    /**
     * Create popover HTML content
     * @private
     * @param {string|null} warning - Optional warning message
     * @returns {string} HTML string for popover content
     */
    static #createPopoverContent(warning) {
        const warningHtml = warning
            ? `<div class="alert alert-warning py-1 px-2 mb-2 small">⚠ ${warning}</div>`
            : '';

        return `
            <div class="confirm-delete-popover">
                <p class="mb-2"><strong>Delete this item?</strong></p>
                ${warningHtml}
                <button type="button" class="btn btn-sm btn-danger confirm-delete-yes">Yes, delete</button>
            </div>
        `;
    }

    /**
     * Handle delete confirmation - perform the delete request
     * @private
     * @param {Element} button - The original delete button
     * @param {string} url - URL to POST delete request to
     * @param {boolean} removeRow - Whether to auto-remove table row on success
     * @param {bootstrap.Popover} popover - The popover instance
     */
    static async #handleConfirm(button, url, removeRow, popover) {
        const popoverElement = document.querySelector('.popover');
        const yesButton = popoverElement?.querySelector('.confirm-delete-yes');

        if (!yesButton) return;

        // Show loading state (spinner + text)
        yesButton.disabled = true;
        yesButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';

        try {
            // Get CSRF token for ASP.NET Core anti-forgery
            const csrfToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'RequestVerificationToken': csrfToken })
                }
            });

            const data = await response.json();

            // Show toast messages from server response
            Toast.showMessages(data);

            // Remove table row if requested and response was successful
            if (removeRow && response.ok) {
                const row = button.closest('tr');
                if (row) {
                    row.remove();
                }
            }

            // Hide popover
            popover.dispose();

        } catch (error) {
            console.error('ConfirmDelete: Delete request failed', error);
            Toast.create('Delete failed. Please try again.', Toast.Type.ERROR, 5000, true);

            // Reset button state on error
            yesButton.disabled = false;
            yesButton.textContent = 'Yes, delete';
        }
    }
}

/**
 * Auto-initialize all delete confirmation buttons on page load
 * Finds all elements with [data-confirm-delete] attribute and attaches handlers
 */
Dom.whenLoaded(() => {
    const buttons = document.querySelectorAll('[data-confirm-delete]');
    buttons.forEach(button => ConfirmDelete.initialize(button));
});
