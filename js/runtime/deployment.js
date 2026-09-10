// Check before importing the large planner graph. Offline, private storage, or
// a failed probe do not prevent startup. This is not offline/PWA support.
// No storage is required for version detection.
export async function deploymentChanged(document, {timeout = 2000} = {}) {
  const current = document.querySelector('meta[name="planner-release"]')?.content;
  if (!current) return false; // Unstamped development/test document.
  const window = document.defaultView;
  const url = new URL('./deployment.json', document.baseURI);
  const controller = new window.AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await window.fetch(url, {cache: 'no-store', credentials: 'same-origin', signal: controller.signal});
    if (!response.ok) return false;
    const {version} = await response.json();
    if (typeof version !== 'string' || !/^[0-9a-f]{64}$/.test(version) || version === current) return false;
    const target = new URL(window.location.href);
    // A proxy returning old HTML even for the new URL must not cause a loop.
    if (target.searchParams.get('_v') === version) return false;
    target.searchParams.delete('_cache_check');
    target.searchParams.set('_v', version);
    window.location.replace(target.href);
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
