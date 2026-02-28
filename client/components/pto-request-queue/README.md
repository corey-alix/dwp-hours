# PTO Request Queue Component

## Overview

The PTO Request Queue component displays a queue of PTO requests for administrative review. It shows pending, approved, and rejected requests with action buttons for approval/rejection workflows.

## Features

- **Request Management**: Display all PTO requests with status tracking
- **Administrative Actions**: Approve/reject buttons for pending requests
- **Status Filtering**: Focus on pending requests while showing all statuses
- **Request Details**: Comprehensive request information display
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes

## Usage

```html
<pto-request-queue
  requests='[{"id": 1, "employeeId": 1, "employeeName": "John Doe", "startDate": "2024-02-01", "endDate": "2024-02-05", "type": "PTO", "hours": 40, "status": "pending", "createdAt": "2024-01-25"}]'
>
</pto-request-queue>
```

```javascript
const queue = document.querySelector("pto-request-queue");
queue.requests = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "John Doe",
    startDate: "2024-02-01",
    endDate: "2024-02-05",
    type: "PTO",
    hours: 40,
    status: "pending",
    createdAt: "2024-01-25",
  },
];

// Listen for approval/rejection events
queue.addEventListener("request-approved", (event) => {
  console.log("Approved request:", event.detail);
});
```

## Attributes

- `requests`: JSON array of PTO request objects

## Properties

- `requests`: Array of PTORequest objects

## Data Structure

```typescript
type PTORequest = {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string; // ISO date string
};
```

## Events

- `request-approve`: Fired when approve button is clicked (detail: `{ requestId, requestIds }`)
- `request-reject`: Fired when reject button is clicked (detail: `{ requestId, requestIds }`)
- `calendar-data-request`: Dispatched when the user opens an inline calendar or navigates to a different month (detail: `{ employeeId: number, month: string }`). The parent page should listen for this event, fetch PTO entries for the given employee and month, and inject them back via `setCalendarEntries()`.

## Methods

### `setCalendarEntries(employeeId: number, month: string, entries: PTOEntry[])`

Injects PTO entry data into the inline calendar for a specific employee. Called by the parent page after handling a `calendar-data-request` event. The `entries` array should match the `PTOEntry` interface from `pto-calendar/index.ts`.

### `dismissCard(requestId: number): Promise<void>`

Animates a request card out of view (dismiss effect). Called by the parent page after approve/reject.

### `expandedCalendars: Map<number, string>` (getter)

Returns a map of employee IDs to their currently displayed month (`YYYY-MM`) for all expanded inline calendars. Used by the parent page to re-fetch calendar data after a data refresh.

## Features

- **Status Overview**: Shows counts of pending, approved, and rejected requests
- **Request Cards**: Detailed display of each request with employee info
- **Action Buttons**: Approve/reject buttons for pending requests
- **Date Formatting**: User-friendly date display
- **Type Indicators**: Visual indicators for different PTO types

## Theming Implementation

### CSS Custom Properties Used

- `--color-surface`: Container backgrounds
- `--color-text`: Primary text color
- `--color-border`: Borders and dividers
- `--color-primary`: Action buttons
- `--color-success`: Approved status indicators
- `--color-error`: Rejected status indicators
- `--color-warning`: Pending status indicators
- `--shadow-sm`: Card shadows

### Theme Integration

- Consistent with admin panel styling
- Status-based color coding
- Automatic light/dark theme adaptation

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Event Delegation**: Efficient event handling for action buttons
- **Reactive Updates**: Updates when requests data changes
- **Status Filtering**: Prioritizes pending requests in display
- **Type Safety**: Full TypeScript interfaces for request data</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-request-queue/README.md
