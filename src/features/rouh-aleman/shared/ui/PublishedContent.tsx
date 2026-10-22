import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listPublishedContent, type PublicContent } from '../../../../lib/catalog'

function usePublishedContent() {
  const [rows, setRows] = useState<PublicContent[]>([])
  useEffect(() => {
    let active = true
    listPublishedContent()
      .then((items) => {
        if (active) setRows(items)
      })
      .catch(() => {
        if (active) setRows([])
      })
    return () => {
      active = false
    }
  }, [])
  return rows
}

function ContentCard({ item, action }: { item: PublicContent; action?: string }) {
  const body = (
    <>
      {item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-[16/7] w-full object-cover" /> : null}
      <div className="p-5 text-start">
        <h3 className="text-base font-bold text-(--ra-green)">{item.title}</h3>
        {item.body ? <p className="mt-2 text-sm leading-6 text-(--ra-muted)">{item.body}</p> : null}
        {item.linkUrl && action ? <span className="mt-4 inline-flex text-sm font-semibold text-(--ra-gold)">{action}</span> : null}
      </div>
    </>
  )
  const className = 'overflow-hidden rounded-2xl border border-(--ra-border) bg-white shadow-[0_14px_36px_-18px_rgba(6,51,39,0.35)]'
  if (!item.linkUrl) return <article className={className}>{body}</article>
  return (
    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className={`${className} block transition motion-safe:hover:-translate-y-0.5`}>
      {body}
    </a>
  )
}

export function HomePromos() {
  const rows = usePublishedContent()
  const announcements = rows.filter((item) => item.kind === 'announcement')
  const banners = rows.filter((item) => item.kind === 'banner')
  if (announcements.length === 0 && banners.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl space-y-4">
      {announcements.map((item) => {
        const body = (
          <>
            <h2 className="font-bold text-(--ra-green)">{item.title}</h2>
            {item.body ? <p className="mt-1 text-sm leading-6 text-(--ra-muted)">{item.body}</p> : null}
          </>
        )
        const className = 'block rounded-2xl border border-(--ra-gold)/40 bg-(--ra-gold)/10 px-5 py-4 text-start'
        return item.linkUrl ? (
          <a key={item.id} href={item.linkUrl} target="_blank" rel="noopener noreferrer" className={className}>{body}</a>
        ) : (
          <article key={item.id} className={className}>{body}</article>
        )
      })}
      {banners.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      ) : null}
    </section>
  )
}

export function OfferCards() {
  const { t } = useTranslation('offers')
  const offers = usePublishedContent().filter((item) => item.kind === 'offer')
  if (offers.length === 0) {
    return <p className="rounded-3xl border border-dashed border-(--ra-border) bg-white p-8 text-sm text-(--ra-muted)">{t('empty')}</p>
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {offers.map((item) => <ContentCard key={item.id} item={item} action={t('card.cta')} />)}
    </div>
  )
}
