import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";
import { delay } from "../Others/utilities";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;
let prevMouseX: number = 0;
let prevMouseY: number = 0;
const TIMEOUT = 250;
const MOUSE_UPDATE_TIMEOUT = 1000;

let hoverTimer: ReturnType<typeof setTimeout>;
let clickTimer: ReturnType<typeof setTimeout>;
let scrollTimer: ReturnType<typeof setTimeout>;

let intervalId: NodeJS.Timeout;

function setBBoxes(boundingBoxes: BoundingBox[]) {
    bboxes = [];
    boundingBoxes.forEach((bbox) => {
        let tempBox = BoundingBox.replicateBBox(bbox);
        bboxes.push(tempBox);
    });
}

async function clickHandler(event: MouseEvent) {
    clearTimeout(clickTimer);

    // Check if the event is made by user
    clickTimer = setTimeout(async () => {
        if (event.isTrusted) {
            let clickedBbox = await isMouseInBoxes();

            if (clickedBbox) {
                ipcRenderer.send(Channel.TEST_LOG, `Clicked object: ${clickedBbox}`);
            }

            handleAfterClick();
        };

        retakeBbox();
    }, TIMEOUT);
}

async function hoverHandler(event: MouseEvent) {
    if (event.isTrusted) {
        let enteredBbox = await isMouseEnterBoxes();

        if (enteredBbox) {
            ipcRenderer.send(Channel.TEST_LOG, `Entered object: ${enteredBbox}`);
        }
    }
}

function wheelHandler(event: WheelEvent) {
    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(() => {
        ipcRenderer.send(Channel.TEST_LOG, "Scrolled X: " + event.deltaX + " Y: " + event.deltaY);
        retakeBbox();
    }, TIMEOUT);
}

function mouseTracker(event: MouseEvent) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(() => {
        hoverHandler(event);
    }, TIMEOUT);
}

function updateMousePosition() {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
}

async function isMouseInBoxes() {
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].contains(mouseX, mouseY)) {
            let base64image = await captureElementScreenshot(bboxes[i]);
            ipcRenderer.send(Channel.TEST_LOG, `image as base69: ${base64image}`);
            return bboxes[i];
        }
    }
    return null;
}

async function isMouseEnterBoxes() {
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].entered(prevMouseX, prevMouseY, mouseX, mouseY)) {
            let base64image = await captureElementScreenshot(bboxes[i]);
            ipcRenderer.send(Channel.TEST_LOG, `image as base69: ${base64image}`);
            return bboxes[i];
        }
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
    ipcRenderer.invoke(Channel.GET_BBOX).then((boundingBoxes: BoundingBox[]) => {
        setBBoxes(boundingBoxes);
    })
}

async function captureElementScreenshot(boundingBox: BoundingBox) {
    const base64image = await ipcRenderer.invoke(Channel.ELEMENT_SCREENSHOT, boundingBox);
    return base64image;
}

export function recordCanvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.addEventListener("mousemove", mouseTracker, true);
    document.body.addEventListener("click", clickHandler, true);
    window.addEventListener("wheel", wheelHandler, true);
    intervalId = setInterval(updateMousePosition, MOUSE_UPDATE_TIMEOUT);
}

export function stopRecordCanvas() {
    bboxes = [];
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
    window.removeEventListener("wheel", wheelHandler, true);
    clearInterval(intervalId);
}
