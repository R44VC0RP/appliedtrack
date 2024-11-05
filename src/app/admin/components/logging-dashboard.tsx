'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
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
    <div className="flex h-screen flex-col bg-background w-full max-w-full p-6">
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex h-14 items-center px-4">
          <div className="flex flex-1 items-center space-x-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`${pagination.total} total logs found...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-[400px]"
            />
            <Select value={levelFilter || ALL_LEVELS} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LEVELS}>All levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter || ALL_SERVICES} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SERVICES}>All services</SelectItem>
                {uniqueServices.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="relative"
            >
              {isLive && (
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
              Live
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchLogs()}
              className={isLoading ? 'animate-spin' : ''}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[200px]">Time</TableHead>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[150px]">Service</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <Sheet key={log._id}>
                <SheetTrigger asChild>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.timestamp), 'MMM dd HH:mm:ss.SSS')}
                    </TableCell>
                    <TableCell className={getStatusColor(log.level)}>
                      {log.level.toUpperCase()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.service}</TableCell>
                    <TableCell className="font-mono text-sm">{log.action}</TableCell>
                    <TableCell className="font-mono text-sm max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[400px] border-l border-border"
                >
                  <SheetHeader>
                    <SheetTitle>Log Details</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Time</label>
                      <div className="font-mono">
                        {format(new Date(log.timestamp), 'PPpp')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Level</label>
                      <div className={`font-mono ${getStatusColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Service</label>
                      <div className="font-mono">{log.service}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Action</label>
                      <div className="font-mono">{log.action}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">User ID</label>
                      <div className="font-mono">{log.userId || '-'}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">IP Address</label>
                      <div className="font-mono">{log.ip || '-'}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Details</label>
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                    {log.metadata && (
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Metadata</label>
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
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