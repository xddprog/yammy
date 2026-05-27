import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { ERouteNames } from '@/shared/lib/routeVariables'

import ErrorPage from './(main)/errorPage'
import RootPage from './(main)/rootPage'

const AuthPage = lazy(() => import('@/pages/(auth)/authPage'))
const DashboardPage = lazy(() => import('@/pages/(main)/dashboardPage'))
const ChatsPage = lazy(() => import('@/pages/(main)/chatsPage'))
const LikesPage = lazy(() => import('@/pages/(main)/likesPage'))
const ProfilePage = lazy(() => import('@/pages/(main)/profilePage'))
const AiSearchPage = lazy(() => import('@/pages/(main)/aiSearchPage'))
const AiSearchResultsPage = lazy(() => import('@/pages/(main)/aiSearchResultsPage'))
const ChatDetailPage = lazy(() => import('@/pages/(main)/chatsPage/ui/chatDetailPage'))
const LoginPage = lazy(() => import('@/pages/(auth)/loginPage'))
const RegisterPage = lazy(() => import('@/pages/(auth)/registerPage'))

export const routes = createBrowserRouter([
  {
    path: ERouteNames.DEFAULT_ROUTE,
    element: <RootPage />,
    errorElement: <ErrorPage />,
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
  {
    path: ERouteNames.AUTH_ROUTE,
    element: <AuthPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to={ERouteNames.REGISTER_ROUTE} replace />,
      },
      {
        path: ERouteNames.REGISTER_ROUTE,
        element: <RegisterPage />,
      },
      {
        path: ERouteNames.LOGIN_ROUTE,
        element: <LoginPage />,
      },
    ],
  },
])
