import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";
import { delay, getCssSelector, hasValueProperty } from "../Others/utilities";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;
let prevMouseX: number = 0;
let prevMouseY: number = 0;
let deltaScrollX: number = 0;
let deltaScrollY: number = 0;
const TIMEOUT = 250;

let hoverTimer: ReturnType<typeof setTimeout>;
let clickTimer: ReturnType<typeof setTimeout>;
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
            ipcRenderer.send(Channel.all.TEST_LOG, `Clicked object: ${clickedBbox}`);

            // Send the clicked element to main process
            ipcRenderer.send(Channel.view.record.CANVAS_CLICK, clickedBbox, mouseX, mouseY);

            handleAfterClick();
            retakeBbox();
        }
    }
}

function wheelHandler(event: WheelEvent) {
    deltaScrollX += event.deltaX;
    deltaScrollY += event.deltaY;
    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(() => {
        ipcRenderer.send(Channel.all.TEST_LOG, "Scrolled X: " + deltaScrollX + " Y: " + deltaScrollY);
        ipcRenderer.send(Channel.view.record.CANVAS_SCROLL, deltaScrollX, deltaScrollY, mouseX, mouseY);

        // Reset values
        deltaScrollX = 0;
        deltaScrollY = 0;
        retakeBbox();
    }, TIMEOUT);
}

function mouseTracker(event: MouseEvent) {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = event.clientX;
    mouseY = event.clientY;

    // Hover detection
    if (event.isTrusted) {
        const enteredBbox = findHoveredBox();
        if (enteredBbox) {
            clearTimeout(hoverTimer);

            hoverTimer = setTimeout(() => {
                if (enteredBbox.contains(mouseX, mouseY)) {
                    ipcRenderer.send(Channel.all.TEST_LOG, `Entered object: ${enteredBbox}`);

                    // Send the clicked element to main process
                    ipcRenderer.send(Channel.view.record.CANVAS_HOVER, enteredBbox, mouseX, mouseY);
                    retakeBbox();
                }
            }, TIMEOUT);
        }
    }
}

function changeHandler(event: Event) {
    const target = event.target as HTMLElement;
    if (hasValueProperty(target)) {
        ipcRenderer.send(Channel.all.TEST_LOG, `Entered value: ${target.value}`);
        ipcRenderer.send(Channel.view.record.CANVAS_INPUT, target.value);
    }
}

function findClickedBox() {
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].contains(mouseX, mouseY)) {
            return bboxes[i];
        }
    }
    return null;
}

function findHoveredBox() {
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].entered(prevMouseX, prevMouseY, mouseX, mouseY))
            return bboxes[i];
    }
    return null;
}

function handleAfterClick() {
    document.body.removeEventListener("mousemove", mouseTracker, true);
    delay(1000).then(() =>
        document.body.addEventListener("mousemove", mouseTracker, true)
    );
}

function retakeBbox() {
    bboxes = [];
    ipcRenderer.invoke(Channel.view.record.GET_BBOX).then((boundingBoxes: BoundingBox[]) => {
        setBBoxes(boundingBoxes);
    })
}

export function recordCanvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.addEventListener("click", clickHandler, true);
    document.body.addEventListener("mousemove", mouseTracker, true);
    window.addEventListener("wheel", wheelHandler, true);
    document.body.addEventListener("change", changeHandler, true);
}

export function stopRecordCanvas() {
    bboxes = [];
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
    window.removeEventListener("wheel", wheelHandler, true);
    document.body.removeEventListener("change", changeHandler, true);
}
