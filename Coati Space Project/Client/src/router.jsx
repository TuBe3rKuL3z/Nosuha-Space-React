import { useSyncExternalStore } from 'react';

function subscribe(onChange) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function Link({ href, children, ...props }) {
  function navigate(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey ||
        (props.target && props.target !== '_self') || props.download !== undefined) {
      return;
    }

    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname && destination.hash)) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, '', destination);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (!destination.hash) window.scrollTo(0, 0);
  }

  return <a {...props} href={href} onClick={navigate}>{children}</a>;
}
