let backendUnavailable = false;

export function markBackendUnavailable() {
  backendUnavailable = true;
}

export function clearBackendUnavailable() {
  backendUnavailable = false;
}

export function isBackendUnavailable() {
  return backendUnavailable;
}
