import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;

export function setBBoxes(boundingBoxes: BoundingBox[]) {
    bboxes = boundingBoxes;
}

function mouseTracker(event: MouseEvent) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function clickHandler(event: MouseEvent) {
    // Check if the event is made by user
    if (event.isTrusted) {
        ipcRenderer.send(Channel.TEST_LOG, bboxes);
        bboxes.forEach( (bbox) => {
            // ipcRenderer.send(Channel.TEST_LOG, bbox);

            if( bbox.contains(event.clientX, event.clientY) ) {
                ipcRenderer.send(Channel.TEST_LOG, "contains");
            } else {
                ipcRenderer.send(Channel.TEST_LOG, "not contains");
            }
        });
    };
}

export function record_canvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.addEventListener("mousemove", mouseTracker, true);
    document.body.addEventListener("click", clickHandler, true);
}

export function stopRecord_canvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
}