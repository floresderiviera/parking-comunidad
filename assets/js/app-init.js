const reportBootError = (error) => {
  const err =
    error instanceof Error
      ? error
      : new Error(
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : String(error ?? 'Error de inicialización')
        );

  console.error('[Parking Comunidad] boot error:', err);
  return err;
};

window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason) {
    reportBootError(event.reason);
  }
});

window.addEventListener('error', (event) => {
  const error = event?.error ?? new Error(event?.message || 'Error de inicialización');
  reportBootError(error);
});

window.__parkingAppErrorReporter = reportBootError;

if (typeof window.init === 'function') {
  window.init();
} else {
  console.warn('[Parking Comunidad] init no está definido; se omite el arranque.');
}
