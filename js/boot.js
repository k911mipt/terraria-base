import { deploymentChanged } from './runtime/deployment.js';

// The import map in HTML versions every dependency, not merely this bootstrap.
export async function boot(document) {
  if (await deploymentChanged(document)) return;
  const entry = document.querySelector('script[data-planner-entry]')?.dataset.plannerEntry;
  if (!/^\.\/js\/entries\/(?:main|desert|underground|jungle)\.js$/.test(entry || ''))
    throw new Error('Unknown planner entry');
  return import(new URL(entry, document.baseURI).href);
}

if (typeof document !== 'undefined') {
  boot(document).catch(error => {
    document.getElementById('viewport')?.removeAttribute('data-ready');
    // Keep more specific material/object diagnostics written by the startup guard.
    const name = document.getElementById('iname');
    if (name && !name.textContent.startsWith('Ошибка')) {
      name.textContent = 'Ошибка загрузки планировщика';
      document.getElementById('idesc').textContent = 'Обновите страницу после восстановления ресурсов.';
      document.getElementById('ikv').textContent = error.message;
    }
    throw error;
  });
}
