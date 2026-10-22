import { useTranslation } from 'react-i18next'

export function OffersPage() {
  const { t } = useTranslation('offers')

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-(--ra-border) bg-white p-6 shadow-(--ra-shadow)">
        <h1 className="text-2xl font-semibold text-(--ra-black)">{t('title')}</h1>
        <p className="mt-1 text-sm text-(--ra-muted)">{t('subtitle')}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-(--ra-border) bg-white p-6 shadow-(--ra-shadow)">
          <div className="text-sm font-semibold text-(--ra-black)">{t('seasonal.title')}</div>
          <p className="mt-1 text-sm text-(--ra-muted)">{t('seasonal.subtitle')}</p>
        </div>
        <div className="rounded-3xl border border-(--ra-border) bg-white p-6 shadow-(--ra-shadow)">
          <div className="text-sm font-semibold text-(--ra-black)">{t('cards.title')}</div>
          <p className="mt-1 text-sm text-(--ra-muted)">{t('cards.subtitle')}</p>
        </div>
      </section>
    </div>
  )
}
