import { useState } from 'react'
import { Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Navbar mark (update `LOGO_VERSION` when the asset file changes). */
const LOGO_VERSION = '6'
const LOGO_SRC = `/images/brand/logo-full.jpg?v=${LOGO_VERSION}`

type Props = {
  /** Beside brand name in desktop / stacked navbar */
  compact?: boolean
  /** Centered logo in the mobile navbar strip */
  mobileHeader?: boolean
  className?: string
}

const FRAME_BASE =
  'flex items-center justify-center overflow-hidden rounded-xl'

const FRAME_ELEVATED =
  'shadow-[0_2px_12px_rgba(6,51,39,0.06)] ring-1 ring-(--ra-border)/60'

function frameFor({ compact, mobileHeader }: Pick<Props, 'compact' | 'mobileHeader'>) {
  if (mobileHeader) {
    return 'h-12 w-12 p-0 sm:h-14 sm:w-14'
  }
  if (compact) {
    return 'h-12 w-12 p-0 xl:h-[4.5rem] xl:w-[4.5rem]'
  }
  return 'h-20 w-20 p-1 sm:h-[5.25rem] sm:w-[5.25rem] lg:h-24 lg:w-24 lg:p-1.5'
}

function frameStyle({ mobileHeader }: Pick<Props, 'mobileHeader'>) {
  // Mobile header: remove “card” look (no bg/ring/shadow).
  // Desktop/stacked header sits on a white surface — match it to avoid a visible “gap” color.
  return mobileHeader ? `${FRAME_BASE} bg-transparent` : `${FRAME_BASE} bg-white ${FRAME_ELEVATED}`
}

function intrinsicFor({ compact, mobileHeader }: Pick<Props, 'compact' | 'mobileHeader'>) {
  if (mobileHeader) return { width: 56, height: 56 }
  if (compact) return { width: 64, height: 64 }
  return { width: 96, height: 96 }
}

export function CompanyLogo({ compact, mobileHeader, className }: Props) {
  const { t } = useTranslation('shared')
  const [imgFailed, setImgFailed] = useState(false)
  const { width, height } = intrinsicFor({ compact, mobileHeader })
  const imgClass = 'max-h-full max-w-full object-contain object-center'

  return (
    <Link
      to="/"
      className={[
        'inline-flex shrink-0 items-center outline-none ring-(--ra-ring) transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-safe:hover:scale-[1.02] focus-visible:ring-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={t('brand.name')}
    >
      <div className={[frameStyle({ mobileHeader }), frameFor({ compact, mobileHeader })].join(' ')}>
        {!imgFailed ? (
          <img
            key={LOGO_SRC}
            src={LOGO_SRC}
            alt=""
            width={width}
            height={height}
            fetchPriority="high"
            decoding="async"
            className={imgClass}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Landmark
            className={
              mobileHeader || compact ? 'h-8 w-8 text-(--ra-green)' : 'h-10 w-10 text-(--ra-green)'
            }
            aria-hidden="true"
          />
        )}
      </div>
    </Link>
  )
}
