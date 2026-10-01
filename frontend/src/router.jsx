import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import HomePage from './pages/HomePage';

// Lazy-loaded route components for high performance and prefetching
const DigitalServicesLanding = lazy(() => import('./pages/digital-services/DigitalServicesLanding'));
const WorkIndexPage = lazy(() => import('./pages/digital-services/WorkIndexPage'));
const CaseStudyDetailPage = lazy(() => import('./pages/digital-services/CaseStudyDetailPage'));
const ServicesIndexPage = lazy(() => import('./pages/digital-services/ServicesIndexPage'));
const ServiceDetailPage = lazy(() => import('./pages/digital-services/ServiceDetailPage'));
const ContactPage = lazy(() => import('./pages/digital-services/ContactPage'));

const WorkshopsLanding = lazy(() => import('./pages/workshops/WorkshopsLanding'));
const WorkshopsWorkIndexPage = lazy(() => import('./pages/workshops/WorkshopsWorkIndexPage'));
const WorkshopCaseStudyPage = lazy(() => import('./pages/workshops/WorkshopCaseStudyPage'));
const WorkshopsAboutPage = lazy(() => import('./pages/workshops/WorkshopsAboutPage'));
const WorkshopsBookPage = lazy(() => import('./pages/workshops/WorkshopsBookPage'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // 1. Persistent HomePage layout: mounts once across / and /home
      {
        element: <HomePage />,
        children: [
          { path: '/', element: null },
          { path: '/home', element: null }
        ]
      },

      // 2. Digital Services Dashboard sub-pages
      {
        path: '/digital-services',
        element: <DashboardLayout section="digital-services" />,
        children: [
          { index: true, element: <DigitalServicesLanding /> },
          { path: 'work', element: <WorkIndexPage /> },
          { path: 'work/:slug', element: <CaseStudyDetailPage /> },
          { path: 'services', element: <ServicesIndexPage /> },
          { path: 'services/:slug', element: <ServiceDetailPage /> },
          { path: 'contact', element: <ContactPage /> }
        ]
      },

      // 3. Workshops Dashboard sub-pages
      {
        path: '/workshops',
        element: <DashboardLayout section="workshops" />,
        children: [
          { index: true, element: <WorkshopsLanding /> },
          { path: 'work', element: <WorkshopsWorkIndexPage /> },
          { path: 'work/:slug', element: <WorkshopCaseStudyPage /> },
          { path: 'about', element: <WorkshopsAboutPage /> },
          { path: 'book', element: <WorkshopsBookPage /> }
        ]
      },

      // 4. 404 Catch-All
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);
