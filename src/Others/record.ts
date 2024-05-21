import { delay, isCursor, isEditable, isClickable, containsHover, hasEditableContent, hasValueProperty, getCssSelector, getXPath, isVisualElement } from './utilities';
import { ipcRenderer } from 'electron';

// ------------------- GLOBAL VARIABLES -------------------
// Track current events and stuffs
let currentEvent = document.createEvent('Event');
let focusElement: HTMLElement; // Element that is currently focused
let checkMutation = false;
let change = false; // Change observed by mutation observer
let click = false;
let hover = false;
let input = false;

// Timers so events won't register too fast
let clickTimer: ReturnType<typeof setTimeout>;
let scrollTimer: ReturnType<typeof setTimeout>;
let hoverTimer: ReturnType<typeof setTimeout>;
let TIMEOUT: number = 250;

// ------------------- OBSERVERS -------------------
const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (click && checkMutation) { // Handle click event
            let mouseEvent = currentEvent as MouseEvent;
            let target = mouseEvent.target as HTMLElement;
            click = false;
            hover = false;
            change = false;

            let eventObject = {
                type: 'click',
                target: { css: getCssSelector(target), xpath: getXPath(target) },
                value: { x: mouseEvent.clientX, y: mouseEvent.clientY }
            };

            ipcRenderer.send('click-event', eventObject);
        } else if (hover && !click) { // Support for hover event
            change = true;
            delay(500).then(() => change = false);
        }
    });
});

// Observe the whole document body
const config = { attributes: true, childList: true, subtree: true, characterData: true };

// ------------------- EVENT HANDLERS -------------------
function registerClick(clickValue: boolean, checkMutationValue: boolean) {
    click = clickValue;
    checkMutation = checkMutationValue;
    delay(TIMEOUT).then(() => {
        click = false;
        checkMutation = false;
    });
}

function clickHandler(event: PointerEvent) {
    // Check if the event is made by user
    if (event.isTrusted) {
        currentEvent = event;
        let target = event.target as HTMLElement;
        let eventObject = {
            type: 'click',
            target: { css: getCssSelector(target), xpath: getXPath(target) },
            value: { x: event.clientX, y: event.clientY }
        };

        // Clicks on editable content
        if (isEditable(target)) {
            registerClick(true, false);
            ipcRenderer.send('click-event', eventObject);
            return;
        }

        // If pointer cursor or select element, return click event immediately
        if (isCursor(event, 'pointer') || isClickable(target)) {
            ipcRenderer.send('click-event', eventObject);
            return;
        }

        // Register click function called when not pointer cursor click, for observer to handle
        registerClick(true, true);
    }

}

// Window (whole web) scroll events
function windowScrollHandler() {
    // Clear any existing timeout
    clearTimeout(scrollTimer);

    // Set a timeout to detect scroll end
    scrollTimer = setTimeout(() => {
        ipcRenderer.send('scroll-event', { type: 'scroll', target: "window", value: { x: window.scrollX, y: window.scrollY } });
    }, TIMEOUT); // Adjust the delay as needed
}

// Small element scroll (div, textarea)
function scrollHandler(event: WheelEvent) {
    // Clear any existing timeout
    clearTimeout(scrollTimer);

    // Set a timeout to detect scroll end
    scrollTimer = setTimeout(() => {
        let target = event.target as HTMLElement;
        let eventObject = {
            type: 'scroll',
            target: { css: getCssSelector(target), xpath: getXPath(target) },
            value: { x: target.scrollLeft, y: target.scrollTop }
        }

        ipcRenderer.send('scroll-event', eventObject);
    }, TIMEOUT); // Adjust the delay as needed

}

function hoverHandler(event: MouseEvent) {
    if (click) return;
    let target = event.target as HTMLElement;
    if (target === document.body) return;
    let eventObject = {
        type: 'hover',
        target: { css: getCssSelector(target), xpath: getXPath(target) },
    };

    // Check if target class name contains "hover" keyword (thanks tailwind or similar)
    if (containsHover(target) || isClickable(target) || isVisualElement(target)) {
        currentEvent = event;
        clearTimeout(hoverTimer);

        hoverTimer = setTimeout(function () {
            ipcRenderer.send('hover-event', eventObject);
            //console.log("Hover element:", getCssSelector(event.target));
        }, TIMEOUT);
    } else if (isCursor(event, 'pointer')) {
        // Register hover only when pointer event (doesnt know if hover change styles or DOM)
        clearTimeout(hoverTimer);

        hover = true;
        hoverTimer = setTimeout(function () {
            // if new target is not parent of current target
            let currentTarget = currentEvent.target as HTMLElement;
            hover = !target.contains(currentTarget) || target === currentTarget;
            currentEvent = event;

            // If observer detect changes in DOM and styles, and mouse is hovering
            if (hover && change) {
                change = false;
                ipcRenderer.send('hover-event', eventObject);
            }
        }, TIMEOUT);
    }
}

function focusHandler(event: FocusEvent) {
    focusElement = event.target as HTMLElement;
}

function inputHandler(event: Event) {
    let target = event.target as HTMLElement;
    const keyboardInputTypes = ['text', 'password', 'number', 'email', 'tel', 'url', 'search'];

    if (target === focusElement) {
        if (hasValueProperty(target)) {
            let eventObject = {
                type: 'input',
                target: { css: getCssSelector(target), xpath: getXPath(target) },
                value: target.value
            };

            if (!(target instanceof HTMLInputElement) || keyboardInputTypes.includes(target.type)) {
                ipcRenderer.send('input-event', eventObject);
            }
        } else if (hasEditableContent(target)) {
            let eventObject = {
                type: 'input',
                target: { css: getCssSelector(target), xpath: getXPath(target) },
                value: target.textContent
            };

            ipcRenderer.send('input-event', eventObject);
        }
    }
}

function observeMutation() {
    mutationObserver.observe(document.body, config);
}

function disconnectObserver() {
    mutationObserver.disconnect();
}

export function record() {
    observeMutation();
    document.body.addEventListener('click', clickHandler, true);
    window.addEventListener('scroll', windowScrollHandler);
    document.body.addEventListener('scroll', scrollHandler, true);
    document.body.addEventListener('mouseenter', hoverHandler, true);
    document.body.addEventListener('change', inputHandler, true);
    document.body.addEventListener('focus', focusHandler, true);
}

export function stopRecording() {
    disconnectObserver();
    document.body.removeEventListener('click', clickHandler, true);
    window.removeEventListener('scroll', windowScrollHandler);
    document.body.removeEventListener('scroll', scrollHandler, true);
    document.body.removeEventListener('mouseenter', hoverHandler, true);
    document.body.removeEventListener('change', inputHandler, true);
    document.body.removeEventListener('focus', focusHandler, true);
}