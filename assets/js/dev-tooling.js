function setContainerVisibility(data) {
  var showContainer = data;
  var e = document.querySelector("#container-area");
  if (e.classList.contains("hidden") == showContainer) {
    e.classList.toggle("hidden");
  }
  sessionStorage.setItem("showContainer", showContainer);
}

function changeContainerVisibility() {
  var e = document.querySelector("#container-area");
  var showContainer = e.classList.contains("hidden") ? true : false;
  setContainerVisibility(showContainer);
}

/* load variables from session storage */
function setupContainerIndicator() {
  var showContainer = sessionStorage.getItem("showContainer") === "true";
  setContainerVisibility(showContainer);
}


function setParameterVisibility(data) {
  var showParameter = data;
  var e = document.querySelector("#parameter-area");
  if (e.classList.contains("hidden") == showParameter) {
    e.classList.toggle("hidden");
  }
  sessionStorage.setItem("showParameter", showParameter);
}

function changeParameterVisibility() {
  var e = document.querySelector("#parameter-area");
  var showParameter = e.classList.contains("hidden") ? true : false;
  setParameterVisibility(showParameter);
}

/* load variables from session storage */
function setupParameterIndicator() {
  var showParameter = sessionStorage.getItem("showParameter") === "true";
  setParameterVisibility(showParameter);
}


const padOptions = ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24", "32", "40", "48", "56", "64"];
const colOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const gapOptions = ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"];

/* helper function to remove a class attribute from an element */
function removeClassWith(e, part) {
  var regx = new RegExp('(^|\\s)\\S*' + part + '\\S*', 'g');
  e.className = e.className.replace(regx, '');
}

function setGridVisibility(data) {
  var showGrid = data;
  var e = document.querySelector("#grid-area");
  if (e.classList.contains("hidden") == showGrid) {
    e.classList.toggle("hidden");
  }

  sessionStorage.setItem("showGrid", showGrid);
}

function changeGridVisibility() {
  var e = document.querySelector("#grid-area");
  var showGrid = e.classList.contains("hidden") ? true : false;
  setGridVisibility(showGrid);
}

/* load variables from local storage */
function setupGridIndicator() {
  var showGrid = sessionStorage.getItem("showGrid") === "true";
  setGridVisibility(showGrid);
}

window.addEventListener('DOMContentLoaded', () => {
  setupContainerIndicator();
  document.getElementById('container-menu').addEventListener('click', changeContainerVisibility);

  setupParameterIndicator();
  document.getElementById('parameter-menu').addEventListener('click', changeParameterVisibility);

  setupGridIndicator();
  document.getElementById('grid-menu').addEventListener('click', changeGridVisibility);
});
