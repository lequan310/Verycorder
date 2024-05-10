exports.INJECTION_SCRIPT = `
let currentEvent = document.body.querySelector('*');
let change = false;
let click;
let hover;
let clickTimer; // Timers so events won't register too fast
let scrollTimer;
let hoverTimer;
const TIMEOUT = 250;

// Select all elements on the page
const allElements = document.querySelectorAll('*');

//-------------------------------UTILITY FUNCTIONS---------------------------------
// function differentElementGroup(current, new) {
//   return current.target !== new.target  && !new.target.contains(current.target) && new.target.textContent !== current.target.textContent;
// }

//-------------------------------OBSERVERS---------------------------------

// Observer to detect changes in element's attributes, child, and subtree
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (click) { // Handle click event
      console.log('Clicked element:', currentEvent.target, ' | At coordinates:', currentEvent.clientX, currentEvent.clientY);
      click = false;
      hover = false;
    } else if (hover) { // Support for hover event
      change = true;
    }
  });
});

// Observe the whole document body
const config = { attributes: true, childList: true, subtree: true };
mutationObserver.observe(document.body, config);

//------------------------------CLICK EVENTS-------------------------------

// Check to see whether the current cursor is pointer
function isCursorPointer(event) {
  const computedStyle = window.getComputedStyle(event.target);
  return computedStyle.cursor === 'pointer';
}

function registerClick(event) {
  click = true;
  currentEvent = event;
  // clickTimer = setTimeout(function() {
  //   click = false;
  // }, 100);
}

document.body.addEventListener('click', (event) => {
  // Check if the event is made by user
  if (event.isTrusted) {
    if (isCursorPointer(event)) {
      console.log('Clicked element:', event.target, ' | At coordinates:', event.clientX, event.clientY);
      return;
    }

    // Register click function called when not pointer cursor click, for observer to handle
    registerClick(event);  
  }
}, true);

//------------------------------SCROLL EVENTS-------------------------------

// Window (whole web) scroll events
window.addEventListener('scroll', function(event) {
  // Clear any existing timeout
  clearTimeout(scrollTimer);

  // Set a timeout to detect scroll end
  scrollTimer = setTimeout(function() {
    console.log('Window scrolled:', window.scrollX, window.scrollY);
  }, TIMEOUT); // Adjust the delay as needed
});

// Smaller element scroll events (navbar, div, etc.)
allElements.forEach(function(element) {
  element.addEventListener('scroll', function() {
    // Clear any existing timeout
    clearTimeout(scrollTimer);

    // Set a timeout to detect scroll end
    scrollTimer = setTimeout(function() {
      console.log('Scrolled element:', element, ' | Scroll amount:', element.scrollLeft, ' ', element.scrollTop);
    }, TIMEOUT); // Adjust the delay as needed
    });
});

//------------------------------INPUT EVENTS-------------------------------



//------------------------------HOVER EVENTS-------------------------------

document.body.addEventListener('mouseover', (event) => {
  hover = true;
  clearTimeout(hoverTimer);

  hoverTimer = setTimeout(function() {
    // I hate edge cases
    // if (isCursorPointer(event)) {
    //   console.log("Hover element:", event.target);
    //   return;
    // }

    // if new target is not parent of current target
    hover = !event.target.contains(currentEvent.target) || event.target === currentEvent.target;
    currentEvent = event;

    // If observer detect changes in DOM and styles, and mouse is hovering
    if (hover && change) {
      change = false;
      console.log("Hover element:", event.target);
    }
  }, TIMEOUT);
}, true);
`