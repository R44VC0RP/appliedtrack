'use client'

import Homepage from '@/components/homepage'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Homepage />
    </Suspense>
  )
}
