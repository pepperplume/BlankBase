/**
 * TemplateRenderer - Generic utility class for populating HTML templates with data
 *
 * Handles:
 * - Data binding via data-field attributes
 * - Type formatting (dates, booleans, HTML)
 * - Automatic HTML escaping for security
 * - Boolean to badge/class mapping
 *
 * Data Attribute Conventions:
 * - data-field="PropertyName" → Populate from data.PropertyName
 * - data-format="date" → Format as localized date (e.g., "1/15/2025")
 * - data-format="datetime" → Format as localized datetime (e.g., "1/15/2025, 3:45 PM")
 * - data-format="html" → Insert as raw HTML (USE WITH CAUTION - no escaping)
 * - data-true-class, data-false-class → Apply class based on boolean value
 * - data-true-text, data-false-text → Set text based on boolean value
 *
 * Security:
 * - By default, all text content is HTML-escaped
 * - Only use data-format="html" for trusted, server-sanitized content
 *
 * Usage:
 *   // Direct population:
 *   const template = document.getElementById('recordRowTemplate');
 *   const row = template.content.cloneNode(true);
 *   TemplateRenderer.populate(row, record);
 *   container.appendChild(row);
 *
 *   // Convenience method for rendering lists:
 *   TemplateRenderer.render('recordRowTemplate', 'recordsTableBody', items);
 */
class TemplateRenderer {
    /**
     * Populate a template with data from an object
     * @param {DocumentFragment|Element} templateNode - Cloned template node or DOM element
     * @param {Object} data - Data object with properties to populate
     */
    static populate(templateNode, data) {
        // Find all elements with data-field attribute
        const fields = templateNode.querySelectorAll('[data-field]');

        fields.forEach(element => {
            const fieldName = element.getAttribute('data-field');
            const format = element.getAttribute('data-format');
            const value = data[fieldName];

            // Handle null/undefined values
            if (value === null || value === undefined) {
                element.textContent = '';
                return;
            }

            // Handle boolean with class/text mapping (e.g., badges)
            if (typeof value === 'boolean') {
                TemplateRenderer.#handleBooleanField(element, value);
                return;
            }

            // Handle formatting based on data-format attribute
            switch (format) {
                case 'date':
                    element.textContent = TemplateRenderer.#formatDate(value);
                    break;

                case 'datetime':
                    element.textContent = TemplateRenderer.#formatDateTime(value);
                    break;

                case 'html':
                    // WARNING: Only use for trusted, server-sanitized content
                    element.innerHTML = value;
                    break;

                default:
                    // Default: Set as text content (automatically HTML-escaped by browser)
                    element.textContent = value;
                    break;
            }
        });
    }

    /**
     * Render multiple items using a template
     * Convenience helper that combines template cloning and population
     *
     * @param {string} templateId - ID of the template element
     * @param {string} containerId - ID of the container to append to
     * @param {Array} items - Array of data objects
     * @param {Function} [beforeAppend] - Optional callback to modify row before appending: (row, item, index) => {}
     */
    static render(templateId, containerId, items, beforeAppend = null) {
        const template = document.getElementById(templateId);
        const container = document.getElementById(containerId);

        if (!template) {
            console.error(`Template not found: ${templateId}`);
            return;
        }

        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Render each item
        items.forEach((item, index) => {
            const row = template.content.cloneNode(true);
            TemplateRenderer.populate(row, item);

            // Allow custom modifications before appending
            if (beforeAppend) {
                beforeAppend(row, item, index);
            }

            container.appendChild(row);
        });
    }

    /**
     * Handle boolean fields with class and text mapping
     * @private
     */
    static #handleBooleanField(element, value) {
        const trueClass = element.getAttribute('data-true-class');
        const falseClass = element.getAttribute('data-false-class');
        const trueText = element.getAttribute('data-true-text');
        const falseText = element.getAttribute('data-false-text');

        // Apply appropriate class (supports multiple space-separated classes)
        if (trueClass && falseClass) {
            // Split class strings and remove all classes from both sets
            const trueClasses = trueClass.split(/\s+/);
            const falseClasses = falseClass.split(/\s+/);
            element.classList.remove(...trueClasses, ...falseClasses);

            // Add the appropriate set of classes
            const classesToAdd = value ? trueClasses : falseClasses;
            element.classList.add(...classesToAdd);
        }

        // Set appropriate text
        if (trueText && falseText) {
            element.textContent = value ? trueText : falseText;
        }
    }

    /**
     * Format a date value as localized date string
     * @private
     */
    static #formatDate(value) {
        const date = new Date(value);
        return date.toLocaleDateString();
    }

    /**
     * Format a date value as localized datetime string
     * @private
     */
    static #formatDateTime(value) {
        const date = new Date(value);
        return date.toLocaleString();
    }
}
