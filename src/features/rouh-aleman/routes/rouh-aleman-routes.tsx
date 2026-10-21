import { Route, Routes } from 'react-router-dom'
import { RouhAlemanLayout } from '../../../app/layouts/rouh-aleman-layout'

import { HomePage } from '../pages/home/HomePage'
import { FlightsPage } from '../pages/flights/FlightsPage'
import { HajjPage } from '../pages/hajj/HajjPage'
import { UmrahPage } from '../pages/umrah/UmrahPage'
import { TourismPage } from '../pages/tourism/TourismPage'
import { HotelsPage } from '../pages/hotels/HotelsPage'
import { OffersPage } from '../pages/offers/OffersPage'
import { ContactPage } from '../pages/contact/ContactPage'
import { AboutPage } from '../pages/about/AboutPage'
import { BookingPage } from '../pages/booking/BookingPage'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '../auth/auth-pages'
import {
  AccountLayout,
  AccountOverviewPage,
  BookingDetailPage,
  BookingsPage,
  DocumentsPage,
  InquiriesPage,
  ProfilePage,
  RequireCustomer,
  VisaDetailPage,
  VisasPage,
} from '../pages/account/AccountPages'

export function RouhAlemanRoutes() {
  return (
    <Routes>
      <Route element={<RouhAlemanLayout />}>
        <Route index element={<HomePage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="flights" element={<FlightsPage />} />
        <Route path="hajj" element={<HajjPage />} />
        <Route path="umrah" element={<UmrahPage />} />
        <Route path="tourism" element={<TourismPage />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireCustomer />}>
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<AccountOverviewPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="visas" element={<VisasPage />} />
            <Route path="visas/:id" element={<VisaDetailPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="inquiries" element={<InquiriesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

