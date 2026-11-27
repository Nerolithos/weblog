(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-live-search]');
  if (!roots.length) return;

  var indexPromise = null;
  var MAX_RESULTS = 6;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('/index.json', { credentials: 'omit' }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }).then(function (data) {
        if (!Array.isArray(data)) throw new Error('Unexpected index format');
        return data;
      });
    }
    return indexPromise;
  }

  function normalize(text) {
    return String(text || '').normalize('NFKC').toLowerCase();
  }

  // Keep preview semantics identical to the full search page: exact units with AND matching.
  function splitExactQuery(query) {
    var matches = normalize(query).match(/[a-z0-9]+(?:[._+#-][a-z0-9]+)*|[\u3400-\u9fff]+/g) || [];
    return Array.from(new Set(matches.filter(Boolean)));
  }

  function containsExactUnit(text, unit) {
    var source = normalize(text);
    if (!unit) return false;
    if (/[\u3400-\u9fff]/.test(unit)) return source.indexOf(unit) !== -1;

    var from = 0;
    while (from <= source.length) {
      var index = source.indexOf(unit, from);
      if (index === -1) return false;
      var before = index > 0 ? source[index - 1] : '';
      var afterIndex = index + unit.length;
      var after = afterIndex < source.length ? source[afterIndex] : '';
      if (!(before && /[a-z0-9]/.test(before)) && !(after && /[a-z0-9]/.test(after))) return true;
      from = index + unit.length;
    }
    return false;
  }

  function searchableText(item) {
    var tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
    return [item.title, tags, item.summary, item.content].join(' ');
  }

  function scoreItem(item, query, units) {
    var title = normalize(item.title);
    var tags = normalize(Array.isArray(item.tags) ? item.tags.join(' ') : '');
    var summary = normalize(item.summary);
    var content = normalize(item.content);
    var queryNormalized = normalize(query).trim();
    var score = 0;

    if (title === queryNormalized) score += 100;
    else if (title.indexOf(queryNormalized) !== -1) score += 50;

    units.forEach(function (unit) {
      if (containsExactUnit(title, unit)) score += 18;
      if (containsExactUnit(tags, unit)) score += 10;
      if (containsExactUnit(summary, unit)) score += 6;
      if (containsExactUnit(content, unit)) score += 2;
    });
    return score;
  }

  function findSnippet(item, units) {
    var source = String(item.summary || item.content || '').replace(/\s+/g, ' ').trim();
    if (!source) return '';
    var lower = normalize(source);
    var position = -1;
    units.some(function (unit) {
      position = lower.indexOf(unit);
      return position !== -1;
    });
    if (position === -1) return source.slice(0, 110) + (source.length > 110 ? '…' : '');
    var start = Math.max(0, position - 34);
    var end = Math.min(source.length, position + 92);
    return (start ? '…' : '') + source.slice(start, end) + (end < source.length ? '…' : '');
  }

  function resultURL(permalink, query) {
    try {
      var url = new URL(permalink, window.location.origin);
      url.searchParams.set('hl', query);
      return url.toString();
    } catch (error) {
      return permalink;
    }
  }

  roots.forEach(function (root) {
    var form = root.querySelector('[data-live-search-form]');
    var input = root.querySelector('[data-live-search-input]');
    var panel = root.querySelector('[data-live-search-results]');
    var status = root.querySelector('[data-live-search-status]');
    var items = root.querySelector('[data-live-search-items]');
    var allLink = root.querySelector('[data-live-search-all]');
    var timer = 0;
    var renderVersion = 0;

    if (!form || !input || !panel || !status || !items || !allLink) return;

    function setExpanded(expanded) {
      panel.hidden = !expanded;
      input.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function clearPreview() {
      window.clearTimeout(timer);
      renderVersion += 1;
      items.replaceChildren();
      setExpanded(false);
    }

    function updateAllLink(query) {
      var url = new URL(form.action, window.location.origin);
      url.searchParams.set('q', query);
      allLink.href = url.toString();
      allLink.setAttribute('aria-label', '查看“' + query + '”的全部搜索结果');
    }

    function addResult(item, query, units) {
      var link = document.createElement('a');
      var title = document.createElement('span');
      var meta = document.createElement('span');
      var snippet = document.createElement('span');
      var arrow = document.createElement('span');

      link.className = 'home-live-search-item';
      link.href = resultURL(item.permalink, query);
      link.setAttribute('role', 'option');

      title.className = 'home-live-search-title';
      title.textContent = item.title || '未命名文章';

      meta.className = 'home-live-search-meta';
      var tags = Array.isArray(item.tags) ? item.tags.slice(0, 2).join(' · ') : '';
      meta.textContent = [item.date || '', tags].filter(Boolean).join(' · ');

      snippet.className = 'home-live-search-snippet';
      snippet.textContent = findSnippet(item, units);

      arrow.className = 'home-live-search-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';

      link.append(title, meta);
      if (snippet.textContent) link.append(snippet);
      link.append(arrow);
      items.append(link);
    }

    function render(query) {
      var trimmed = query.trim();
      var units = splitExactQuery(trimmed);
      var thisVersion = ++renderVersion;
      items.replaceChildren();

      if (!trimmed || !units.length) {
        setExpanded(false);
        return;
      }

      status.textContent = '正在查找…';
      updateAllLink(trimmed);
      setExpanded(true);

      loadIndex().then(function (data) {
        if (thisVersion !== renderVersion) return;
        var matches = data.filter(function (item) {
          var text = searchableText(item);
          return units.every(function (unit) { return containsExactUnit(text, unit); });
        }).map(function (item) {
          return { item: item, score: scoreItem(item, trimmed, units) };
        }).sort(function (a, b) {
          if (b.score !== a.score) return b.score - a.score;
          return String(b.item.date || '').localeCompare(String(a.item.date || ''));
        });

        items.replaceChildren();
        if (!matches.length) {
          status.textContent = '没有同时包含全部输入词语的文章。';
          allLink.hidden = true;
          return;
        }

        status.textContent = '找到 ' + matches.length + ' 篇，预览前 ' + Math.min(MAX_RESULTS, matches.length) + ' 篇';
        allLink.hidden = false;
        matches.slice(0, MAX_RESULTS).forEach(function (match) {
          addResult(match.item, trimmed, units);
        });
      }).catch(function () {
        if (thisVersion !== renderVersion) return;
        items.replaceChildren();
        status.textContent = '搜索索引暂时无法加载，请按回车进入搜索页重试。';
        allLink.hidden = false;
      });
    }

    function scheduleRender() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { render(input.value); }, 90);
    }

    input.addEventListener('input', scheduleRender);
    input.addEventListener('focus', function () {
      if (input.value.trim()) render(input.value);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        clearPreview();
        input.blur();
      } else if (event.key === 'ArrowDown' && !panel.hidden) {
        var first = items.querySelector('a');
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    items.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      var links = Array.from(items.querySelectorAll('a'));
      var current = links.indexOf(document.activeElement);
      if (current === -1) return;
      event.preventDefault();
      var next = event.key === 'ArrowDown' ? current + 1 : current - 1;
      if (next >= links.length) next = 0;
      if (next < 0) {
        input.focus();
      } else {
        links[next].focus();
      }
    });

    document.addEventListener('pointerdown', function (event) {
      if (!root.contains(event.target)) clearPreview();
    });
  });
})();
