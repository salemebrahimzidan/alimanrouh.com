import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authRedirectUrl,
  bookingInsertRow,
  customerNote,
  customerSignUpPayload,
  errorText,
  registrationMetadata,
  safeNextPath,
  travelersCount,
} from '../src/lib/customer-contract.ts'

test('registration metadata is only the name and mobile the profile trigger reads', () => {
  const metadata = registrationMetadata('  سارة أحمد  ', '  +966507075933  ')
  assert.deepEqual(metadata, { full_name: 'سارة أحمد', mobile: '+966507075933' })
  assert.deepEqual(Object.keys(metadata), ['full_name', 'mobile'])
  const payload = customerSignUpPayload(
    { fullName: 'سارة', mobile: '+966507075933', email: 'sara@example.com', password: 'secret-pass' },
    'https://alimanrouh.com',
  )
  assert.equal(payload.options.emailRedirectTo, 'https://alimanrouh.com/account')
  assert.equal(JSON.stringify(payload).includes('role'), false)
  assert.equal(JSON.stringify(payload).includes('admin'), false)
  assert.equal(JSON.stringify(payload).includes('account_status'), false)
})

test('auth redirects stay on the public domain outside local development', () => {
  assert.equal(authRedirectUrl('/reset-password', 'https://preview.vercel.app'), 'https://alimanrouh.com/reset-password')
  assert.equal(authRedirectUrl('/account', 'http://localhost:5173'), 'http://localhost:5173/account')
  assert.equal(authRedirectUrl('/account', 'http://127.0.0.1:4173'), 'http://127.0.0.1:4173/account')
})

test('return paths cannot leave the site', () => {
  assert.equal(safeNextPath('/account/bookings'), '/account/bookings')
  assert.equal(safeNextPath('https://evil.example'), '/account')
  assert.equal(safeNextPath('//evil.example'), '/account')
  assert.equal(safeNextPath(null), '/account')
})

test('booking rows are created as pending customer requests and do not set an admin status', () => {
  const row = bookingInsertRow({
    userId: 'user-1',
    packageId: 'pkg-1',
    travelDate: '2026-11-01',
    adults: 2,
    children: 1,
    note: 'غرفة متصلة',
  })
  assert.equal(row.travelers_count, 3)
  assert.equal(row.status, 'pending')
  assert.equal(row.total_amount, 0)
  assert.equal(row.package_title_snapshot, '')
  assert.equal(row.customer_note, 'عدد الأطفال: 1\nغرفة متصلة')
  assert.equal('reference' in row, false)
  assert.equal(Object.values(row).includes('confirmed'), false)
})

test('traveler and note limits match the bookings constraints', () => {
  assert.throws(() => travelersCount(0, 0))
  assert.throws(() => travelersCount(90, 20))
  assert.equal(customerNote('x'.repeat(1200), 2).length, 1000)
})

test('database errors are shown in Arabic without raw policy text', () => {
  assert.match(errorText(new Error('account cannot create bookings')), /غير مفعّل/)
  assert.match(errorText(new Error('not authorized')), /صلاحية/)
  assert.equal(errorText(new Error('file type'), 'en'), 'The file must be a PDF, JPG, PNG, or WebP image.')
})
