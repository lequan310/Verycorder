import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";
import {
    delay,
    getCssSelector,
    hasEditableContent,
    hasValueProperty,
} from "../Others/utilities";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;
let prevMouseX: number = 0;
let prevMouseY: number = 0;
let deltaScrollX: number = 0;
let deltaScrollY: number = 0;
const TIMEOUT = 250;

let hoverTimer: ReturnType<typeof setTimeout>;
let scrollTimer: ReturnType<typeof setTimeout>;

function setBBoxes(boundingBoxes: BoundingBox[]) {
    boundingBoxes.forEach((bbox) => {
        let tempBox = BoundingBox.replicateBBox(bbox);
        bboxes.push(tempBox);
    });
}

function clickHandler(event: MouseEvent) {
    if (event.isTrusted) {
        const clickedBbox = findClickedBox();

        if (clickedBbox) {
            ipcRenderer.send(
                Channel.all.TEST_LOG,
                `Clicked object: ${clickedBbox}`
            );

            // Send the clicked element to main process
            ipcRenderer.send(
                Channel.view.record.CANVAS_CLICK,
                clickedBbox,
                mouseX,
                mouseY
            );

            handleAfterClick();
        }

        retakeBbox();
    }
}

function wheelHandler(event: WheelEvent) {
    deltaScrollX += Math.round(event.deltaX);
    deltaScrollY += Math.round(event.deltaY);
    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(() => {
        ipcRenderer.send(
            Channel.all.TEST_LOG,
            "Scrolled X: " + deltaScrollX + " Y: " + deltaScrollY
        );
        ipcRenderer.send(
            Channel.view.record.CANVAS_SCROLL,
            deltaScrollX,
            deltaScrollY,
            mouseX,
            mouseY
        );

        // Reset values
        deltaScrollX = 0;
        deltaScrollY = 0;
        retakeBbox();
    }, TIMEOUT * 2);
}

function mouseTracker(event: MouseEvent) {
    const dpr = window.devicePixelRatio || 1;
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // ipcRenderer.send(Channel.all.TEST_LOG, `Mouse position: ${event.clientX}, ${event.clientY}, ${event.clientX * dpr}, ${event.clientY * dpr}`);
    mouseX = event.clientX * dpr;
    mouseY = event.clientY * dpr;

    // Hover detection
    if (event.isTrusted) {
        const enteredBbox = findHoveredBox();
        if (enteredBbox) {
            clearTimeout(hoverTimer);

            hoverTimer = setTimeout((box: BoundingBox) => {
                if (box.contains(mouseX, mouseY)) {
                    ipcRenderer.send(
                        Channel.all.TEST_LOG,
                        `Entered object: ${box}`
                    );

                    // Send the clicked element to main process
                    ipcRenderer.send(
                        Channel.view.record.CANVAS_HOVER,
                        box,
                        mouseX,
                        mouseY
                    );
                    retakeBbox();
                }
            }, TIMEOUT, enteredBbox);
        }
    }
}

function changeHandler(event: Event) {
    const target = event.target as HTMLElement;
    const cssSelector = getCssSelector(target);
    const keyboardInputTypes = [
        "text",
        "password",
        "number",
        "email",
        "tel",
        "url",
        "search",
    ];

    if (hasValueProperty(target)) {
        if (
            !(target instanceof HTMLInputElement) ||
            keyboardInputTypes.includes(target.type)
        ) {
            ipcRenderer.send(
                Channel.all.TEST_LOG,
                `Entered value: ${target.value}`
            );
            ipcRenderer.send(
                Channel.view.record.CANVAS_INPUT,
                cssSelector,
                target.value
            );
            retakeBbox();
        }
    } else if (hasEditableContent(target)) {
        ipcRenderer.send(
            Channel.all.TEST_LOG,
            `Entered value: ${target.textContent}`
        );
        ipcRenderer.send(
            Channel.view.record.CANVAS_INPUT,
            cssSelector,
            target.textContent
        );
        retakeBbox();
    }
}

function findClickedBox() {
    let clickedBbox = null;
    let topLevel = -1;
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].contains(mouseX, mouseY) && bboxes[i].level > topLevel) {
            clickedBbox = bboxes[i];
            topLevel = bboxes[i].level;
        }
    }
    return clickedBbox;
}

function findHoveredBox() {
    let topLevel = -1;
    let hoveredBbox = null;
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].entered(prevMouseX, prevMouseY, mouseX, mouseY) && bboxes[i].level > topLevel) {
            hoveredBbox = bboxes[i];
            topLevel = bboxes[i].level;
        }

    }
    return hoveredBbox;
}

function handleAfterClick() {
    document.body.removeEventListener("mousemove", mouseTracker, true);
    delay(1000).then(() =>
        document.body.addEventListener("mousemove", mouseTracker, true)
    );
}

function retakeBbox() {
    bboxes = [];
    ipcRenderer
        .invoke(Channel.view.record.GET_BBOX)
        .then((boundingBoxes: BoundingBox[]) => {
            setBBoxes(boundingBoxes);
        });
}

export function recordCanvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    window.addEventListener("click", clickHandler, true);
    window.addEventListener("mousemove", mouseTracker, true);
    window.addEventListener("wheel", wheelHandler, {
        passive: false,
        capture: true,
    });
    document.body.addEventListener("change", changeHandler, true);
}

export function stopRecordCanvas() {
    bboxes = [];
    window.removeEventListener("mousemove", mouseTracker, true);
    window.removeEventListener("click", clickHandler, true);
    window.removeEventListener("wheel", wheelHandler, true);
    document.body.removeEventListener("change", changeHandler, true);
}
