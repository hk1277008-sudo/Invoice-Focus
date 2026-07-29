type DiagnosticDetails = Record<string, unknown>

const diagnosticPrefix = '[InvoiceFocus Auth Diagnostics]'

export function logAuthDiagnostic(event: string, details: DiagnosticDetails = {}) {
  if (!import.meta.env.DEV) return
  console.groupCollapsed(`${diagnosticPrefix} ${event}`)
  console.log({
    event,
    timestamp: new Date().toISOString(),
    ...details,
  })
  console.groupEnd()
}

// Kept as an alias for the temporary signup instrumentation.
export const logSignupDiagnostic = logAuthDiagnostic

export function installDevelopmentDiagnostics() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return

  const diagnosticWindow = window as Window & { __invoiceFocusDiagnosticsInstalled?: boolean }
  if (diagnosticWindow.__invoiceFocusDiagnosticsInstalled) return
  diagnosticWindow.__invoiceFocusDiagnosticsInstalled = true

  window.addEventListener('unhandledrejection', (event) => {
    logSignupDiagnostic('unhandled promise rejection', {
      reason: event.reason,
    })
  })

  window.addEventListener('error', (event) => {
    logSignupDiagnostic('browser error', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
    })
  })
}