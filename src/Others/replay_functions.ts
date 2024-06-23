import { ipcMain } from 'electron';
import { Channel } from "./listenerConst";
import { getView } from './electron_utilities';


export function handleReplayEvents(){

  // Input
  ipcMain.on(Channel.REPLAY_INPUT, async (event, data) => {

    let view = getView();
    //console.log('Inputer function called');
    //console.log(data);
    //console.log(data.x, data.y);
    //console.log(data.value);

    // Simulate key press for each character in data.value
    for (const char of data.value) {
      view.webContents.sendInputEvent({ type: 'char', keyCode: char });
    }
    console.log('Inputed' + data.value +  ' at ', data.x, data.y);
  });

  // Hover
  ipcMain.on(Channel.REPLAY_HOVER, async (event, data) => {
    //console.log('Hoverer function called');
    //console.log(data);
    //console.log(data.x, data.y);
    hoverEvent(data.x, data.y);
    console.log('Hovered at ' + data.x + ' ' + data.y)
  });

  // Click
  ipcMain.on(Channel.REPLAY_CLICK, async (event, data) => {

    //console.log('Clicker function called');
    //console.log(data);
    //console.log(data.x, data.y);
    let view = getView();

    //Hover over the element first
    hoverEvent(data.x, data.y);   

    // Click the element
    view.webContents.sendInputEvent({
      type: 'mouseDown',
      x: data.x,
      y: data.y,
      button: 'left',
      clickCount: 1
    });
    view.webContents.sendInputEvent({
      type: 'mouseUp',
      x: data.x,
      y: data.y,
      button: 'left',
      clickCount: 1
    });
    console.log('Clicked at ', data.x, data.y);
    
  });

  // Scroll
  ipcMain.on(Channel.REPLAY_SCROLL, async (event, data) => {

    //console.log('Scroller function called');
    //console.log('Scroll type: ', data.type);
    //console.log('Scrolling from cursor position ', data.currentX, data.currentY);
    
    let view = getView();

    // Send the mouseWheel event with the calculated deltaY to scroll
    if (data.type === 'vertical') {
    view.webContents.sendInputEvent({
      type: 'mouseWheel',
      x: data.currentX,
      y: data.currentY,
      deltaX: 0,
      deltaY: data.deltaY*-1, 
      canScroll: true
    });
    } else if (data.type === 'horizontal') {
      view.webContents.sendInputEvent({
        type: 'mouseWheel',
        x: data.currentX,
        y: data.currentY,
        deltaX: data.deltaX*-1,
        deltaY: 0, 
        canScroll: true
      });  
    }

    console.log('Scrolled to ', data);
  });
  
}


// Function used to simulate hover event
function hoverEvent(x: number, y: number) {
    let view = getView();
    view.webContents.sendInputEvent({
      type: 'mouseMove',
      x: x,
      y: y,
      movementX: 250,
      movementY: 250,
    });
}
