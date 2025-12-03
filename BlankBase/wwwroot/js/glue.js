/**
 * Gluer - Generic utility class for populating HTML templates with data using <glue> elements
 * and wiring up event handlers via Glueprints
 *
 * Handles:
 * - Data binding via <glue field="..."> elements
 * - Type formatting (dates, booleans, HTML)
 * - Automatic HTML escaping for security
 * - Boolean to badge/class mapping
 * - Parent and child attribute binding
 * - Incremental updates to existing rendered content
 * - Event handler registration via Glueprints with event delegation
 *
 * <glue> Element Patterns:
 *
 * 1. Content Binding (text inside glue):
 *    <td><glue field="Name"></glue></td>
 *
 * 2. Parent Attribute Binding (glue inside parent):
 *    <a>
 *      <glue parent-attr="href" field="ProfileUrl"></glue>
 *      View Profile
 *    </a>
 *
 * 3. Child Attribute Binding (glue wraps child):
 *    <glue field="ImageUrl" child-attr="src">
 *      <img alt="Profile">
 *    </glue>
 *
 * Formatting Attributes:
 * - format="date" → Format as localized date (e.g., "1/15/2025")
 * - format="datetime" → Format as localized datetime (e.g., "1/15/2025, 3:45 PM")
 * - format="html" → Insert as raw HTML (USE WITH CAUTION - no escaping)
 *
 * Boolean Attributes (Parent):
 * - parent-true-class, parent-false-class → Apply class to parent based on boolean value
 * - parent-true-text, parent-false-text → Set text inside glue based on boolean value
 *
 * Boolean Attributes (Child):
 * - child-true-class, child-false-class → Apply class to child based on boolean value
 * - child-true-text, child-false-text → Set text inside child based on boolean value
 *
 * Glueprints - Declarative Event Binding:
 *
 * Register event handlers that automatically wire up during rendering:
 *
 *   Gluer.registerGlueprint('recordRow', {
 *     bone: 'recordRow',
 *     delegate: '#recordsTableBody',
 *     events: [
 *       {
 *         event: 'click',
 *         selector: '.btn-edit',
 *         handler: (e, bone, data) => {
 *           editRecord(data.ExampleRecordID, bone);
 *         }
 *       }
 *     ]
 *   });
 *
 * Security:
 * - By default, all text content is HTML-escaped
 * - Only use format="html" for trusted, server-sanitized content
 *
 * CSS Requirement:
 *   glue { display: contents; }
 *
 * Usage:
 *   // Direct population:
 *   const template = document.getElementById('recordRowTemplate');
 *   const row = template.content.cloneNode(true);
 *   Gluer.populate(row, record);
 *   container.appendChild(row);
 *
 *   // Convenience method for rendering lists:
 *   Gluer.render('recordRowTemplate', 'recordsTableBody', items);
 *
 *   // Incremental updates to existing content:
 *   Gluer.update(existingRow, updatedData);
 *   Gluer.update(existingRow, updatedData, ['Name', 'Age']); // Only update specific fields
 */
class Gluer {
    // Static property to hold all registered Glueprints
    static Glueprints = {};

    // Track attached delegated listeners to prevent duplicates
    // Key: "containerId:eventType", Value: { glueprints: Set<glueprintName>, handler: Function }
    static #delegatedListeners = new Map();
    /**
     * Populate a template with data from an object
     * @param {DocumentFragment|Element} templateNode - Cloned template node or DOM element
     * @param {Object} data - Data object with properties to populate
     */
    static populate(templateNode, data) {
        // Find all <glue> elements with field attribute
        const glueElements = templateNode.querySelectorAll('glue[field]');

        glueElements.forEach(glueElement => {
            Gluer.#populateGlueElement(glueElement, data);
        });
    }

    /**
     * Update existing rendered content with new data (incremental updates)
     * @param {Element} container - Container element with existing glue elements
     * @param {Object} data - Updated data object
     * @param {Array<string>} [fields] - Optional array of field names to update (updates all if not specified)
     */
    static update(container, data, fields = null) {
        // Find all <glue> elements with field attribute
        let glueElements = container.querySelectorAll('glue[field]');

        // Filter to specific fields if provided
        if (fields && Array.isArray(fields)) {
            glueElements = Array.from(glueElements).filter(el =>
                fields.includes(el.getAttribute('field'))
            );
        }

        glueElements.forEach(glueElement => {
            Gluer.#populateGlueElement(glueElement, data);
        });
    }

