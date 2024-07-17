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

function setupContainerIndicator() {
    /* load variables from session storage */
    var showContainer = sessionStorage.getItem("showContainer") === "true";

    setContainerVisibility(showContainer);
}

window.addEventListener("load", setupContainerIndicator);
