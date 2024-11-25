'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[90%] max-w-[600px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Oops! Page Went AWOL</h2>
          <p className="text-muted-foreground">
            Looks like this page decided to take an unscheduled vacation. It's probably sipping cocktails on a beach somewhere, completely oblivious to your search.
          </p>
          <p className="text-sm italic">
            (Or you've just typed something wrong. But let's blame the page, shall we?)
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button size="lg" className="min-w-[200px]">
                Back to Sanity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
