/**
 * Dom - DOM manipulation utilities for element visibility, transitions, and class management
 *
 * Leverages Bootstrap utilities where possible (d-none class) and includes accessibility support
 * via aria-hidden attributes.
 *
 * @class Dom
 * @example
 * // Query elements
 * const element = Dom.get('#myElement');
 * const items = Dom.getAll('.item');
 *
 * @example
 * // Show/hide elements
 * Dom.show('#content');
 * Dom.hide('#loading');
 * Dom.toggle('#menu');
 *
 * @example
 * // Conditional visibility
 * Dom.showIf('#error', hasError);
 * Dom.hideIf('#content', isLoading);
 *
 * @example
 * // Transitions
 * Dom.fadeOut('#loading', 300, () => {
 *     Dom.fadeIn('#content', 300);
 * });
 */
class Dom {
    /**
     * Get a single element by selector
     * Optimized for ID selectors, falls back to querySelector for CSS selectors
     *
     * @param {string|Element} selector - CSS selector, ID (with or without #), or Element
     * @returns {Element|null} The element or null if not found
     *
     * @example
     * Dom.get('#myElement');        // By ID
     * Dom.get('.my-class');         // By class
     * Dom.get('div > p');           // By CSS selector
     * Dom.get(existingElement);     // Pass-through for elements
     */
    static get(selector) {
        if (!selector) return null;

        // If already an element, return it
        if (selector instanceof Element) {
            return selector;
        }

        // Optimize for simple ID selectors: #elementId
        if (selector.startsWith('#') && !selector.includes(' ') && !selector.includes('.', 1)) {
            return document.getElementById(selector.slice(1));
        }

        // CSS selector
        return document.querySelector(selector);
    }

    /**
     * Get all elements matching a selector
     * Returns a real Array (not NodeList) for easier manipulation
     *
     * @param {string} selector - CSS selector
     * @returns {Element[]} Array of matching elements
     *
     * @example
     * Dom.getAll('.item').forEach(item => {
     *     item.classList.add('processed');
     * });
     */
    static getAll(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    /**
     * Execute callback when DOM is fully loaded
     * Handles both pre-load and post-load scenarios - if DOM is already loaded, runs immediately
     *
     * @param {Function} callback - Function to execute when DOM is ready
     * @returns {void}
     *
     * @example
     * Dom.whenLoaded(() => {
     *     console.log('DOM is ready!');
     *     Dom.show('#content');
     * });
     */
    static whenLoaded(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            // DOM already loaded, run immediately
            callback();
        }
    }

    /**
     * Show an element by removing Bootstrap's d-none class
     * Also sets aria-hidden="false" for screen reader accessibility
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.show('#content');
     */
    static show(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.classList.remove('d-none');
        element.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide an element by adding Bootstrap's d-none class
     * Also sets aria-hidden="true" for screen reader accessibility
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.hide('#loading');
     */
    static hide(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.classList.add('d-none');
        element.setAttribute('aria-hidden', 'true');
    }

    /**
     * Toggle element visibility using Bootstrap's d-none class
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.toggle('#menu');
     */
    static toggle(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        const isHidden = element.classList.contains('d-none');
        if (isHidden) {
            Dom.show(selector);
        } else {
            Dom.hide(selector);
        }
    }

    /**
     * Show element if condition is true, hide if false
     * Useful for state-driven visibility (React-style)
     *
     * @param {string|Element} selector - Element selector or element
     * @param {boolean} condition - Show if true, hide if false
     * @returns {void}
     *
     * @example
     * Dom.showIf('#error', hasError);
     * Dom.showIf('#noRecords', data.items.length === 0);
     */
    static showIf(selector, condition) {
        if (condition) {
            Dom.show(selector);
        } else {
            Dom.hide(selector);
        }
    }

    /**
     * Hide element if condition is true, show if false
     * Inverse of showIf
     *
     * @param {string|Element} selector - Element selector or element
     * @param {boolean} condition - Hide if true, show if false
     * @returns {void}
     *
     * @example
     * Dom.hideIf('#content', isLoading);
     */
    static hideIf(selector, condition) {
        Dom.showIf(selector, !condition);
    }

    /**
     * Show all elements matching a selector
     *
     * @param {string} selector - CSS selector
     * @returns {void}
     *
     * @example
     * Dom.showAll('.error-message');
     */
    static showAll(selector) {
        Dom.getAll(selector).forEach(element => {
            Dom.show(element);
        });
    }

    /**
     * Hide all elements matching a selector
     *
     * @param {string} selector - CSS selector
     * @returns {void}
     *
     * @example
     * Dom.hideAll('.loading-spinner');
     */
    static hideAll(selector) {
        Dom.getAll(selector).forEach(element => {
            Dom.hide(element);
        });
    }

    /**
     * Fade in an element using CSS transitions
     * Sets display, then animates opacity from 0 to 1
     *
     * @param {string|Element} selector - Element selector or element
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @returns {void}
     *
     * @example
     * Dom.fadeIn('#content', 400);
     */
    static fadeIn(selector, duration = 300) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        // Remove d-none and prepare for fade
        element.classList.remove('d-none');
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.setAttribute('aria-hidden', 'false');

        // Trigger reflow to ensure transition runs
        element.offsetHeight;

        // Start fade in
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }

