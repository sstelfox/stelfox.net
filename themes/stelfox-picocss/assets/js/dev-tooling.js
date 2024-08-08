function currentElVisibility(id) {
  return document
    .getElementById(id)
    .classList
    .contains('hidden') ? true : false;
}

function initElVisibility(id) {
  var savedCfgVis = sessionStorage.getItem('display-' + id) === 'true';
  setElVisibility(id, savedCfgVis);
}

function setElVisibility(id, tgtVisibility) {
  var tgtEl = document.getElementById(id);

  if (currentElVisibility(id) !== tgtVisibility) {
    tgtEl.classList.toggle('hidden');
  }

  sessionStorage.setItem('display-' + id, tgtVisibility);
}

function toggleElVisibility(id) {
  setElVisibility(id, !currentElVisibility(id));
}

window.addEventListener('DOMContentLoaded', () => {
  initElVisibility('page-details');

  document
    .getElementById('page-details-toggle-btn')
    .addEventListener('click', () => toggleElVisibility('page-details'));
});
