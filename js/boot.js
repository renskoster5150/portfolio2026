// Runs in <head> before the first paint, so keep it tiny.
//  - marks that JavaScript runs, so content can start hidden and animate in
//  - starts the second half of a page transition (see js/ui/transitions.js)
//  - safety net: if the modules never load, show everything after 3 seconds
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  try {
    var label = sessionStorage.getItem("transition");
    if (label !== null) {
      sessionStorage.removeItem("transition");
      root.setAttribute("data-transition-label", label);
      root.classList.add("is-arriving");
    }
  } catch (error) {
    // storage blocked: just skip the transition
  }

  setTimeout(function () {
    if (!window.siteReady) root.classList.add("no-motion");
  }, 3000);
})();
