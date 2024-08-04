import { ipcRenderer } from "electron";
import { BoundingBox } from "../Types/bbox";
import { Channel } from "../Others/listenerConst";
import { delay } from "../Others/utilities";

let bboxes: BoundingBox[] = [];
let mouseX: number = 0;
let mouseY: number = 0;
let isHovering: boolean = false; 
const TIMEOUT = 250;

let hoverTimer: ReturnType<typeof setTimeout>;
let clickTimer: ReturnType<typeof setTimeout>;
let scrollTimer: ReturnType<typeof setTimeout>;

function setBBoxes(boundingBoxes: BoundingBox[]) {
    bboxes = [];
    boundingBoxes.forEach( (bbox) => {
        let tempBox = new BoundingBox(bbox.x1, bbox.x2, bbox.y1, bbox.y2);
        bboxes.push(tempBox);
    });
}

function clickHandler(event: MouseEvent) {
    clearTimeout(clickTimer);

    // Check if the event is made by user
    clickTimer = setTimeout(() => {
        if (event.isTrusted) {
            if( isMouseInBoxes(event) ) {
                ipcRenderer.send(Channel.TEST_LOG, "Clicked");
            }

            handleAfterClick();
        };

        retakeBbox();
    }, TIMEOUT);
}

function hoverHandler(event: MouseEvent) {
    if (event.isTrusted) {
        if (!isHovering && isMouseInBoxes(event)) {
            ipcRenderer.send(Channel.TEST_LOG, "Hovered");
            isHovering = true;  // Set hover state to true when hover is triggered
        }
    }
}

function windowScrollHandler(event: Event) {
    // Clear any existing timeout
    clearTimeout(scrollTimer);

    // Set a timeout to detect scroll end
    scrollTimer = setTimeout(() => {
        ipcRenderer.send(Channel.TEST_LOG, `Window Scrolled X:${window.scrollX} Y:${window.scrollY}\nMouse position X: ${mouseX} Y: ${mouseY}`);
        retakeBbox();
    }, TIMEOUT);
}

// Small element scroll (div, textarea)
function scrollHandler(event: Event) {
    // Clear any existing timeout
    clearTimeout(scrollTimer);
  
    // Set a timeout to detect scroll end
    scrollTimer = setTimeout(() => {
        const target = event.target as HTMLElement;
        ipcRenderer.send(Channel.TEST_LOG, `Scrolled X:${target.scrollLeft} Y:${target.scrollTop}\nMouse position X: ${mouseX} Y: ${mouseY}`);
    }, TIMEOUT); // Adjust the delay as needed
}

function mouseTracker(event: MouseEvent) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(() => {
        hoverHandler(event);
    }, TIMEOUT);

    if (!isMouseInAnyBox(event)) {
        isHovering = false;
    }
}

function isMouseInBoxes(event: MouseEvent) {
    for(let i = 0; i < bboxes.length; i++) {
        if (bboxes[i].contains(event.clientX, event.clientY)) {
            captureElementScreenshot(bboxes[i]);
            return true;
        }
    }
}

function isMouseInAnyBox(event: MouseEvent) {
    return bboxes.some(bbox => bbox.contains(event.clientX, event.clientY));
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

function captureElementScreenshot(boundingBox: BoundingBox) {
    let width = boundingBox.x2 - boundingBox.x1;
    let height = boundingBox.y2 - boundingBox.y1;
    
    ipcRenderer.send(Channel.ELEMENT_SCREENSHOT, boundingBox.x1, boundingBox.y1, width, height); 
}

export function recordCanvas(boundingBoxes: BoundingBox[]) {
    setBBoxes(boundingBoxes);
    document.body.addEventListener("mousemove", mouseTracker, true);
    document.body.addEventListener("click", clickHandler, true);
    window.addEventListener("scroll", windowScrollHandler, true);
    document.body.addEventListener("scroll", scrollHandler, true);
}

export function stopRecordCanvas() {
    bboxes = [];
    document.body.removeEventListener("mousemove", mouseTracker, true);
    document.body.removeEventListener("click", clickHandler, true);
    window.removeEventListener("scroll", windowScrollHandler, true);
    document.body.removeEventListener("scroll", scrollHandler, true);
}
