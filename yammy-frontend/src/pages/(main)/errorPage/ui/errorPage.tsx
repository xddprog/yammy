import type { JSX } from 'react'
import { useRouteError } from 'react-router-dom'

import { getErrorMessage } from '../lib/getErrorMessage'

const ErrorPage = (): JSX.Element => {
  const error = useRouteError()
  const errorMessage = getErrorMessage(error)
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h1 className="font-bold text-4xl">Oops!</h1>
      <h1>Sorry, an error occurred</h1>
      <h1>{errorMessage}</h1>
    </div>
  )
}

export default ErrorPage
