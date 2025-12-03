/**
 * Gluer - Template population utility using data-glue attributes
 *
 * Usage:
 *   Gluer.Glueprints = {
 *       'delete-btn': { event: 'click', handler: (event) => { ... } }
 *   };
 *   Gluer.init(); // Call once after defining Glueprints
 *   Gluer.glueUp('templateId', 'containerId', items);
 *
 * Template attributes:
 *   data-glue="FieldName" - Sets inner text from data.FieldName
 *   data-glue-attrs="attr:FieldName,attr2:FieldName2" - Sets attributes from data
 *   data-bone="identifier" - Structural identifier for event wiring
 */
class Gluer {
    static Glueprints = {};

    // Track if global event delegation has been initialized
    static #initialized = false;

    /**
     * Initialize global event delegation for all Glueprints
     * Call once after defining Glueprints (usually at end of _Layout.cshtml)
     */
    static init() {
        if (this.#initialized) return;

        // Set up global event delegation on document.body
        this.#setupEventDelegation(document.body);
        this.#initialized = true;
    }

    /**
     * Populate template with items and append to container
     * @param {string} templateId - ID of template element
     * @param {string} containerId - ID of container to append to
     * @param {Array} items - Array of data objects to render
     */
    static glueUp(templateId, containerId, items) {
        const template = document.getElementById(templateId);
        const container = document.getElementById(containerId);

        if (!template) {
            console.error(`Template not found: #${templateId}`);
            return;
        }

        if (!container) {
            console.error(`Container not found: #${containerId}`);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Process each item
        items.forEach(item => {
            const clone = template.content.cloneNode(true);

            // Find all elements with data-glue or data-glue-attrs
            const elements = clone.querySelectorAll('[data-glue], [data-glue-attrs]');
            elements.forEach(element => this.#populate(element, item));

            container.appendChild(clone);
        });

        // No need to set up event delegation here - init() handles it globally
    }

    /**
     * Create a single element from template without appending
     * Useful for creating elements that need custom handling (e.g., toasts)
     * @param {string} templateId - ID of template element
     * @param {Object} data - Data object with values
     * @returns {DocumentFragment} Populated document fragment (use .firstElementChild to get the element)
     */
    static createFromTemplate(templateId, data) {
        const template = document.getElementById(templateId);

        if (!template) {
            console.error(`Template not found: #${templateId}`);
            return null;
        }

        // Clone template
        const clone = template.content.cloneNode(true);

        // Find all elements with data-glue or data-glue-attrs
        const elements = clone.querySelectorAll('[data-glue], [data-glue-attrs]');
        elements.forEach(element => this.#populate(element, data));

        return clone;
    }

    /**
     * Populate a single element with data
     * @param {Element} element - DOM element to populate
     * @param {Object} data - Data object with values
     */
    static #populate(element, data) {
        // Handle data-glue (inner text)
        const glueField = element.dataset.glue;
        if (glueField && data.hasOwnProperty(glueField)) {
            element.textContent = data[glueField];
        }

        // Handle data-glue-attrs (attributes)
        const glueAttrs = element.dataset.glueAttrs;
        if (glueAttrs) {
            const attrPairs = this.#parseGlueAttrs(glueAttrs);
            attrPairs.forEach(([attrName, fieldName]) => {
                if (data.hasOwnProperty(fieldName)) {
                    element.setAttribute(attrName, data[fieldName]);
                }
            });
        }
    }

    /**
     * Parse data-glue-attrs string into attribute-field pairs
     * @param {string} attrsString - "attr:field,attr2:field2"
     * @returns {Array<[string, string]>} Array of [attrName, fieldName] pairs
     */
    static #parseGlueAttrs(attrsString) {
        return attrsString
            .split(',')
            .map(pair => pair.trim().split(':').map(s => s.trim()))
            .filter(pair => pair.length === 2);
    }

    /**
     * Set up event delegation on container based on Glueprints
     * @param {Element} container - Container element to attach listeners to (typically document.body)
     */
    static #setupEventDelegation(container) {
        // Skip if no Glueprints defined
        if (Object.keys(this.Glueprints).length === 0) {
            return;
        }

        // Group Glueprints by event type for efficiency
        const eventGroups = {};
        Object.entries(this.Glueprints).forEach(([bone, config]) => {
            const eventType = config.event || 'click';
            if (!eventGroups[eventType]) {
                eventGroups[eventType] = [];
            }
            eventGroups[eventType].push({ bone, handler: config.handler });
        });

        // Add one listener per event type to the container (global delegation)
        Object.entries(eventGroups).forEach(([eventType, configs]) => {
            container.addEventListener(eventType, (event) => {
                // Find closest element with data-bone (bubbles up from event.target)
                const target = event.target.closest('[data-bone]');
                if (!target) return;

                const bone = target.dataset.bone;

                // Find matching Glueprint and call handler
                const config = configs.find(c => c.bone === bone);
                if (config && config.handler) {
                    config.handler(event);
                }
            });
        });
    }
}
