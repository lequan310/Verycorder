import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;

let hoverTimer: ReturnType<typeof setTimeout>;
const HOVER_TIMEOUT = 250;

let clickTimer: ReturnType<typeof setTimeout>;
const CLICK_TIMEOUT = 250;

export function setBBoxes(boundingBoxes: BoundingBox[]) {
    boundingBoxes.forEach( (bbox) => {
        let tempBox = new BoundingBox(bbox.x1, bbox.x2, bbox.y1, bbox.y2);
        bboxes.push(tempBox);
    });
}

function mouseTracker(event: MouseEvent) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(() => {
        hoverHandler(event);
    }, HOVER_TIMEOUT);
}

function isMouseInBoxes(event: MouseEvent) {
    for(let i = 0; i < bboxes.length; i++) {
        if( bboxes[i].contains(event.clientX, event.clientY) ) {
            return true;
        }
    }
}

function clickHandler(event: MouseEvent) {
    clearTimeout(clickTimer);

    // Check if the event is made by user
    clickTimer = setTimeout(() => {
        if (event.isTrusted) {
            if( isMouseInBoxes(event) ) {
                ipcRenderer.send(Channel.TEST_LOG, "Clicked");
            }
        };

        retake_bbox();
    }, CLICK_TIMEOUT);
}

function hoverHandler(event: MouseEvent) {
    if (event.isTrusted) {
        if( isMouseInBoxes(event) ) {
            ipcRenderer.send(Channel.TEST_LOG, "Hovering");
        }
    };
}

function retake_bbox() {
    ipcRenderer.invoke("get-bbox").then((boundingBoxes: BoundingBox[]) => {
        setBBoxes(boundingBoxes);
    })
}

export function record_canvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.addEventListener("mousemove", mouseTracker, true);
    document.body.addEventListener("click", clickHandler, true);
}

export function stopRecord_canvas() {
    bboxes = [];
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
}