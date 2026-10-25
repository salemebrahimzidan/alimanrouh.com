import { createGuestSupportConversation, createOwnSupportConversation, type SupportTopic } from '../../../../lib/customer-data'
import { requireDb } from '../../../../lib/supabase'

const subjectByTopic: Record<SupportTopic, string> = {
  general: 'استفسار عام',
  contact: 'تواصل من الموقع',
  hajj: 'استفسار الحج',
  umrah: 'استفسار العمرة',
  booking: 'استفسار حجز',
  complaint: 'شكوى',
}

export async function submitContactForm(
  formData: FormData,
  options: { topic: SupportTopic; context: string | null },
): Promise<{ conversationId: string; guest: boolean }> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const body = String(formData.get('message') ?? '').trim()
  const subject = subjectByTopic[options.topic]
  const { data, error } = await requireDb().auth.getUser()
  if (error) throw error
  if (data.user) {
    const conversationId = await createOwnSupportConversation({
      subject,
      body,
      topic: options.topic,
      context: options.context,
    })
    return { conversationId, guest: false }
  }
  const conversationId = await createGuestSupportConversation({
    name,
    email,
    phone,
    subject,
    body,
    topic: options.topic,
    context: options.context,
  })
  return { conversationId, guest: true }
}