    /**
     * Fade out an element using CSS transitions
     * Animates opacity from 1 to 0, then hides element
     *
     * @param {string|Element} selector - Element selector or element
     * @param {number} duration - Animation duration in milliseconds (default: 300)
     * @param {Function} callback - Optional callback when fade completes
     * @returns {void}
     *
     * @example
     * Dom.fadeOut('#loading', 300, () => {
     *     console.log('Fade complete');
     * });
     */
    static fadeOut(selector, duration = 300, callback = null) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '0';
        element.setAttribute('aria-hidden', 'true');

        setTimeout(() => {
            element.classList.add('d-none');
            element.style.transition = '';
            element.style.opacity = '';
            if (callback) callback();
        }, duration);
    }

    /**
     * Add a CSS class to an element
     *
     * @param {string|Element} selector - Element selector or element
     * @param {string} className - Class name to add
     * @returns {void}
     *
     * @example
     * Dom.addClass('#element', 'active');
     */
    static addClass(selector, className) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.classList.add(className);
    }

    /**
     * Remove a CSS class from an element
     *
     * @param {string|Element} selector - Element selector or element
     * @param {string} className - Class name to remove
     * @returns {void}
     *
     * @example
     * Dom.removeClass('#element', 'active');
     */
    static removeClass(selector, className) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.classList.remove(className);
    }

    /**
     * Toggle a CSS class on an element
     *
     * @param {string|Element} selector - Element selector or element
     * @param {string} className - Class name to toggle
     * @returns {void}
     *
     * @example
     * Dom.toggleClass('#menu', 'open');
     */
    static toggleClass(selector, className) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.classList.toggle(className);
    }

    /**
     * Check if an element is visible
     * Considers both d-none class and inline display style
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {boolean} True if visible, false if hidden
     *
     * @example
     * if (Dom.isVisible('#content')) {
     *     console.log('Content is showing');
     * }
     */
    static isVisible(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return false;

        // Check Bootstrap d-none class
        if (element.classList.contains('d-none')) {
            return false;
        }

        // Check inline display style
        if (element.style.display === 'none') {
            return false;
        }

        // Check HTML5 hidden attribute
        if (element.hidden) {
            return false;
        }

        return true;
    }

    /**
     * Disable a button or input element
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.disable('#submitBtn');
     */
    static disable(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.disabled = true;
    }

    /**
     * Enable a button or input element
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.enable('#submitBtn');
     */
    static enable(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.disabled = false;
    }

    /**
     * Toggle disabled state of a button or input element
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.toggleDisable('#submitBtn');
     */
    static toggleDisable(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        element.disabled = !element.disabled;
    }

    /**
     * Disable button and show loading state with spinner
     * Saves original content and replaces with spinner + loading text
     * Loading text can be customized via data-loading-text attribute (default: "Loading...")
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * // Default loading text
     * Dom.disableShowLoading('#submitBtn');  // Shows "Loading..."
     *
     * @example
     * // Custom loading text via data attribute
     * // <button id="deleteBtn" data-loading-text="Deleting...">Delete</button>
     * Dom.disableShowLoading('#deleteBtn');  // Shows "Deleting..."
     */
    static disableShowLoading(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        // Save original content
        element.setAttribute('data-original-content', element.innerHTML);

        // Get loading text from data attribute or use default
        const loadingText = element.getAttribute('data-loading-text') || 'Loading...';

        // Replace content with spinner + loading text
        element.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${loadingText}`;

        // Disable the button
        element.disabled = true;
    }

    /**
     * Enable button and restore original content
     * Removes loading state and restores the content saved by disableShowLoading()
     *
     * @param {string|Element} selector - Element selector or element
     * @returns {void}
     *
     * @example
     * Dom.enableHideLoading('#submitBtn');
     *
     * @example
     * // Complete async operation example
     * Dom.disableShowLoading('#submitBtn');
     * fetch('/api/submit', {...})
     *     .then(response => response.json())
     *     .then(data => {
     *         Dom.enableHideLoading('#submitBtn');
     *         Toast.showMessages(data);
     *     })
     *     .catch(error => {
     *         Dom.enableHideLoading('#submitBtn');
     *         Toast.create('Error!', Toast.Type.ERROR);
     *     });
     */
    static enableHideLoading(selector) {
        const element = Dom.#getElement(selector);
        if (!element) return;

        // Restore original content
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent !== null) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }

        // Enable the button
        element.disabled = false;
    }

    /**
     * Internal helper to resolve element from selector or element
     * Centralizes element resolution logic
     *
     * @private
     * @param {string|Element} selector - Element selector or element
     * @returns {Element|null} The resolved element or null
     */
    static #getElement(selector) {
        return Dom.get(selector);
    }
}
