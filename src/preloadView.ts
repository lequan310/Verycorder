// THIS IS THE SCRIPT FOR THE RECORDING FEATURE (IN ISOLATED WORLD)
import { ipcRenderer } from 'electron';
import { delay, isCursor, isEditable, isClickable, containsHover, hasEditableContent, hasValueProperty, getCssSelector, getXPath } from './Others/utilities';

window.addEventListener('load', () => {
    if (window.location.href.includes('about:blank')) return;

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
    mutationObserver.observe(document.body, config);

    // ------------------- CLICK EVENT LISTENERS -------------------
    function registerClick(clickValue: boolean, checkMutationValue: boolean) {
        click = clickValue;
        checkMutation = checkMutationValue;
        delay(TIMEOUT).then(() => {
            click = false;
            checkMutation = false;
        });
    }

    document.body.addEventListener('click', (event: PointerEvent) => {
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
    }, true);

    // ------------------- SCROLL EVENT LISTENERS -------------------
    // Window (whole web) scroll events
    document.body.addEventListener('scroll', () => {
        // Clear any existing timeout
        clearTimeout(scrollTimer);

        // Set a timeout to detect scroll end
        scrollTimer = setTimeout(() => {
            ipcRenderer.send('scroll-event', { type: 'scroll', target: "window", value: { x: window.scrollX, y: window.scrollY } });
        }, TIMEOUT); // Adjust the delay as needed
    });

    // Small element scroll (div, textarea)
    document.body.addEventListener('scroll', (event: WheelEvent) => {
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
    }, true);

    // ------------------- HOVER EVENT LISTENERS -------------------
    document.body.addEventListener('mouseenter', (event) => {
        let target = event.target as HTMLElement;
        let eventObject = {
            type: 'hover',
            target: { css: getCssSelector(target), xpath: getXPath(target) },
        };

        // Check if target class name contains "hover" keyword (thanks tailwind or similar)
        if (containsHover(target) || isClickable(target)) {
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
    }, true);

    // // ------------------- INPUT EVENT LISTENERS -------------------
    // Handle focusing input (text or equivalent)
    document.body.addEventListener('focus', (event: FocusEvent) => {
        focusElement = event.target as HTMLElement;
    }, true);

    // Handle change when not losing focus
    document.body.addEventListener('change', (event: Event) => {
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
    }, true);
});