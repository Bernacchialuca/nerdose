export function fontOf(el: Element | null): 'mono' | 'sans' | null {
  for (let node = el; node; node = node.parentElement) {
    if (node.classList.contains('font-mono')) return 'mono';
    if (node.classList.contains('font-sans')) return 'sans';
  }
  return null;
}
