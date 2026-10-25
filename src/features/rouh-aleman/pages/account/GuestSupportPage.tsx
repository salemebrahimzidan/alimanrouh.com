import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { errorText, formatDateTime } from '../../../../lib/customer-contract'
import {
  getGuestSupportConversation,
  getGuestSupportToken,
  sendGuestSupportReply,
  setGuestSupportToken,
  type GuestSupportConversation,
} from '../../../../lib/customer-data'

export function GuestSupportPage() {
  const { i18n } = useTranslation('account')
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const [searchParams] = useSearchParams()
  const conversationId = searchParams.get('id') ?? ''
  const [token, setToken] = useState(() => conversationId ? getGuestSupportToken(conversationId) : '')
  const [conversation, setConversation] = useState<GuestSupportConversation | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setError(language === 'ar' ? 'رابط المحادثة غير مكتمل.' : 'The conversation link is incomplete.')
      setLoading(false)
      return
    }
    try {
      setConversation(await getGuestSupportConversation(conversationId))
      setError('')
    } catch (err) {
      setError(errorText(err, language))
    } finally {
      setLoading(false)
    }
  }, [conversationId, language])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const interval = window.setInterval(() => void refresh(), 8000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
    }
  }, [refresh])

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await sendGuestSupportReply(conversationId, draft)
      setDraft('')
      await refresh()
    } catch (err) {
      setError(errorText(err, language))
    } finally {
      setSending(false)
    }
  }

  function saveAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setGuestSupportToken(conversationId, token)
      void refresh()
    } catch (err) {
      setError(errorText(err, language))
    }
  }

  async function copyAccessToken() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
    } catch (err) {
      setError(errorText(err, language))
    }
  }

  const isArabic = language === 'ar'
  return (
    <section className="mx-auto max-w-3xl space-y-5 py-8" dir={isArabic ? 'rtl' : 'ltr'}>
      <header>
        <h1 className="text-2xl font-bold text-(--ra-green)">{isArabic ? 'متابعة المحادثة' : 'Continue your conversation'}</h1>
        <p className="mt-2 text-sm text-(--ra-muted)">
          {isArabic ? 'تحديثات الردود تظهر تلقائياً خلال ثوانٍ.' : 'Replies are checked securely every few seconds.'}
        </p>
      </header>
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{error}</p>
          {!conversation ? (
            <form onSubmit={saveAccess} className="mt-3 flex flex-wrap gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block">{isArabic ? 'رمز المتابعة' : 'Access token'}</span>
                <input value={token} onChange={(event) => setToken(event.target.value)} minLength={64} maxLength={64} required className="w-full rounded-lg border border-red-200 px-3 py-2 font-mono text-xs" />
              </label>
              <button type="submit" className="self-end rounded-lg bg-(--ra-green) px-4 py-2 font-semibold text-white">
                {isArabic ? 'استعادة المحادثة' : 'Restore conversation'}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      {loading ? <p role="status" className="text-sm text-(--ra-muted)">{isArabic ? 'جارٍ التحميل...' : 'Loading...'}</p> : null}
      {conversation ? (
        <article className="overflow-hidden rounded-2xl border border-(--ra-border) bg-white shadow-sm">
          <header className="border-b border-(--ra-border) p-4">
            <h2 className="font-semibold text-(--ra-green)">{conversation.subject}</h2>
            <p className="mt-1 text-xs text-(--ra-muted)">
              {conversation.status === 'resolved'
                ? isArabic ? 'تم الحل' : 'Resolved'
                : conversation.status === 'in_progress'
                  ? isArabic ? 'قيد المتابعة' : 'In progress'
                  : isArabic ? 'جديد' : 'New'}
              {conversation.context ? ` · ${conversation.context}` : ''}
            </p>
            <button type="button" onClick={() => void copyAccessToken()} className="mt-2 text-xs font-semibold text-(--ra-green) underline">
              {copied
                ? isArabic ? 'تم نسخ رمز المتابعة' : 'Access token copied'
                : isArabic ? 'نسخ رمز المتابعة لحفظه بأمان' : 'Copy access token to save it securely'}
            </button>
          </header>
          <div className="max-h-[60vh] min-h-48 space-y-3 overflow-y-auto bg-(--ra-bg) p-4">
            {conversation.messages.map((message) => (
              <div key={message.id} className={`max-w-[90%] rounded-2xl p-3 ${message.sender === 'admin' ? 'ms-auto bg-(--ra-green) text-white' : 'me-auto border border-(--ra-border) bg-white'}`}>
                <p className="mb-1 text-[11px] font-semibold opacity-70">{message.sender === 'admin' ? (isArabic ? 'الإدارة' : 'Support') : (isArabic ? 'أنت' : 'You')}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                <time className="mt-2 block text-[10px] opacity-70" dir="ltr">{formatDateTime(message.created_at, language)}</time>
              </div>
            ))}
          </div>
          <form onSubmit={reply} className="flex gap-2 border-t border-(--ra-border) p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={5000}
              rows={2}
              required
              placeholder={isArabic ? 'اكتب ردك...' : 'Write a reply...'}
              className="min-w-0 flex-1 resize-y rounded-xl border border-(--ra-border) px-3 py-2 text-sm outline-none focus:border-(--ra-green)"
            />
            <button type="submit" disabled={sending || !draft.trim()} className="rounded-xl bg-(--ra-green) px-4 text-sm font-semibold text-white disabled:opacity-50">
              {sending ? (isArabic ? 'جارٍ الإرسال...' : 'Sending...') : (isArabic ? 'إرسال' : 'Send')}
            </button>
          </form>
        </article>
      ) : null}
      <Link to="/contact" className="inline-flex text-sm font-semibold text-(--ra-green) underline">
        {isArabic ? 'العودة إلى صفحة التواصل' : 'Back to contact'}
      </Link>
    </section>
  )
}
