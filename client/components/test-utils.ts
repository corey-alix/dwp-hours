export function querySingle<T extends HTMLElement>(selector: string) {
    const item = document.querySelector<T>(selector);
    if (item) {
        console.log(`Found ${selector} element:`, item);
    } else {
        console.error(`${selector} element not found`);
        throw new Error(`${selector} element not found`);
    }
    return item;
}