/**
 * AjaxPagination - Reusable AJAX pagination controls with URL state management and optional sorting
 *
 * Handles:
 * - Rendering pagination controls (Previous/Next, page numbers with ellipsis)
 * - Displaying pagination info ("Showing X to Y of Z records")
 * - URL state management via History API (bookmarkable URLs)
 * - Browser back/forward button support
 * - Optional column sorting with visual indicators
 *
 * Usage:
 *   const pagination = new AjaxPagination({
 *       controlsContainer: 'paginationControls',
 *       infoContainer: 'paginationInfo',
 *       pageInfoContainer: 'pageInfo',
 *       onPageChange: (page, sortBy, sortDir) => loadRecords(page, sortBy, sortDir),
 *       urlParams: { page: 'page', sortBy: 'sortBy', sortDirection: 'sortDirection' },
 *       defaults: { page: 1, sortBy: 'Name', sortDirection: 'asc' },
 *       sorting: {
 *           enabled: true,
 *           headerSelector: '.sortable',
 *           columnAttribute: 'data-column',
 *           sortConstants: { asc: 'asc', desc: 'desc' },
 *           indicators: { asc: ' ▲', desc: ' ▼', none: '' }
 *       }
 *   });
 *
 *   // After fetching data from API:
 *   pagination.render(data.pagination, currentSortBy, currentSortDirection);
 */
class AjaxPagination {
    /**
     * @param {Object} options - Configuration options
     * @param {string} options.controlsContainer - ID of element for pagination buttons
     * @param {string} options.infoContainer - ID of element for "Showing X to Y of Z" text
     * @param {string} options.pageInfoContainer - ID of element for "Page X of Y" text
     * @param {Function} options.onPageChange - Callback when page changes: (page, sortBy, sortDirection) => {}
     * @param {Object} [options.urlParams] - URL parameter names (default: {page:'page', sortBy:'sortBy', sortDirection:'sortDirection'})
     * @param {Object} [options.defaults] - Default values (default: {page:1, sortBy:null, sortDirection:null})
     * @param {Object} [options.sorting] - Optional sorting configuration
     * @param {boolean} [options.sorting.enabled] - Enable sorting (default: false)
     * @param {string} [options.sorting.headerSelector] - CSS selector for sortable headers (default: '.sortable')
     * @param {string} [options.sorting.columnAttribute] - Data attribute containing column name (default: 'data-column')
     * @param {Object} [options.sorting.sortConstants] - Sort direction constants (default: {asc:'asc', desc:'desc'})
     * @param {Object} [options.sorting.indicators] - Sort indicator symbols (default: {asc:' ▲', desc:' ▼', none:''})
     */
    constructor(options) {
        // Required options
        this.controlsContainer = options.controlsContainer;
        this.infoContainer = options.infoContainer;
        this.pageInfoContainer = options.pageInfoContainer;
        this.onPageChange = options.onPageChange;

        // URL parameter names (configurable for flexibility)
        this.urlParams = options.urlParams || {
            page: 'page',
            sortBy: 'sortBy',
            sortDirection: 'sortDirection'
        };

        // Default values
        this.defaults = options.defaults || {
            page: 1,
            sortBy: null,
            sortDirection: null
        };

        // Sorting configuration
        this.sorting = options.sorting || { enabled: false };
        if (this.sorting.enabled) {
            this.sorting.headerSelector = this.sorting.headerSelector || '.sortable';
            this.sorting.columnAttribute = this.sorting.columnAttribute || 'data-column';
            this.sorting.sortConstants = this.sorting.sortConstants || { asc: 'asc', desc: 'desc' };
            this.sorting.indicators = this.sorting.indicators || { asc: ' ▲', desc: ' ▼', none: '' };
        }

        // Current state
        this.currentPage = this.defaults.page;
        this.currentSortBy = this.defaults.sortBy;
        this.currentSortDirection = this.defaults.sortDirection;

        // Initialize browser navigation handling
        this._initializePopStateHandler();

        // Initialize sorting if enabled
        if (this.sorting.enabled) {
            this._initializeSorting();
        }
    }

