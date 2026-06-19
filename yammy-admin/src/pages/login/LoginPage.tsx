import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '@/entities/admin-auth/api'
import { Button, Card, Input } from '@/shared/ui/primitives'
import { t } from '@/shared/lib/labels'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">{t.loginTitle}</h1>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.username} />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.password}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          disabled={loading}
          className="w-full"
          onClick={() => {
            setLoading(true)
            setError('')
            void loginAdmin(username, password)
              .then((staff) => {
                navigate(staff.role === 'admin' ? '/dashboard' : '/moderation/profiles', { replace: true })
              })
              .catch(() => setError(t.invalidCredentials))
              .finally(() => setLoading(false))
          }}
        >
          {t.signIn}
        </Button>
      </Card>
    </div>
  )
}
