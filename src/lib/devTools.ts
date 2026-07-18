/**
 * Developer testing utilities are visible only when running a Vite dev build
 * AND the URL includes ?devtools=1
 */
export function isDevToolsEnabled(search: string = window.location.search): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(search).get('devtools') === '1';
}
