import { api } from './api'

export type CreateBookingPayload = {
  fullName: string
  phone: string
  email?: string
  adults: number
  children: number
  travelDate: string
  notes?: string
  packageId: string
}

export async function createBooking(payload: CreateBookingPayload) {
  const { data } = await api.post('/bookings', payload)
  return data
}
