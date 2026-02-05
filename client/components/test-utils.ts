/**
 * Lightweight DOM utility library for robust element queries with enhanced error logging.
 * Provides type-safe DOM manipulation with consistent error handling and debugging support.
 */

/**
 * Finds a single element by selector with error logging.
 * @param selector - CSS selector string
 * @returns The found element
 * @throws Error if element is not found
 */
export function querySingle<T extends HTMLElement>(selector: string): T {
    const item = document.querySelector<T>(selector);
    if (item) {
        console.log(`✅ Found ${selector} element:`, item);
        return item;
    } else {
        console.error(`❌ ${selector} element not found in DOM`);
        throw new Error(`${selector} element not found`);
    }
}

/**
 * Finds multiple elements by selector with error logging.
 * @param selector - CSS selector string
 * @returns Array of found elements
 * @throws Error if no elements are found
 */
export function queryMultiple<T extends HTMLElement>(selector: string): T[] {
    const items = Array.from(document.querySelectorAll<T>(selector));
    if (items.length > 0) {
        console.log(`✅ Found ${items.length} ${selector} elements`);
        return items;
    } else {
        console.error(`❌ No ${selector} elements found in DOM`);
        throw new Error(`No ${selector} elements found`);
    }
}

/**
 * Finds an element by ID with error logging.
 * @param id - Element ID (without # prefix)
 * @returns The found element
 * @throws Error if element is not found
 */
export function getElementById<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T;
    if (element) {
        console.log(`✅ Found element with ID '${id}':`, element);
        return element;
    } else {
        console.error(`❌ Element with ID '${id}' not found in DOM`);
        throw new Error(`Element with ID '${id}' not found`);
    }
}

/**
 * Safely adds an event listener to an element with error handling.
 * @param element - The element to attach the listener to
 * @param event - Event type
 * @param handler - Event handler function
 * @param options - Event listener options
 */
export function addEventListener<T extends Event = Event>(
    element: EventTarget,
    event: string,
    handler: (event: T) => void,
    options?: boolean | AddEventListenerOptions
): void {
    try {
        element.addEventListener(event, handler as EventListener, options);
        console.log(`✅ Added ${event} event listener to element:`, element);
    } catch (error) {
        console.error(`❌ Failed to add ${event} event listener:`, error);
        throw error;
    }
}

/**
 * Creates an element with optional attributes and error logging.
 * @param tagName - HTML tag name
 * @param attributes - Optional attributes object
 * @returns The created element
 */
export function createElement<T extends HTMLElement>(
    tagName: string,
    attributes?: Record<string, string>
): T {
    try {
        const element = document.createElement(tagName) as T;
        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        console.log(`✅ Created ${tagName} element with attributes:`, attributes);
        return element;
    } catch (error) {
        console.error(`❌ Failed to create ${tagName} element:`, error);
        throw error;
    }
}