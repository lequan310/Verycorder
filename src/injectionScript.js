exports.INJECTION_SCRIPT = `
// Track current events and stuffs
let currentEvent = document.createEvent('Event');
let currentURL = window.location.href;
let change = false;
let click = false;
let hover = false;

// Timing stuffs
let clickTimer; // Timers so events won't register too fast
let scrollTimer;
let hoverTimer;
let TIMEOUT = 250;

//-------------------------------UTILITY FUNCTIONS---------------------------------

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

// Get element without the children
function getElementWithoutChildren(element) {
  return element.cloneNode(false);
}

// Function to get nth-value of class or tag
function getNthIndex(element, value, isClass) {
  console.log("Value: ", value);
  const parent = element.parentElement;
  var index = 1;
  var nthIndex = "";

  if (parent) {
    var child = isClass ? parent.getElementsByClassName(value) : parent.getElementsByTagName(value);
    var converted = Array.from(child);
    var filter = converted.filter(element => element.parentElement === parent);

    if (filter.length > 1) {
      for (let i = 0; i < filter.length; i++) {
        if (filter[i] === element) break;
        index++;
      }

      nthIndex = isClass ? ":nth-child(" : ":nth-of-type(";
      nthIndex += index + ")";  
    }
  }

  return nthIndex;
}

function getCssSelector(element) {
  const selectorParts = [];
  let currentElement = element;

  while (currentElement) {
    if (currentElement.id) {
      // If the element has an ID, use it to construct the selector
      selectorParts.unshift('#' + currentElement.id);
      break; // Stop traversal since IDs are unique
    } else if (currentElement.className && typeof currentElement.className === 'string') {
      // If the element has a class, use it to construct the selector
      const className = currentElement.className;
      const classes = className.trim().split(/\\s+/);
      const classSelector = classes.map(className => \`\\.\${className}\`).join('');
      const nthIndex = getNthIndex(currentElement, className, true);
      selectorParts.unshift(classSelector + nthIndex);
    } else {
      // Use tag to construct the selector
      const tag = currentElement.tagName.toLowerCase();
      const parent = currentElement.parentElement;
      const nthIndex = getNthIndex(currentElement, tag, false);
      selectorParts.unshift(tag + nthIndex);
    }

    // Move up to the parent node
    currentElement = currentElement.parentElement;
  }

  return selectorParts.join(' > ');
}

// https://dev.to/abkarim/html-element-to-absolute-xpath-selector-javascript-4g82
function getXPath(element) {
  // Selector
  let selector = '';
  // Loop handler
  let foundRoot;
  // Element handler
  let currentElement = element;

  // Do action until we reach html element
  do {
    // Get element tag name 
    const tagName = currentElement.tagName.toLowerCase();
    // Get parent element
    const parentElement = currentElement.parentElement;

    // Count children
    if (parentElement.childElementCount > 1) {
      // Get children of parent element
      const parentsChildren = [...parentElement.children];
      // Count current tag 
      let tag = [];
      parentsChildren.forEach(child => {
        if (child.tagName.toLowerCase() === tagName) tag.push(child) // Append to tag
      })

      // Is only of type
      if (tag.length === 1) {
        // Append tag to selector
        selector = \`/\${tagName}\${selector}\`;
      } else {
        // Get position of current element in tag
        const position = tag.indexOf(currentElement) + 1;
        // Append tag to selector
        selector = \`/\${tagName}[\${position}]\${selector}\`;
      }

    } else {
      //* Current element has no siblings
      // Append tag to selector
      selector = \`/\${tagName}\${selector}\`;
    }

    // Set parent element to current element
    currentElement = parentElement;
    // Is root  
    foundRoot = parentElement.tagName.toLowerCase() === 'html';
    // Finish selector if found root element
    if(foundRoot) selector = \`/html\${selector}\`;
  }
  while (foundRoot === false);

  // Return selector
  return selector;
}

//-------------------------------OBSERVERS---------------------------------

// Observer to detect changes in element's attributes, child, and subtree
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (click) { // Handle click event
      click = false;
      hover = false;
      change = false;
      //console.log('Clicked element:', getElementWithoutChildren(currentEvent.target).outerHTML, ' | At coordinates:', currentEvent.clientX, currentEvent.clientY);
      console.log('Clicked element:', getCssSelector(currentEvent.target), ' | At coordinates:', currentEvent.clientX, currentEvent.clientY);
    } else if (hover) { // Support for hover event
      change = true;
      delay(500).then(() => change = false);
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

document.body.addEventListener('click', (event) => {
  // Check if the event is made by user
  if (event.isTrusted) {
    currentEvent = event;

    if (isCursorPointer(event)) {
      //console.log('Clicked element:', getElementWithoutChildren(event.target).outerHTML, ' | At coordinates:', event.clientX, event.clientY);
      console.log('Clicked element:', getCssSelector(event.target), ' | At coordinates:', event.clientX, event.clientY);
      return;
    }

    // Register click function called when not pointer cursor click, for observer to handle
    click = true;
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

// Small element scroll (div, textarea)
document.addEventListener('scroll', function(event) {
  // Clear any existing timeout
  clearTimeout(scrollTimer);

  // Set a timeout to detect scroll end
  scrollTimer = setTimeout(function() {
    //console.log('Scrolled element:', getElementWithoutChildren(event.target).outerHTML, ' | Scroll amount:', element.scrollLeft, ' ', element.scrollTop);
    console.log('Scrolled element:', getCssSelector(event.target), ' | Scroll amount:', element.scrollLeft, ' ', element.scrollTop);
  }, TIMEOUT); // Adjust the delay as needed
});

//------------------------------INPUT EVENTS-------------------------------



//------------------------------HOVER EVENTS-------------------------------

document.body.addEventListener('mouseenter', (event) => {
  if (currentURL !== window.location.href) {
    hover = false;
    change = false;
    delay(1000).then(() => currentURL = window.location.href);
    return;
  }

  // Check if target class name contains "hover" keyword (thanks tailwind or similar)
  if (typeof event.target.className === 'string' && event.target.className.includes('hover')) {
    clearTimeout(hoverTimer);
    
    hoverTimer = setTimeout(function() {
      // console.log("Hover element:", getElementWithoutChildren(event.target).outerHTML);
      console.log("Hover element:", getCssSelector(event.target));
      currentEvent = event;
    }, TIMEOUT);
  } else if (isCursorPointer(event)) {
    // Register hover only when pointer event (doesnt know if hover change styles or DOM)
    clearTimeout(hoverTimer);

    hover = true;
    hoverTimer = setTimeout(function() {
      // if new target is not parent of current target
      hover = !event.target.contains(currentEvent.target) || event.target === currentEvent.target;
      currentEvent = event;
    
      // If observer detect changes in DOM and styles, and mouse is hovering
      if (hover && change) {
        change = false;
        // console.log("Hover element:", getElementWithoutChildren(event.target).outerHTML);
        console.log("Hover element:", getCssSelector(event.target));
      }
    }, TIMEOUT);
  }
}, true);
`