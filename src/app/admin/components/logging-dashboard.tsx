'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { Filter, RotateCw, X, Copy, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/use-debounce'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface ILog {
  _id: string
  level: 'info' | 'warning' | 'error'
  action: string
  userId?: string
  details: any
  metadata?: Record<string, any>
  timestamp: Date
  service: string
  ip?: string
}

interface IPagination {
  total: number
  page: number
  limit: number
  pages: number
}

const ALL_LEVELS = '_all_levels'
const ALL_SERVICES = '_all_services'

interface TimelineEvent {
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  count: number
}

function LogTimeline({ logs }: { logs: ILog[] }) {
  const timelineData = useMemo(() => {
    // Group logs by minute
    const timeGroups = new Map<string, { info: number; warning: number; error: number }>()
    
    // Get the earliest and latest timestamps
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000) // Show last hour
    
    // Initialize empty minutes for the last hour
    for (let d = new Date(oneHourAgo); d <= now; d.setMinutes(d.getMinutes() + 1)) {
      timeGroups.set(format(d, 'yyyy-MM-dd HH:mm'), { info: 0, warning: 0, error: 0 })
    }
    
    // Fill in actual log data
    logs.forEach(log => {
      const minute = format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')
      const current = timeGroups.get(minute) || { info: 0, warning: 0, error: 0 }
      current[log.level]++
      timeGroups.set(minute, current)
    })

    return Array.from(timeGroups.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }, [logs])

  return (

    <div className="h-12 border-b border-border bg-background px-1">  
      <div className="flex h-full items-end space-x-[1px]">
        {timelineData.map(([timestamp, counts]) => {
          const total = counts.info + counts.warning + counts.error
          const maxHeight = 12 // max height in pixels
          
          return (
            <div key={timestamp} className="group relative flex-1 h-full flex items-end">
              {/* Tooltip */}
              {total > 0 && (
                <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 transform rounded bg-popover/95 px-2 py-1 text-[10px] shadow-md group-hover:block z-50">
                  <div className="font-medium">{format(new Date(timestamp), 'HH:mm:ss')}</div>
                  <div className="space-y-0.5">
                    {counts.error > 0 && <div className="text-destructive">Errors: {counts.error}</div>}
                    {counts.warning > 0 && <div className="text-yellow-500">Warnings: {counts.warning}</div>}
                    {counts.info > 0 && <div className="text-emerald-500">Info: {counts.info}</div>}
                  </div>
                </div>
              )}
              
              {/* Bar */}
              {total > 0 && (
                <div 
                  className={`w-full ${
                    counts.error > 0 
                      ? 'bg-destructive/90' 
                      : counts.warning > 0 
                      ? 'bg-yellow-500/90' 
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{ 
                    height: `${Math.max((total / 5) * maxHeight, 2)}px`,
                    minWidth: '2px'
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LoggingDashboard() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ILog[]>([])
  const [search, setSearch] = useState('')
  const [isLive, setIsLive] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ILog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<IPagination>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  })
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [initialLoading, setInitialLoading] = useState(true)

  const debouncedSearch = useDebounce(search, 500)

  const fetchLogs = useCallback(async () => {
    try {
      if (initialLoading) {
        setIsLoading(true)
      }
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        level: levelFilter === ALL_LEVELS ? '' : levelFilter,
        service: serviceFilter === ALL_SERVICES ? '' : serviceFilter
      })

      const response = await fetch(`/api/admin/logs?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch logs')

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch logs. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setInitialLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, levelFilter, serviceFilter, initialLoading])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchLogs, isLive])

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-destructive dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-emerald-600 dark:text-emerald-400'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Log details copied to clipboard",
    })
  }

  const uniqueServices = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.service)))
  }, [logs])

  if (initialLoading) {
    return <LoggingDashboardSkeleton />
  }

  return (
    <div className="flex h-screen flex-col bg-background w-full max-w-full">
      <LogTimeline logs={logs} />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Table className="relative w-full border-collapse">
          <TableHeader className="sticky top-0 bg-background">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="h-8 px-3 text-xs font-medium text-muted-foreground">Time</TableHead>
              <TableHead className="h-8 px-3 text-xs font-medium text-muted-foreground">Level</TableHead>
              <TableHead className="h-8 px-3 text-xs font-medium text-muted-foreground">Service</TableHead>
              <TableHead className="h-8 px-3 text-xs font-medium text-muted-foreground">Action</TableHead>
              <TableHead className="h-8 px-3 text-xs font-medium text-muted-foreground">Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <Sheet key={log._id}>
                <SheetTrigger asChild>
                  <TableRow
                    className="cursor-pointer border-0 hover:bg-muted/50 text-xs"
                  >
                    <TableCell className="h-6 px-3 py-1 font-mono">
                      {format(new Date(log.timestamp), 'MMM dd HH:mm:ss.SSS')}
                    </TableCell>
                    <TableCell className={`h-6 px-3 py-1 font-mono ${getStatusColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </TableCell>
                    <TableCell className="h-6 px-3 py-1 font-mono">{log.service}</TableCell>
                    <TableCell className="h-6 px-3 py-1 font-mono">{log.action}</TableCell>
                    <TableCell className="h-6 px-3 py-1 font-mono max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[400px] border-l border-border p-0"
                >
                  <div className="h-full overflow-auto">
                    <div className="sticky top-0 border-b border-border bg-background p-4">
                      <SheetHeader>
                        <SheetTitle>Log Details</SheetTitle>
                      </SheetHeader>
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Time</label>
                        <div className="font-mono text-sm">
                          {format(new Date(log.timestamp), 'PPpp')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Level</label>
                        <div className={`font-mono text-sm ${getStatusColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Service</label>
                        <div className="font-mono text-sm">{log.service}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Action</label>
                        <div className="font-mono text-sm">{log.action}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">User ID</label>
                        <div className="font-mono text-sm">{log.userId || '-'}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">IP Address</label>
                        <div className="font-mono text-sm">{log.ip || '-'}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Details</label>
                        <pre className="whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                      {log.metadata && (
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Metadata</label>
                          <pre className="whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function LoggingDashboardSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex h-14 items-center px-4">
          <div className="flex flex-1 items-center space-x-4">
            <Skeleton className="h-8 w-[400px]" />
            <Skeleton className="h-8 w-[150px]" />
            <Skeleton className="h-8 w-[200px]" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-4 flex space-x-4">
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}