import { useTranslation } from 'react-i18next'
import { OfferCards } from '../../shared/ui/PublishedContent'

export function OffersPage() {
  const { t } = useTranslation('offers')

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-(--ra-border) bg-white p-6 shadow-(--ra-shadow)">
        <h1 className="text-2xl font-semibold text-(--ra-black)">{t('title')}</h1>
        <p className="mt-1 text-sm text-(--ra-muted)">{t('subtitle')}</p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-(--ra-black)">{t('seasonal.title')}</h2>
          <p className="mt-1 text-sm text-(--ra-muted)">{t('seasonal.subtitle')}</p>
        </div>
        <OfferCards />
      </section>
    </div>
  )
}
