import * as React from 'react'
import { cn } from '@/lib/utils'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success'
}

const variants = {
  default: 'border-border bg-muted text-foreground',
  destructive: 'border-red-900/50 bg-red-950/50 text-red-200',
  success: 'border-green-900/50 bg-green-950/50 text-green-200',
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('rounded-md border px-4 py-3 text-sm', variants[variant], className)}
      {...props}
    />
  )
}
