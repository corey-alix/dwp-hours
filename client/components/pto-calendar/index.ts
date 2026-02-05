const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

const PTO_TYPE_COLORS: Record<string, string> = {
    PTO: "#FFFF00",
    Sick: "#00B050",
    Bereavement: "#BFBFBF",
    "Jury Duty": "#FF0000",
    "Planned PTO": "#00B0F0",
    "Work Day": "#FFFFFF"
};

export interface CalendarEntry {
    date: string;
    hours: number;
    type: string;
}

export class PtoCalendar extends HTMLElement {
    private shadow: ShadowRoot;
    private month: number;
    private year: number;
    private entries: CalendarEntry[];
    private selectedMonth: number | null;
    private readonly: boolean;
    private selectedPtoType: string | null;
    private selectedCells: Map<string, number>;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.month = 0;
        this.year = 0;
        this.entries = [];
        this.selectedMonth = null;
        this.readonly = true;
        this.selectedPtoType = null;
        this.selectedCells = new Map();
    }

    static get observedAttributes() {
        return ['month', 'year', 'entries', 'selected-month', 'readonly'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'month':
                this.month = parseInt(newValue, 10);
                break;
            case 'year':
                this.year = parseInt(newValue, 10);
                break;
            case 'entries':
                try {
                    this.entries = JSON.parse(newValue);
                } catch (e) {
                    this.entries = [];
                }
                break;
            case 'selected-month':
                this.selectedMonth = newValue === 'null' ? null : parseInt(newValue, 10);
                break;
            case 'readonly':
                this.readonly = newValue === 'true';
                break;
        }
        this.render();
    }

    setMonth(month: number) {
        this.month = month;
        this.setAttribute('month', month.toString());
    }

    setYear(year: number) {
        this.year = year;
        this.setAttribute('year', year.toString());
    }

    setEntries(entries: CalendarEntry[]) {
        this.entries = entries;
        this.setAttribute('entries', JSON.stringify(entries));
    }

    setSelectedMonth(selectedMonth: number | null) {
        this.selectedMonth = selectedMonth;
        this.setAttribute('selected-month', selectedMonth === null ? 'null' : selectedMonth.toString());
    }

    setReadonly(readonly: boolean) {
        this.readonly = readonly;
        this.setAttribute('readonly', readonly.toString());
    }

    getSelectedRequests(): CalendarEntry[] {
        return Array.from(this.selectedCells.entries()).map(([date, hours]) => ({
            date,
            hours,
            type: this.selectedPtoType || 'PTO'
        }));
    }

    clearSelection() {
        this.selectedPtoType = null;
        this.selectedCells.clear();
        this.render();
    }

    submitRequest() {
        const requests = this.getSelectedRequests();
        console.log('PtoCalendar.submitRequest called, requests:', requests);
        if (requests.length === 0) {
            console.log('No requests to submit');
            return;
        }

        const event = new CustomEvent('pto-request-submit', {
            detail: { requests },
            bubbles: true,
            composed: true
        });
        console.log('Dispatching pto-request-submit event from pto-calendar:', event);
        this.dispatchEvent(event);
    }

    private renderCalendar(): string {
        const firstDay = new Date(this.year, this.month, 1);
        const lastDay = new Date(this.year, this.month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        const calendarDays: { date: Date; isCurrentMonth: boolean; entry?: CalendarEntry }[] = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = this.entries.find(e => e.date === dateStr);
            calendarDays.push({
                date: new Date(d),
                isCurrentMonth: d.getMonth() === this.month,
                entry
            });
        }

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return `
            <div class="calendar">
                <div class="calendar-header">
                    ${monthNames[this.month]} ${this.year}
                </div>
                <div class="calendar-grid">
                    ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
                    ${calendarDays.map(({ date, isCurrentMonth, entry }) => {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const isSelected = this.selectedCells.has(dateStr);
            const selectedHours = this.selectedCells.get(dateStr) || 8;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayClass = entry ? `day type-${entry.type.replace(/\s+/g, '-')}` : (isSelected && this.selectedPtoType ? `day type-${this.selectedPtoType.replace(/\s+/g, '-')}` : 'day');
            const emptyClass = isCurrentMonth ? '' : 'empty';
            const selectedClass = isSelected ? 'selected' : '';
            const clickableClass = (!this.readonly && isCurrentMonth && !isWeekend) ? 'clickable' : '';
            const hoursDisplay = entry ? entry.hours.toFixed(0) : (isSelected ? selectedHours.toFixed(0) : '');
            const hoursElement = (!this.readonly && isSelected) ?
                `<input type="number" class="hours-input" value="${selectedHours}" min="0" max="8" step="4" data-date="${dateStr}">` :
                `<div class="hours">${hoursDisplay}</div>`;
            return `
                            <div class="${dayClass} ${emptyClass} ${selectedClass} ${clickableClass}" data-date="${dateStr}">
                                <div class="date">${date.getDate()}</div>
                                ${hoursElement}
                            </div>
                        `;
        }).join('')}
                </div>
                <div class="legend">
                    ${Object.entries(PTO_TYPE_COLORS).map(([type, color]) => `
                        <div class="legend-item ${this.selectedPtoType === type ? 'selected' : ''} ${this.readonly ? '' : 'clickable'}" data-type="${type}">
                            <div class="legend-swatch" style="background: ${color}"></div>
                            <span>${type}</span>
                        </div>
                    `).join('')}
                </div>
                ${this.readonly ? '' : '<div class="submit-slot"><slot name="submit"></slot></div>'}
            </div>
        `;
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                .calendar {
                    margin-top: 16px;
                }

                .calendar-header {
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }

                .weekday {
                    font-size: 11px;
                    font-weight: 600;
                    color: #6c757d;
                    text-align: center;
                }

                .day {
                    position: relative;
                    min-height: 50px;
                    border-radius: 6px;
                    background: #f8f9fa;
                    padding: 4px;
                    font-size: 12px;
                }

                .day.empty {
                    background: transparent;
                    border: none;
                }

                .day.clickable {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .day.clickable:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .day.selected {
                    border: 2px solid #007bff;
                    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
                }

                .day .date {
                    font-weight: 600;
                    color: #34495e;
                }

                .day .hours {
                    position: absolute;
                    bottom: 4px;
                    right: 6px;
                    font-size: 10px;
                    color: #2c3e50;
                }

                .day .hours-input {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 32px;
                    height: 14px;
                    font-size: 10px;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.5);
                    border-radius: 2px;
                    background: rgba(255,255,255,0.9);
                    color: #2c3e50;
                }

                .day .hours-input.invalid {
                    border-color: #dc3545;
                    background: #f8d7da;
                }

                .type-PTO { background: ${PTO_TYPE_COLORS.PTO}; }
                .type-Sick { background: ${PTO_TYPE_COLORS.Sick}; }
                .type-Bereavement { background: ${PTO_TYPE_COLORS.Bereavement}; }
                .type-Jury-Duty { background: ${PTO_TYPE_COLORS["Jury Duty"]}; }
                .type-Planned-PTO { background: ${PTO_TYPE_COLORS["Planned PTO"]}; }
                .type-Work-Day { background: ${PTO_TYPE_COLORS["Work Day"]}; border: 1px solid #e9ecef; }

                /* Make text white on colored backgrounds for better contrast */
                .type-PTO .date,
                .type-PTO .hours,
                .type-PTO .hours-input,
                .type-Sick .date,
                .type-Sick .hours,
                .type-Sick .hours-input,
                .type-Bereavement .date,
                .type-Bereavement .hours,
                .type-Bereavement .hours-input,
                .type-Jury-Duty .date,
                .type-Jury-Duty .hours,
                .type-Jury-Duty .hours-input,
                .type-Planned-PTO .date,
                .type-Planned-PTO .hours,
                .type-Planned-PTO .hours-input {
                    color: white;
                }

                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 12px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: #6c757d;
                }

                .legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .legend-item.clickable {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .legend-item.clickable:hover {
                    background: #f8f9fa;
                    transform: scale(1.05);
                }

                .legend-item.selected {
                    background: #e3f2fd;
                    border: 1px solid #2196f3;
                    font-weight: 600;
                }

                .legend-swatch {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    border: 1px solid #d0d7de;
                }

                .submit-slot {
                    margin-top: 16px;
                    text-align: center;
                }
            </style>
            ${this.renderCalendar()}
        `;
        this.attachEventListeners();
    }

    private attachEventListeners() {
        if (this.readonly) return;

        // Submit button clicks (handle slotted submit button)
        const submitSlot = this.shadow.querySelector('.submit-slot');
        if (submitSlot) {
            submitSlot.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' && target.textContent === 'Submit PTO Request') {
                    e.preventDefault();
                    this.submitRequest();
                }
            });
        }

        // Legend item clicks
        const legendItems = this.shadow.querySelectorAll('.legend-item.clickable');
        legendItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const type = (e.currentTarget as HTMLElement).dataset.type;
                if (type) {
                    this.selectedPtoType = this.selectedPtoType === type ? null : type;
                    this.render();
                }
            });
        });

        // Calendar cell clicks
        const calendarCells = this.shadow.querySelectorAll('.day.clickable');
        calendarCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                // Ignore clicks on input fields to prevent toggling when editing hours
                if ((e.target as HTMLElement).tagName === 'INPUT') {
                    return;
                }
                e.preventDefault();
                const date = (e.currentTarget as HTMLElement).dataset.date;
                if (date && this.selectedPtoType) {
                    // PTO request creation mode
                    if (this.selectedPtoType === 'Work Day') {
                        // Clear operation - remove any existing entry for this date
                        const existingEntryIndex = this.entries.findIndex(entry => entry.date === date);
                        if (existingEntryIndex >= 0) {
                            this.entries.splice(existingEntryIndex, 1);
                            this.setAttribute('entries', JSON.stringify(this.entries));
                        }
                        // Also clear from selected cells if it was selected
                        this.selectedCells.delete(date);
                        this.render();
                    } else {
                        // Normal PTO type selection
                        if (this.selectedCells.has(date)) {
                            this.selectedCells.delete(date);
                        } else {
                            // Check if there's an existing entry for this date and use its hours
                            const existingEntry = this.entries.find(entry => entry.date === date);
                            const defaultHours = existingEntry ? existingEntry.hours : 8;
                            this.selectedCells.set(date, defaultHours);
                        }
                        this.render();
                    }
                } else if (date && !this.readonly) {
                    // Hours editing mode - only allow editing existing entries
                    const existingEntry = this.entries.find(entry => entry.date === date);
                    if (existingEntry) {
                        // Allow editing existing entries
                        if (this.selectedCells.has(date)) {
                            this.selectedCells.delete(date);
                        } else {
                            this.selectedCells.set(date, existingEntry.hours);
                        }
                        this.render();
                    }
                    // Empty cells without PTO type selected do nothing (no notification needed)
                }
            });
        });

        // Hours input changes
        const hoursInputs = this.shadow.querySelectorAll('.hours-input');
        hoursInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const date = target.dataset.date;
                const value = parseFloat(target.value);
                if (date && !isNaN(value) && (value === 0 || value === 4 || value === 8)) {
                    if (value === 0) {
                        // Clear operation - remove the entry
                        const existingEntryIndex = this.entries.findIndex(entry => entry.date === date);
                        if (existingEntryIndex >= 0) {
                            this.entries.splice(existingEntryIndex, 1);
                            this.setAttribute('entries', JSON.stringify(this.entries));
                        }
                        // Also clear from selected cells
                        this.selectedCells.delete(date);
                        this.render();
                    } else {
                        // Check if this is an existing entry
                        const existingEntryIndex = this.entries.findIndex(entry => entry.date === date);
                        if (existingEntryIndex >= 0) {
                            // Update existing entry
                            this.entries[existingEntryIndex].hours = value;
                            this.setAttribute('entries', JSON.stringify(this.entries));
                        } else {
                            // Update selected cell
                            this.selectedCells.set(date, value);
                        }
                    }
                } else {
                    // Reset to previous value if invalid
                    const existingEntry = this.entries.find(entry => entry.date === date!);
                    const currentValue = existingEntry ? existingEntry.hours : this.selectedCells.get(date!);
                    target.value = currentValue?.toString() || '8';
                }
            });
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseFloat(target.value);
                if (isNaN(value) || (value !== 0 && value !== 4 && value !== 8)) {
                    target.classList.add('invalid');
                } else {
                    target.classList.remove('invalid');
                }
            });
        });
    }
}

customElements.define('pto-calendar', PtoCalendar);