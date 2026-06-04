import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppAuthGate } from '@/app/ui/AppAuthGate'
import { ERouteNames } from '@/shared/lib/routeVariables'

import ErrorPage from './(main)/errorPage'
import RootPage from './(main)/rootPage'

const DashboardPage = lazy(() => import('@/pages/(main)/dashboardPage'))
const ChatsPage = lazy(() => import('@/pages/(main)/chatsPage'))
const LikesPage = lazy(() => import('@/pages/(main)/likesPage'))
const ProfilePage = lazy(() => import('@/pages/(main)/profilePage'))
const AiSearchPage = lazy(() => import('@/pages/(main)/aiSearchPage'))
const AiSearchResultsPage = lazy(() => import('@/pages/(main)/aiSearchResultsPage'))
const ChatDetailPage = lazy(() => import('@/pages/(main)/chatsPage/ui/chatDetailPage'))
const OnboardingPage = lazy(() => import('@/pages/(onboarding)/onboardingPage'))

export const routes = createBrowserRouter([
  {
    element: <AppAuthGate />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: ERouteNames.ONBOARDING_ROUTE,
        element: <OnboardingPage />,
      },
      {
        path: ERouteNames.DEFAULT_ROUTE,
        element: <RootPage />,
        children: [
          {
            index: true,
            element: <Navigate to={ERouteNames.DASHBOARD_ROUTE} replace />,
          },
          {
            path: ERouteNames.DASHBOARD_ROUTE,
            element: <DashboardPage />,
          },
          {
            path: ERouteNames.CHATS_ROUTE,
            element: <ChatsPage />,
          },
          {
            path: ERouteNames.CHATS_ROUTE + '/:id',
            element: <ChatDetailPage />,
          },
          {
            path: ERouteNames.LIKES_ROUTE,
            element: <LikesPage />,
          },
          {
            path: ERouteNames.PROFILE_ROUTE,
            element: <ProfilePage />,
          },
          {
            path: ERouteNames.AI_SEARCH_ROUTE,
            element: <AiSearchPage />,
          },
          {
            path: ERouteNames.AI_SEARCH_RESULTS_ROUTE,
            element: <AiSearchResultsPage />,
          },
        ],
      },
    ],
  },
])
