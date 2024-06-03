// Validate URL (TypeScript smh)
function canParse(url: string) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Validate URL input search bar
export function handleUrl(url: string) {
    if (canParse(url)) {
        return url;
    } else {
        const urlWithoutProtocol = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i;
        const isUrl = urlWithoutProtocol.exec(url);

        if (isUrl) {
            url = `http://` + url;
            return url;
        } else {
            return null;
        }
    }
}

// Wait for time (ms) and execute something
export function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Check to see whether the current cursor is the required type (click, )
export function isCursor(event: Event, type: string) {
    const target = event.target as HTMLElement;
    const computedStyle = window.getComputedStyle(target);
    return computedStyle.cursor === type;
}

// Check if element is editable
export function isEditable(element: HTMLElement) {
    let tag = element.tagName;
    const editableTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return editableTags.includes(tag) || element.isContentEditable;
}

// Check if element is clickable
export function isClickable(element: HTMLElement) {
    let tag = element.tagName;
    return tag === "BUTTON" || tag === "A";
}

export function isVisualElement(element: HTMLElement): boolean {
    let tag = element.tagName;
    const visualElementTypes = ['IMG', 'VIDEO', 'SVG'];
    return visualElementTypes.includes(tag);
}

// Check if element can be hovered
export function containsHover(element: HTMLElement) {
    if (!element) {
        return false;
    }

    // Check ID
    if (element.id && typeof element.id === 'string' && element.id.includes('hover')) {
        return true;
    }

    // Check class
    if (element.className && typeof element.className === 'string' && element.className.includes('hover')) {
        return true;
    }

    // Check attributes
    if (element.attributes) {
        for (let attr of element.attributes) {
            if (attr.name.includes('hover') || attr.value.includes('hover')) {
                return true;
            }
        }
    }

    return false;
}

// Has value property but only input element or textarea element
export function hasValueProperty(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement {
    return 'value' in element;
}

export function hasEditableContent(element: HTMLElement): element is HTMLElement & { contentEditable: string } {
    return element.contentEditable === "true";
}

// Function to get nth-value of class or tag
function getNthIndex(element: HTMLElement, value: string, isClass: boolean) {
    const parent = element.parentElement;
    var index = 1;
    var nthIndex = "";

    if (parent) {
        var child = isClass ? parent.getElementsByClassName(value) : parent.getElementsByTagName(value);
        var converted = Array.from(child);
        var filter = converted.filter(element => element.parentElement === parent);

        if (filter.length > 1) {
            for (let i = 0; i < filter.length; i++) {
                if (filter[i] === element) break;
                index++;
            }

            nthIndex = isClass ? ":nth-child(" : ":nth-of-type(";
            nthIndex += index + ")";
        }
    }

    return nthIndex;
}

// Add escape characters to special characters in selector
function escapeSpecialCharacters(selector: string) {
    return selector
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/:/g, '\\:');  // Escape colons
}

function replaceNumberCssSelector(input: string): string {
    return input.replace(/([.#])(\d)/g, '$1\\3$2');
}

// Get CSS Selector to locate element in the future
export function getCssSelector(element: HTMLElement) {
    const selectorParts = [];
    let currentElement = element;

    while (currentElement) {
        if (currentElement.id) {
            // If the element has an ID, use it to construct the selector
            selectorParts.unshift('#' + currentElement.id);
            break; // Stop traversal since IDs are unique
        } else if (currentElement.className && typeof currentElement.className === 'string') {
            // If the element has a class, use it to construct the selector
            const className = escapeSpecialCharacters(currentElement.className);
            const classes = className.trim().split(/\s+/);
            const classSelector = classes.map((className: string) => `.${className}`).join('');

            const elementList = document.body.getElementsByClassName(className);

            // If only 1 occurence of class name
            if (elementList.length === 1) {
                selectorParts.unshift(classSelector);
                break;
            }

            const elementArray = Array.from(elementList);
            const filteredArray = elementArray.filter((element: HTMLElement) => element.tagName.toLowerCase() === currentElement.tagName.toLowerCase());

            // If only 1 occurence of class name with that tag
            if (filteredArray.length === 1) {
                const newSelector = currentElement.tagName.toLowerCase() + classSelector;
                selectorParts.unshift(newSelector);
                break;
            }

            const nthIndex = getNthIndex(currentElement, className, true);
            selectorParts.unshift(classSelector + nthIndex);
        } else {
            // Use tag to construct the selector
            const tag = currentElement.tagName.toLowerCase();
            const nthIndex = getNthIndex(currentElement, tag, false);
            selectorParts.unshift(tag + nthIndex);
        }

        // Move up to the parent node
        currentElement = currentElement.parentElement;
    }

    return replaceNumberCssSelector(selectorParts.join(' > '));
}

// Get XPath selector to locate element in the future
// https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82
export function getXPath(element: HTMLElement) {
    // Selector
    let selector = '';
    // Loop handler
    let foundRoot;
    // Element handler
    let currentElement = element;

    // Do action until we reach html element
    do {
        // Get element tag name 
        const tagName = currentElement.tagName.toLowerCase();
        // Get parent element
        const parentElement = currentElement.parentElement;

        // Count children
        if (parentElement.childElementCount > 1) {
            // Get children of parent element
            const parentsChildren = [...parentElement.children];
            // Count current tag 
            let tag: Element[] = [];
            parentsChildren.forEach(child => {
                if (child.tagName.toLowerCase() === tagName) tag.push(child) // Append to tag
            })

            // Is only of type
            if (tag.length === 1) {
                // Append tag to selector
                selector = `/${tagName}${selector}`;
            } else {
                // Get position of current element in tag
                const position = tag.indexOf(currentElement) + 1;
                // Append tag to selector
                selector = `/${tagName}[${position}]${selector}`;
            }

        } else {
            //* Current element has no siblings
            // Append tag to selector
            selector = `/${tagName}${selector}`;
        }

        // Set parent element to current element
        currentElement = parentElement;
        // Is root  
        foundRoot = parentElement.tagName.toLowerCase() === 'html';
        // Finish selector if found root element
        if (foundRoot) selector = `/html${selector}`;
    }
    while (foundRoot === false);

    // Return selector
    return selector;
}