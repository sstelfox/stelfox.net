function currentElVisibility(id) {
  return document
    .getElementById(id)
    .classList
    .contains('hidden') ? false : true;
}

function initElVisibility(id) {
  var savedCfgVis = sessionStorage.getItem('display-' + id) === 'true';
  setElVisibility(id, savedCfgVis);
}

function setElVisibility(id, tgtVisibility) {
  if (currentElVisibility(id) !== tgtVisibility) {
    console.log('Setting visibility of ' + id + ' to ' + tgtVisibility);

    document
      .getElementById(id)
      .classList.toggle('hidden');
  }

  sessionStorage.setItem('display-' + id, tgtVisibility);
}

function toggleElVisibility(id) {
  setElVisibility(id, !currentElVisibility(id));
}

window.addEventListener('DOMContentLoaded', () => {
  initElVisibility('page-details');

  document
    .getElementById('page-details-toggle')
    .addEventListener('click', () => toggleElVisibility('page-details'));
});