    /**
     * Register a Glueprint for automatic event wiring
     *
     * @param {string} name - Name of the glueprint
     * @param {Object} config - Glueprint configuration
     * @param {string} config.bone - Bone name to wire up
     * @param {string} config.delegate - Container selector for event delegation
     * @param {Array} config.events - Array of event configurations
     *
     * @example
     * Gluer.registerGlueprint('recordRow', {
     *   bone: 'recordRow',
     *   delegate: '#recordsTableBody',
     *   events: [
     *     {
     *       event: 'click',
     *       selector: '.btn-edit',
     *       handler: (e, bone, data) => { editRecord(data.Id, bone); }
     *     }
     *   ]
     * });
     */
    static registerGlueprint(name, config) {
        if (!config.bone) {
            console.error(`Glueprint "${name}" missing required "bone" property`);
            return;
        }
        if (!config.delegate) {
            console.error(`Glueprint "${name}" missing required "delegate" property`);
            return;
        }
        if (!config.events || !Array.isArray(config.events)) {
            console.error(`Glueprint "${name}" missing required "events" array`);
            return;
        }

        Gluer.Glueprints[name] = config;
    }

    /**
     * Render multiple items using a template
     * Convenience helper that combines template cloning and population
     * Automatically wires up Glueprint event handlers
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

        // Wire up Glueprint event handlers for this container
        Gluer.#wireGlueprints(containerId);

        // Render each item
        items.forEach((item, index) => {
            const row = template.content.cloneNode(true);
            Gluer.populate(row, item);

            // Store data reference on bones for handler access
            Gluer.#attachDataToBones(row, item);

            // Allow custom modifications before appending
            if (beforeAppend) {
                beforeAppend(row, item, index);
            }

            container.appendChild(row);
        });
    }

    /**
     * Wire up Glueprint event handlers for a container
     * Uses event delegation for performance
     * @private
     */
    static #wireGlueprints(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Find all glueprints that delegate to this container
        for (const [name, glueprint] of Object.entries(Gluer.Glueprints)) {
            // Check if this glueprint delegates to this container
            const delegateSelector = glueprint.delegate;
            if (!delegateSelector) continue;

            // Normalize container selector (remove # if present)
            const normalizedDelegate = delegateSelector.startsWith('#')
                ? delegateSelector.slice(1)
                : delegateSelector;

            if (normalizedDelegate !== containerId) continue;

            // Wire up each event type
            for (const eventConfig of glueprint.events) {
                const { event, selector, handler } = eventConfig;

                if (!event || !handler) {
                    console.warn(`Glueprint "${name}" has invalid event config:`, eventConfig);
                    continue;
                }

                // Create delegation key
                const delegationKey = `${containerId}:${event}`;

                // Check if we already have a listener for this container + event type
                if (!Gluer.#delegatedListeners.has(delegationKey)) {
                    // Create new delegated listener
                    const delegatedHandler = (e) => {
                        // Find all glueprints registered for this delegation key
                        const listenerInfo = Gluer.#delegatedListeners.get(delegationKey);
                        if (!listenerInfo) return;

                        // Check each glueprint's events
                        for (const glueprintName of listenerInfo.glueprints) {
                            const gp = Gluer.Glueprints[glueprintName];
                            if (!gp) continue;

                            // Check each event in this glueprint
                            for (const ec of gp.events) {
                                if (ec.event !== event) continue;

                                // Check if event target or ancestor matches selector (if selector specified)
                                let targetElement = e.target;
                                if (ec.selector) {
                                    targetElement = e.target.closest(ec.selector);
                                    if (!targetElement) continue;
                                }

                                // Find closest bone from the matched target
                                const bone = targetElement.closest(`[data-bone="${gp.bone}"]`);
                                if (!bone) continue;

                                // Get data from bone
                                const data = bone.__glueData || {};

                                // Call handler
                                ec.handler(e, bone, data);
                            }
                        }
                    };

                    // Attach listener to container
                    container.addEventListener(event, delegatedHandler);

                    // Track this listener
                    Gluer.#delegatedListeners.set(delegationKey, {
                        glueprints: new Set([name]),
                        handler: delegatedHandler
                    });
                } else {
                    // Add this glueprint to existing listener
                    const listenerInfo = Gluer.#delegatedListeners.get(delegationKey);
                    listenerInfo.glueprints.add(name);
                }
            }
        }
    }

    /**
     * Attach data reference to bones for handler access
     * @private
     */
    static #attachDataToBones(container, data) {
        const bones = container.querySelectorAll('[data-bone]');
        bones.forEach(bone => {
            bone.__glueData = data;
        });
    }

    /**
     * Remove all Glueprint event listeners from a container
     *
     * @param {string} containerId - ID of the container to clean up
     *
     * @example
     * Gluer.unwireGlueprints('recordsTableBody');
     */
    static unwireGlueprints(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Find and remove all listeners for this container
        for (const [key, listenerInfo] of Gluer.#delegatedListeners.entries()) {
            if (key.startsWith(`${containerId}:`)) {
                const eventType = key.split(':')[1];
                container.removeEventListener(eventType, listenerInfo.handler);
                Gluer.#delegatedListeners.delete(key);
            }
        }
    }

    /**
     * Wire all registered Glueprints to existing DOM elements
     * Called automatically on page load
     * Can also be called manually to wire server-rendered content
     *
     * @example
     * // Manual wiring after dynamic content load
     * Gluer.wireAllExisting();
     */
    static wireAllExisting() {
        // Get all unique container IDs from registered glueprints
        const containerIds = new Set();

        for (const glueprint of Object.values(Gluer.Glueprints)) {
            if (glueprint.delegate) {
                // Normalize container selector (remove # if present)
                const normalizedDelegate = glueprint.delegate.startsWith('#')
                    ? glueprint.delegate.slice(1)
                    : glueprint.delegate;
                containerIds.add(normalizedDelegate);
            }
        }

        // Wire each container that exists in the DOM
        for (const containerId of containerIds) {
            const container = document.getElementById(containerId);
            if (container) {
                Gluer.#wireGlueprints(containerId);

                // Attach data to existing bones if they have data attributes
                Gluer.#attachDataToExistingBones(container);
            }
        }
    }

    /**
     * Attach data from data attributes to existing bones
     * @private
     */
    static #attachDataToExistingBones(container) {
        const bones = container.querySelectorAll('[data-bone]');
        bones.forEach(bone => {
            // If bone already has __glueData, skip (was set during render)
            if (bone.__glueData) return;

            // Extract all data-* attributes into an object
            const data = {};
            for (const attr of bone.attributes) {
                if (attr.name.startsWith('data-') && attr.name !== 'data-id' && attr.name !== 'data-bone') {
                    // Convert data-example-id to exampleId
                    const key = attr.name
                        .slice(5) // Remove 'data-'
                        .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    data[key] = attr.value;
                }
            }

            // Store data on bone
            if (Object.keys(data).length > 0) {
                bone.__glueData = data;
            }
        });
    }

    /**
     * Populate a single glue element with data
     * @private
     */
    static #populateGlueElement(glueElement, data) {
        const fieldName = glueElement.getAttribute('field');
        const value = data[fieldName];

        // Handle null/undefined values
        if (value === null || value === undefined) {
            Gluer.#handleNullValue(glueElement);
            return;
        }

        // Detect which pattern we're using
        const hasChildAttr = glueElement.hasAttribute('child-attr');
        const hasParentAttr = glueElement.hasAttribute('parent-attr');

        // Handle boolean with class/text mapping (e.g., badges)
        if (typeof value === 'boolean') {
            Gluer.#handleBooleanField(glueElement, value, hasChildAttr, hasParentAttr);
            return;
        }

        // Handle attribute binding patterns
        if (hasChildAttr) {
            Gluer.#handleChildAttribute(glueElement, value);
        } else if (hasParentAttr) {
            Gluer.#handleParentAttribute(glueElement, value);
        } else {
            // Content binding pattern
            Gluer.#handleContentBinding(glueElement, value);
        }
    }

    /**
     * Handle null/undefined values
     * @private
     */
    static #handleNullValue(glueElement) {
        const hasChildAttr = glueElement.hasAttribute('child-attr');
        const hasParentAttr = glueElement.hasAttribute('parent-attr');

        if (hasChildAttr) {
            const child = glueElement.firstElementChild;
            const attrName = glueElement.getAttribute('child-attr');
            if (child && attrName) {
                child.removeAttribute(attrName);
            }
        } else if (hasParentAttr) {
            const parent = glueElement.parentElement;
            const attrName = glueElement.getAttribute('parent-attr');
            if (parent && attrName) {
                parent.removeAttribute(attrName);
            }
        } else {
            glueElement.textContent = '';
        }
    }

    /**
     * Handle content binding (text inside glue element)
     * @private
     */
    static #handleContentBinding(glueElement, value) {
        const format = glueElement.getAttribute('format');

        switch (format) {
            case 'date':
                glueElement.textContent = Gluer.#formatDate(value);
                break;

            case 'datetime':
                glueElement.textContent = Gluer.#formatDateTime(value);
                break;

            case 'html':
                // WARNING: Only use for trusted, server-sanitized content
                glueElement.innerHTML = value;
                break;

            default:
                // Default: Set as text content (automatically HTML-escaped by browser)
                glueElement.textContent = value;
                break;
        }
    }

    /**
     * Handle parent attribute binding (glue inside parent)
     * @private
     */
    static #handleParentAttribute(glueElement, value) {
        const parent = glueElement.parentElement;
        const attrName = glueElement.getAttribute('parent-attr');

        if (parent && attrName) {
            parent.setAttribute(attrName, value);
        }
    }

    /**
     * Handle child attribute binding (glue wraps child)
     * @private
     */
    static #handleChildAttribute(glueElement, value) {
        const child = glueElement.firstElementChild;
        const attrName = glueElement.getAttribute('child-attr');

        if (child && attrName) {
            child.setAttribute(attrName, value);
        }
    }

    /**
     * Handle boolean fields with class and text mapping
     * @private
     */
    static #handleBooleanField(glueElement, value, hasChildAttr, hasParentAttr) {
        let targetElement;
        let trueClassAttr, falseClassAttr, trueTextAttr, falseTextAttr;

        if (hasChildAttr) {
            // Child pattern: apply to first child
            targetElement = glueElement.firstElementChild;
            trueClassAttr = 'child-true-class';
            falseClassAttr = 'child-false-class';
            trueTextAttr = 'child-true-text';
            falseTextAttr = 'child-false-text';
        } else if (hasParentAttr) {
            // Parent pattern: apply to parent
            targetElement = glueElement.parentElement;
            trueClassAttr = 'parent-true-class';
            falseClassAttr = 'parent-false-class';
            trueTextAttr = 'parent-true-text';
            falseTextAttr = 'parent-false-text';
        } else {
            // Content pattern: apply text to glue itself (no class support for content pattern)
            targetElement = glueElement;
            trueTextAttr = 'parent-true-text'; // Use parent- prefix even for content binding
            falseTextAttr = 'parent-false-text';
        }

        if (!targetElement) return;

        const trueClass = glueElement.getAttribute(trueClassAttr);
        const falseClass = glueElement.getAttribute(falseClassAttr);
        const trueText = glueElement.getAttribute(trueTextAttr);
        const falseText = glueElement.getAttribute(falseTextAttr);

        // Apply appropriate class (supports multiple space-separated classes)
        if (trueClass && falseClass) {
            // Split class strings and remove all classes from both sets
            const trueClasses = trueClass.split(/\s+/);
            const falseClasses = falseClass.split(/\s+/);
            targetElement.classList.remove(...trueClasses, ...falseClasses);

            // Add the appropriate set of classes
            const classesToAdd = value ? trueClasses : falseClasses;
            targetElement.classList.add(...classesToAdd);
        }

        // Set appropriate text
        if (trueText && falseText) {
            // For child pattern, set text inside child
            // For parent/content pattern, set text inside glue
            const textTarget = (hasChildAttr) ? targetElement : glueElement;
            textTarget.textContent = value ? trueText : falseText;
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

// Automatically wire all registered Glueprints when DOM is ready
// This handles server-rendered content that already exists in the page
if (typeof Dom !== 'undefined' && Dom.whenLoaded) {
    Dom.whenLoaded(() => {
        Gluer.wireAllExisting();
    });
}
