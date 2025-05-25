'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from './actions'
import { loginSchema, LoginInput } from '@/types/auth'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const { register, handleSubmit, control, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { setUser } = useAuth()

  const onSubmit = async (data: LoginInput) => {
    startTransition(async () => {
      try {
        const res = await login(data)
        if (!res.error && res.userName != null ) {
          setMessage("Login successful!")
          setIsError(false)
          setUser({ userName: res.userName })
          router.push('/')
        }

        setMessage(`${res.error}`)
        setIsError(true)
      } catch (e: any) {
        setMessage(e.message || 'Login failed!')
        setIsError(true)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    {...register('email')}
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    {...register('password')}
                    id="password"
                    type="password"
                    required
                    disabled={isPending} />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? 'Logging in...' : 'Login'}
                </Button>
                {message && (
                  <p className={`${isError ? 'text-red-500' : 'text-green-500'} mt-2`}>{message}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
