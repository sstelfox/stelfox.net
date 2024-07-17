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

window.addEventListener('DOMContentLoaded', () => {
  setupContainerIndicator();
  document.getElementById('container-menu').addEventListener('click', changeContainerVisibility);

  setupParameterIndicator();
  document.getElementById('parameter-menu').addEventListener('click', changeParameterVisibility);
});
