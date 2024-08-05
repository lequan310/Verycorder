import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";
import { delay } from "../Others/utilities";

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
    clearTimeout(clickTimer);

    // Check if the event is made by user
    clickTimer = setTimeout(() => {
        if (event.isTrusted) {
            let clickedBbox = isMouseInBoxes();

            if (clickedBbox) {
                ipcRenderer.send(Channel.TEST_LOG, `Clicked object: ${clickedBbox}`);

                // This should be for receiving caption from OpenAI, printing here is just for debug
                let base64image = captureElementScreenshot(clickedBbox).then((base64image) => {
                    ipcRenderer.send(Channel.TEST_LOG, `Sent image to OpenAI`);
                });
            }

            handleAfterClick();
        };

        retakeBbox();
    }, TIMEOUT);
}

function wheelHandler(event: WheelEvent) {
    deltaScrollX += event.deltaX;
    deltaScrollY += event.deltaY;
    clearTimeout(scrollTimer);

    scrollTimer = setTimeout(() => {
        ipcRenderer.send(Channel.TEST_LOG, "Scrolled X: " + deltaScrollX + " Y: " + deltaScrollY);
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
    let enteredBbox: BoundingBox | null;

    // Hover detection
    if (event.isTrusted) {
        enteredBbox = isMouseEnterBoxes();
        if (enteredBbox) {
            clearTimeout(hoverTimer);

            hoverTimer = setTimeout(() => {
                ipcRenderer.send(Channel.TEST_LOG, `Entered object: ${enteredBbox}`);

                // This should be for receiving caption from OpenAI, printing here is just for debug
                let base64image = captureElementScreenshot(enteredBbox).then((base64image) => {
                    ipcRenderer.send(Channel.TEST_LOG, `Sent image to OpenAI`);
                });
                retakeBbox();
            }, TIMEOUT);
        }
    }
}

function isMouseInBoxes() {
    for (let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].contains(mouseX, mouseY)) {
            return bboxes[i];
        }
    }
    return null;
}

function isMouseEnterBoxes() {
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
}

export function stopRecordCanvas() {
    bboxes = [];
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
    window.removeEventListener("wheel", wheelHandler, true);
}
