(function () {
  'use strict';

  function initHomeViews() {
    var bar = document.querySelector('[data-home-view-bar]');
    var root = document.querySelector('[data-home-view-root]');
    if (!bar || !root) return;

    var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-home-view]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-home-view-panel]'));
    var allowedViews = buttons.map(function (button) {
      return button.getAttribute('data-home-view');
    });

    function setView(view, updateURL) {
      if (allowedViews.indexOf(view) === -1) view = 'default';

      buttons.forEach(function (button) {
        var active = button.getAttribute('data-home-view') === view;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.setAttribute('tabindex', active ? '0' : '-1');
      });

      panels.forEach(function (panel) {
        var active = panel.getAttribute('data-home-view-panel') === view;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });

      if (updateURL && window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        if (view === 'default') {
          url.searchParams.delete('view');
        } else {
          url.searchParams.set('view', view);
        }
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    }

    bar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-home-view]');
      if (!button) return;
      setView(button.getAttribute('data-home-view'), true);
    });

    bar.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      var currentIndex = buttons.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      event.preventDefault();
      var step = event.key === 'ArrowRight' ? 1 : -1;
      var nextIndex = (currentIndex + step + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      setView(buttons[nextIndex].getAttribute('data-home-view'), true);
    });

    var initialView = new URLSearchParams(window.location.search).get('view') || 'default';
    setView(initialView, false);
  }

  function initHomeCategories() {
    var filterBar = document.querySelector('[data-home-category-filter]');
    var panelsRoot = document.querySelector('[data-home-category-panels]');
    if (!filterBar || !panelsRoot) return;

    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('.category-filter-btn'));
    var panels = Array.prototype.slice.call(panelsRoot.querySelectorAll('.category-panel'));

    function activate(category) {
      buttons.forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-cat') === category);
      });
      panels.forEach(function (panel) {
        var active = panel.getAttribute('data-cat') === category;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    }

    filterBar.addEventListener('click', function (event) {
      var button = event.target.closest('.category-filter-btn');
      if (!button) return;
      activate(button.getAttribute('data-cat'));
    });

    var first = buttons[0];
    if (first) activate(first.getAttribute('data-cat'));
  }

  function init() {
    initHomeViews();
    initHomeCategories();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
