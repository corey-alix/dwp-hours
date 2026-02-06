interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
}

interface TableData {
    [key: string]: any;
}

import { querySingle } from '../test-utils';

export class DataTable extends HTMLElement {
    private shadow: ShadowRoot;
    private _data: TableData[] = [];
    private _columns: TableColumn[] = [];
    private _sortKey = '';
    private _sortDirection: 'asc' | 'desc' = 'asc';
    private _currentPage = 1;
    private _pageSize = 10;
    private _totalItems = 0;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['data', 'columns', 'page-size'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'data':
                    try {
                        this._data = JSON.parse(newValue);
                        this._totalItems = this._data.length;
                        this._currentPage = 1; // Reset to first page on data change
                    } catch (e) {
                        console.error('Invalid data JSON:', e);
                        this._data = [];
                        this._totalItems = 0;
                    }
                    break;
                case 'columns':
                    try {
                        this._columns = JSON.parse(newValue);
                    } catch (e) {
                        console.error('Invalid columns JSON:', e);
                        this._columns = [];
                    }
                    break;
                case 'page-size':
                    this._pageSize = parseInt(newValue) || 10;
                    this._currentPage = 1; // Reset to first page on page size change
                    break;
            }
            if (this.shadow) {
                this.render();
            }
        }
    }

    set data(value: TableData[]) {
        this.setAttribute('data', JSON.stringify(value));
    }

    get data(): TableData[] {
        return this._data;
    }

    set columns(value: TableColumn[]) {
        this.setAttribute('columns', JSON.stringify(value));
    }

    get columns(): TableColumn[] {
        return this._columns;
    }

    set pageSize(value: number) {
        this.setAttribute('page-size', value.toString());
    }

    get pageSize(): number {
        return this._pageSize;
    }

    private get sortedData(): TableData[] {
        if (!this._sortKey) return this._data;

        return [...this._data].sort((a, b) => {
            const aVal = a[this._sortKey];
            const bVal = b[this._sortKey];

            let result = 0;
            if (aVal < bVal) result = -1;
            if (aVal > bVal) result = 1;

            return this._sortDirection === 'asc' ? result : -result;
        });
    }

    private get paginatedData(): TableData[] {
        const startIndex = (this._currentPage - 1) * this._pageSize;
        const endIndex = startIndex + this._pageSize;
        return this.sortedData.slice(startIndex, endIndex);
    }

    private get totalPages(): number {
        return Math.ceil(this._totalItems / this._pageSize);
    }

    private render() {
        const paginatedData = this.paginatedData;

        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--color-surface);
                    border-radius: 8px;
                    box-shadow: 0 2px 4px var(--color-shadow);
                    overflow: hidden;
                }

                .table-container {
                    overflow-x: auto;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .table-header {
                    background: var(--color-surface);
                    border-bottom: 2px solid var(--color-border);
                }

                .table-header th {
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                    color: var(--color-text);
                    border-bottom: 1px solid var(--color-border);
                    position: relative;
                }

                .table-header th.sortable {
                    cursor: pointer;
                    user-select: none;
                }

                .table-header th.sortable:hover {
                    background: var(--color-surface-hover);
                }

                .sort-indicator {
                    display: inline-block;
                    margin-left: 8px;
                    opacity: 0.5;
                }

                .sort-indicator.active {
                    opacity: 1;
                }

                .table-body tr {
                    border-bottom: 1px solid var(--color-border);
                    transition: background-color 0.2s ease;
                }

                .table-body tr:hover {
                    background: var(--color-surface-hover);
                }

                .table-body td {
                    padding: 12px 16px;
                    vertical-align: middle;
                    color: var(--color-text-secondary);
                }

                .table-body tr:last-child {
                    border-bottom: none;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                }

                .empty-state h3 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    color: var(--color-text);
                }

                .pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: var(--color-surface);
                    border-top: 1px solid var(--color-border);
                }

                .pagination-info {
                    font-size: 14px;
                    color: var(--color-text-muted);
                }

                .pagination-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .page-btn {
                    padding: 6px 12px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-secondary);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .page-btn:hover:not(:disabled) {
                    background: var(--color-surface-hover);
                    border-color: var(--color-border-hover);
                }

                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .page-btn.active {
                    background: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }

                .page-size-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--color-text-muted);
                }

                .page-size-selector select {
                    padding: 4px 8px;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    background: var(--color-surface);
                }
            </style>

            <div class="table-container">
                <table class="data-table">
                    <thead class="table-header">
                        <tr>
                            ${this._columns.map(col => this.renderColumnHeader(col)).join('')}
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        ${paginatedData.length === 0 ?
                `<tr><td colspan="${this._columns.length}" class="empty-state">
                                <h3>No data available</h3>
                                <p>There are no items to display.</p>
                            </td></tr>` :
                paginatedData.map(row => this.renderTableRow(row)).join('')
            }
                    </tbody>
                </table>
            </div>

            ${this._totalItems > this._pageSize ? this.renderPagination() : ''}
        `;
    }

    private renderColumnHeader(column: TableColumn): string {
        const isSorted = this._sortKey === column.key;
        const sortIndicator = column.sortable ? `
            <span class="sort-indicator ${isSorted ? 'active' : ''}">
                ${isSorted && this._sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        ` : '';

        return `
            <th class="${column.sortable ? 'sortable' : ''}"
                style="${column.width ? `width: ${column.width};` : ''}"
                data-sort-key="${column.key}">
                ${column.label}${sortIndicator}
            </th>
        `;
    }

    private renderTableRow(row: TableData): string {
        return `
            <tr>
                ${this._columns.map(col => `<td>${this.formatCellValue(row[col.key])}</td>`).join('')}
            </tr>
        `;
    }

    private formatCellValue(value: any): string {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
    }

    private renderPagination(): string {
        const startItem = (this._currentPage - 1) * this._pageSize + 1;
        const endItem = Math.min(this._currentPage * this._pageSize, this._totalItems);
        const totalPages = this.totalPages;

        let pageButtons = '';

        // Previous button
        pageButtons += `<button class="page-btn" data-page="${this._currentPage - 1}" ${this._currentPage === 1 ? 'disabled' : ''}>‹</button>`;

        // Page numbers
        const startPage = Math.max(1, this._currentPage - 2);
        const endPage = Math.min(totalPages, this._currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pageButtons += `<button class="page-btn ${i === this._currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Next button
        pageButtons += `<button class="page-btn" data-page="${this._currentPage + 1}" ${this._currentPage === totalPages ? 'disabled' : ''}>›</button>`;

        return `
            <div class="pagination">
                <div class="pagination-info">
                    Showing ${startItem} to ${endItem} of ${this._totalItems} entries
                </div>
                <div class="pagination-controls">
                    <div class="page-size-selector">
                        <span>Show:</span>
                        <select id="page-size-select">
                            <option value="5" ${this._pageSize === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${this._pageSize === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${this._pageSize === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${this._pageSize === 50 ? 'selected' : ''}>50</option>
                        </select>
                    </div>
                    ${pageButtons}
                </div>
            </div>
        `;
    }

    private setupEventListeners() {
        // Sort functionality
        this.shadow.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const th = target.closest('th[data-sort-key]') as HTMLElement;
            if (th) {
                const sortKey = th.getAttribute('data-sort-key');
                if (sortKey) {
                    this.handleSort(sortKey);
                }
            }
        });

        // Pagination
        this.shadow.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('page-btn') && !target.hasAttribute('disabled')) {
                const page = parseInt(target.getAttribute('data-page') || '1');
                if (page >= 1 && page <= this.totalPages) {
                    this._currentPage = page;
                    this.render();
                    this.dispatchEvent(new CustomEvent('page-change', {
                        detail: { page: this._currentPage }
                    }));
                }
            }
        });

        // Page size change
        try {
            const pageSizeSelect = querySingle<HTMLSelectElement>('#page-size-select', this.shadow);
            pageSizeSelect?.addEventListener('change', (e) => {
                const newSize = parseInt((e.target as HTMLSelectElement).value);
                this.pageSize = newSize;
                this.dispatchEvent(new CustomEvent('page-size-change', {
                    detail: { pageSize: newSize }
                }));
            });
        } catch (error) {
            // Page size select may not be rendered yet if no data
        }
    }

    private handleSort(key: string) {
        if (this._sortKey === key) {
            this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortKey = key;
            this._sortDirection = 'asc';
        }
        this.render();
        this.dispatchEvent(new CustomEvent('sort-change', {
            detail: { sortKey: this._sortKey, sortDirection: this._sortDirection }
        }));
    }
}

customElements.define('data-table', DataTable);