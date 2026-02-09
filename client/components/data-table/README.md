# Data Table Component

## Overview

The Data Table component provides a sortable, paginated table for displaying tabular data with customizable columns, sorting, and pagination. It features responsive design, theme integration, and accessibility support.

## Features

- **Sortable Columns**: Click column headers to sort data ascending/descending
- **Pagination**: Navigate through large datasets with configurable page sizes
- **Customizable Columns**: Define column labels, widths, and sortability
- **Responsive Design**: Horizontal scrolling for mobile devices
- **Theme Integration**: Full support for light and dark themes
- **Accessibility**: Keyboard navigation and screen reader support
- **Empty State**: Handles empty data gracefully

## Usage

```html
<data-table
  data='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
  columns='[{"key": "name", "label": "Name", "sortable": true}, {"key": "age", "label": "Age", "sortable": true}]'
  page-size="10">
</data-table>
```

```javascript
const table = document.querySelector('data-table');
table.data = [
  { name: 'John', age: 30, department: 'Engineering' },
  { name: 'Jane', age: 25, department: 'Design' }
];
table.columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'department', label: 'Department', sortable: false }
];
```

## Attributes

- `data`: JSON string of array of objects to display
- `columns`: JSON string of column configuration array
- `page-size`: Number of rows per page (default: 10)

## Properties

- `data`: Array of objects to display in the table
- `columns`: Array of column configuration objects
- `pageSize`: Number of rows to display per page

## Column Configuration

```typescript
interface TableColumn {
  key: string;        // Object property key
  label: string;      // Display label
  sortable?: boolean; // Whether column is sortable (default: false)
  width?: string;     // CSS width value (optional)
}
```

## Events

- Sort changes trigger re-rendering with updated sort indicators
- Page navigation updates the displayed data subset

## Theming Implementation

### CSS Custom Properties Used

The component uses the following semantic color variables:

- `--color-surface`: Table background
- `--color-surface-hover`: Row hover states
- `--color-text`: Text color
- `--color-border`: Table borders and dividers
- `--color-shadow`: Table shadow
- `--color-primary`: Active sort indicator
- `--color-secondary`: Pagination button backgrounds
- `--color-secondary-hover`: Pagination button hover states

### Theme Integration

- Automatic adaptation to light/dark themes
- Consistent hover states and focus indicators
- Semantic color usage for accessibility

## Accessibility

- **Keyboard Navigation**: Tab navigation through sortable headers
- **Screen Readers**: Proper table semantics with headers
- **Focus Management**: Visible focus indicators on interactive elements
- **Semantic HTML**: Proper table structure with thead/tbody

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Reactive Updates**: Attribute changes trigger re-rendering
- **Memory Efficient**: Pagination reduces DOM nodes for large datasets
- **Type Safe**: TypeScript interfaces for data structures</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/data-table/README.md