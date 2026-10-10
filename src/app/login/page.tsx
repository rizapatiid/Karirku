import { getRegisteredCashiers } from '@/actions/auth'
import LoginClient from './LoginClient'

export default async function LoginPage() {
  const registeredCashiers = await getRegisteredCashiers()

  return <LoginClient registeredCashiers={registeredCashiers} />
}
