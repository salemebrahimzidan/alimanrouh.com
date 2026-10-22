import { useEffect, useState, type PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n, i18nReady } from '../../features/rouh-aleman/app/i18n/i18n'
import { loadAndApplySiteCopy } from '../../lib/site-copy'

export function I18nProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    i18nReady
      .then(() => loadAndApplySiteCopy(i18n))
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])
  return (
    <I18nextProvider i18n={i18n}>
      <div className="contents" data-site-copy={ready ? 'ready' : 'default'}>
        {children}
      </div>
    </I18nextProvider>
  )
}

