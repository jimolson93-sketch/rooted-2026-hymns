(() => {
  const SWIPE_START_X = 18;
  const SWIPE_RATIO = 1.35;
  const COMMIT_RATIO = 0.45;
  const SETTLE_MS = 160;
  const SWIPE_FADE = 0.08;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchHymn = null;
  let adjacentHymn = null;
  let swipeViewport = null;
  let currentPanel = null;
  let nextPanel = null;
  let swipeDirection = 0;
  let horizontalGesture = false;
  let originalSearchValue = '';

  function visibleSingleHymn() {
    if (document.body.classList.contains('show-all-mode')) return null;
    const visible = Array.from(document.querySelectorAll('#hymns > .hymn.show')).filter(hymn =>
      getComputedStyle(hymn).display !== 'none'
    );
    return visible.length === 1 ? visible[0] : null;
  }

  function hymnNumber(hymn) {
    return hymn?.dataset.num || '';
  }

  function adjacentFor(current, direction) {
    const hymns = Array.from(document.querySelectorAll('#hymns > .hymn'));
    const index = hymns.indexOf(current);
    const nextIndex = index + direction;
    return index >= 0 && nextIndex >= 0 && nextIndex < hymns.length ? hymns[nextIndex] : null;
  }

  function clonePanel(hymn, className) {
    const panel = hymn.cloneNode(true);
    panel.classList.remove('show');
    panel.classList.add('swipe-panel', className);
    panel.removeAttribute('id');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.transform = '';
    panel.style.transition = '';
    return panel;
  }

  function buildSwipeViewport(current, destination, direction) {
    const rect = current.getBoundingClientRect();
    const styles = getComputedStyle(current);
    const viewport = document.createElement('div');
    viewport.className = 'hymn-swipe-viewport';
    viewport.style.left = `${rect.left}px`;
    viewport.style.top = `${Math.max(0, rect.top)}px`;
    viewport.style.width = `${rect.width}px`;
    viewport.style.height = `${Math.max(window.innerHeight - Math.max(0, rect.top), 1)}px`;
    viewport.style.borderRadius = styles.borderRadius;
    viewport.style.boxShadow = styles.boxShadow;

    const currentClone = clonePanel(current, 'swipe-panel-current');
    const nextClone = clonePanel(destination, 'swipe-panel-next');
    currentClone.style.transform = 'translate3d(0,0,0)';
    currentClone.style.opacity = '1';
    nextClone.style.transform = `translate3d(${direction > 0 ? 100 : -100}%,0,0)`;
    nextClone.style.opacity = `${1 - SWIPE_FADE}`;

    viewport.append(currentClone, nextClone);
    document.body.appendChild(viewport);
    current.classList.add('hymn-swipe-source-hidden');
    return { viewport, currentClone, nextClone };
  }

  function clearSwipeViewport() {
    swipeViewport?.remove();
    swipeViewport = null;
    currentPanel = null;
    nextPanel = null;
    if (touchHymn) touchHymn.classList.remove('hymn-swipe-source-hidden');
  }

  function updateSearchForProgress(progress) {
    const search = document.getElementById('searchInput');
    if (search) search.value = progress >= COMMIT_RATIO && adjacentHymn ? hymnNumber(adjacentHymn) : originalSearchValue;
  }

  function updatePanelFade(progress) {
    const eased = Math.min(1, Math.max(0, progress));
    if (currentPanel) currentPanel.style.opacity = `${1 - (SWIPE_FADE * eased)}`;
    if (nextPanel) nextPanel.style.opacity = `${(1 - SWIPE_FADE) + (SWIPE_FADE * eased)}`;
  }

  function resetSwipeState() {
    touchHymn = null;
    adjacentHymn = null;
    swipeDirection = 0;
    horizontalGesture = false;
  }

  function settleSwipe(commit) {
    if (!touchHymn || !currentPanel || !nextPanel) {
      clearSwipeViewport();
      resetSwipeState();
      return;
    }

    const destination = adjacentHymn;
    const search = document.getElementById('searchInput');
    currentPanel.style.transition = `transform ${SETTLE_MS}ms ease-out, opacity ${SETTLE_MS}ms ease-out`;
    nextPanel.style.transition = `transform ${SETTLE_MS}ms ease-out, opacity ${SETTLE_MS}ms ease-out`;

    if (!commit || !destination) {
      currentPanel.style.transform = 'translate3d(0,0,0)';
      currentPanel.style.opacity = '1';
      nextPanel.style.transform = `translate3d(${swipeDirection > 0 ? 100 : -100}%,0,0)`;
      nextPanel.style.opacity = `${1 - SWIPE_FADE}`;
      if (search) search.value = originalSearchValue;
      setTimeout(() => {
        clearSwipeViewport();
        resetSwipeState();
      }, SETTLE_MS);
      return;
    }

    currentPanel.style.transform = `translate3d(${swipeDirection > 0 ? -100 : 100}%,0,0)`;
    currentPanel.style.opacity = `${1 - SWIPE_FADE}`;
    nextPanel.style.transform = 'translate3d(0,0,0)';
    nextPanel.style.opacity = '1';
    if (search) search.value = hymnNumber(destination);

    setTimeout(() => {
      const number = Number(hymnNumber(destination));
      clearSwipeViewport();
      resetSwipeState();
      window.ROOTED_SHOW_HYMN?.(number, 'auto');
    }, SETTLE_MS);
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    const hymn = event.target.closest('#hymns > .hymn.show');
    const single = visibleSingleHymn();
    if (!hymn || hymn !== single) {
      resetSwipeState();
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchHymn = hymn;
    originalSearchValue = document.getElementById('searchInput')?.value || hymnNumber(hymn);
  }

  function handleTouchMove(event) {
    if (!touchHymn || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - touchStartX;
    const dy = event.touches[0].clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!horizontalGesture) {
      if (absX < SWIPE_START_X) return;
      if (absX < absY * SWIPE_RATIO) {
        touchHymn = null;
        return;
      }
      swipeDirection = dx < 0 ? 1 : -1;
      adjacentHymn = adjacentFor(touchHymn, swipeDirection);
      if (!adjacentHymn) {
        touchHymn = null;
        return;
      }
      horizontalGesture = true;
      const built = buildSwipeViewport(touchHymn, adjacentHymn, swipeDirection);
      swipeViewport = built.viewport;
      currentPanel = built.currentClone;
      nextPanel = built.nextClone;
    }

    event.preventDefault();
    const width = swipeViewport?.getBoundingClientRect().width || window.innerWidth;
    const limitedDx = swipeDirection > 0 ? Math.max(-width, Math.min(0, dx)) : Math.min(width, Math.max(0, dx));
    const percent = (limitedDx / width) * 100;
    const progress = Math.abs(limitedDx) / width;
    currentPanel.style.transform = `translate3d(${percent}%,0,0)`;
    nextPanel.style.transform = `translate3d(${(swipeDirection > 0 ? 100 : -100) + percent}%,0,0)`;
    updatePanelFade(progress);
    updateSearchForProgress(progress);
  }

  function handleTouchEnd(event) {
    if (!touchHymn) return;
    if (!horizontalGesture || event.changedTouches.length !== 1) {
      const search = document.getElementById('searchInput');
      if (search) search.value = originalSearchValue;
      clearSwipeViewport();
      resetSwipeState();
      return;
    }
    const width = swipeViewport?.getBoundingClientRect().width || window.innerWidth;
    const progress = Math.abs(event.changedTouches[0].clientX - touchStartX) / width;
    settleSwipe(progress >= COMMIT_RATIO);
  }

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', () => settleSwipe(false), { passive: true });
})();