    /**
     * Read state from URL query parameters
     * @returns {Object} {page, sortBy, sortDirection}
     */
    getStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return {
            page: parseInt(params.get(this.urlParams.page)) || this.defaults.page,
            sortBy: params.get(this.urlParams.sortBy) || this.defaults.sortBy,
            sortDirection: params.get(this.urlParams.sortDirection) || this.defaults.sortDirection
        };
    }

    /**
     * Update URL with current state without reloading page
     * @param {number} page - Page number
     * @param {string} sortBy - Sort column
     * @param {string} sortDirection - Sort direction
     */
    updateUrl(page, sortBy, sortDirection) {
        const url = new URL(window.location);
        url.searchParams.set(this.urlParams.page, page);

        if (sortBy !== null && sortBy !== undefined) {
            url.searchParams.set(this.urlParams.sortBy, sortBy);
        }

        if (sortDirection !== null && sortDirection !== undefined) {
            url.searchParams.set(this.urlParams.sortDirection, sortDirection);
        }

        window.history.pushState({ page, sortBy, sortDirection }, '', url);
    }

    /**
     * Render pagination controls and info
     * @param {Object} pagination - Pagination metadata from API
     * @param {number} pagination.pageNumber - Current page number
     * @param {number} pagination.pageSize - Items per page
     * @param {number} pagination.totalCount - Total number of items
     * @param {number} pagination.totalPages - Total number of pages
     * @param {boolean} pagination.hasPreviousPage - Whether previous page exists
     * @param {boolean} pagination.hasNextPage - Whether next page exists
     * @param {string} sortBy - Current sort column
     * @param {string} sortDirection - Current sort direction
     */
    render(pagination, sortBy, sortDirection) {
        // Update current state
        this.currentPage = pagination.pageNumber;
        this.currentSortBy = sortBy;
        this.currentSortDirection = sortDirection;

        // Update URL to match current state
        this.updateUrl(this.currentPage, sortBy, sortDirection);

        // Render info text
        this._renderInfo(pagination);

        // Render pagination controls
        this._renderControls(pagination);

        // Update sort indicators if sorting is enabled
        if (this.sorting.enabled) {
            this.updateSortIndicators();
        }
    }

    /**
     * Render pagination info text
     * @private
     */
    _renderInfo(pagination) {
        const startRecord = (pagination.pageNumber - 1) * pagination.pageSize + 1;
        const endRecord = Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount);

        const infoElement = document.getElementById(this.infoContainer);
        if (infoElement) {
            infoElement.textContent = `Showing ${startRecord} to ${endRecord} of ${pagination.totalCount} records`;
        }

        const pageInfoElement = document.getElementById(this.pageInfoContainer);
        if (pageInfoElement) {
            pageInfoElement.textContent = `Page ${pagination.pageNumber} of ${pagination.totalPages}`;
        }
    }

    /**
     * Render pagination controls (buttons)
     * @private
     */
    _renderControls(pagination) {
        const controls = document.getElementById(this.controlsContainer);
        if (!controls) return;

        controls.innerHTML = '';

        // Previous button
        const prevLi = this._createPageButton('Previous', pagination.pageNumber - 1, !pagination.hasPreviousPage);
        prevLi.querySelector('a').innerHTML = '<span aria-hidden="true">&laquo; Previous</span>';
        controls.appendChild(prevLi);

        // Calculate page range
        const startPage = Math.max(1, pagination.pageNumber - 2);
        const endPage = Math.min(pagination.totalPages, pagination.pageNumber + 2);

        // First page + ellipsis
        if (startPage > 1) {
            controls.appendChild(this._createPageButton('1', 1, false));
            if (startPage > 2) {
                const ellipsis = document.createElement('li');
                ellipsis.className = 'page-item disabled';
                ellipsis.innerHTML = '<span class="page-link">...</span>';
                controls.appendChild(ellipsis);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === pagination.pageNumber;
            controls.appendChild(this._createPageButton(i.toString(), i, false, isActive));
        }

        // Last page + ellipsis
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                const ellipsis = document.createElement('li');
                ellipsis.className = 'page-item disabled';
                ellipsis.innerHTML = '<span class="page-link">...</span>';
                controls.appendChild(ellipsis);
            }
            controls.appendChild(this._createPageButton(pagination.totalPages.toString(), pagination.totalPages, false));
        }

        // Next button
        const nextLi = this._createPageButton('Next', pagination.pageNumber + 1, !pagination.hasNextPage);
        nextLi.querySelector('a').innerHTML = '<span aria-hidden="true">Next &raquo;</span>';
        controls.appendChild(nextLi);
    }

    /**
     * Create a page button element
     * @private
     */
    _createPageButton(text, pageNumber, disabled, active = false) {
        const li = document.createElement('li');
        li.className = 'page-item';

        if (disabled) li.classList.add('disabled');
        if (active) li.classList.add('active');

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = text;

        if (!disabled) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.onPageChange(pageNumber, this.currentSortBy, this.currentSortDirection);
            });
        }

        li.appendChild(a);
        return li;
    }

    /**
     * Initialize browser back/forward button handling
     * @private
     */
    _initializePopStateHandler() {
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                // State was saved, use it
                this.onPageChange(event.state.page, event.state.sortBy, event.state.sortDirection);
            } else {
                // No state, read from URL
                const state = this.getStateFromUrl();
                this.onPageChange(state.page, state.sortBy, state.sortDirection);
            }
        });
    }

    /**
     * Get current page number
     * @returns {number}
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Get current sort state
     * @returns {Object} {sortBy, sortDirection}
     */
    getCurrentSort() {
        return {
            sortBy: this.currentSortBy,
            sortDirection: this.currentSortDirection
        };
    }

    /**
     * Initialize sorting handlers
     * @private
     */
    _initializeSorting() {
        Dom.whenLoaded(() => this._attachSortHandlers());
    }

    /**
     * Attach click handlers to sortable column headers
     * @private
     */
    _attachSortHandlers() {
        const headers = document.querySelectorAll(this.sorting.headerSelector);
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute(this.sorting.columnAttribute);
                this.handleColumnClick(column);
            });
        });
    }

    /**
     * Handle column header click for sorting
     * @param {string} columnName - Name of the column to sort by
     */
    handleColumnClick(columnName) {
        // If clicking same column, toggle direction; otherwise start with asc
        if (columnName.toLowerCase() === this.currentSortBy.toLowerCase()) {
            this.currentSortDirection = this.currentSortDirection === this.sorting.sortConstants.asc
                ? this.sorting.sortConstants.desc
                : this.sorting.sortConstants.asc;
        } else {
            this.currentSortBy = columnName;
            this.currentSortDirection = this.sorting.sortConstants.asc;
        }

        // Reload with page 1 and new sort
        this.onPageChange(1, this.currentSortBy, this.currentSortDirection);
    }

    /**
     * Update sort indicators in table headers
     * Updates visual indicators (▲/▼) based on current sort state
     */
    updateSortIndicators() {
        const headers = document.querySelectorAll(this.sorting.headerSelector);
        headers.forEach(header => {
            const column = header.getAttribute(this.sorting.columnAttribute);
            const indicator = header.querySelector('.sort-indicator');

            if (!indicator) return;

            if (column.toLowerCase() === this.currentSortBy.toLowerCase()) {
                indicator.textContent = this.currentSortDirection === this.sorting.sortConstants.asc
                    ? this.sorting.indicators.asc
                    : this.sorting.indicators.desc;
            } else {
                indicator.textContent = this.sorting.indicators.none;
            }
        });
    }
}
