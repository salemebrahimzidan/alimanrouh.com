import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../features/rouh-aleman/auth/AuthProvider'
import { RouhAlemanRoutes } from '../../features/rouh-aleman/routes/rouh-aleman-routes'
import { I18nProvider } from '../providers/i18n-provider'
import { ThemeProvider } from '../providers/theme-provider'
import { QueryProvider } from '../providers/query-provider'

export function AppRoutes() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryProvider>
          <BrowserRouter>
            <AuthProvider>
              <RouhAlemanRoutes />
            </AuthProvider>
          </BrowserRouter>
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

