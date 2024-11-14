'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { Filter, RotateCw, X, Copy, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useDebounce } from '@/hooks/use-debounce'
import { useInView } from 'react-intersection-observer';

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
import { toast } from "sonner";
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

interface FilterState {
  level: string
  service: string
  startDate: Date | null
  endDate: Date | null
  userId: string
  ip: string
  timeRange: '15m' | '1h' | '6h' | '24h' | '7d' | 'custom'
  search: string
  action: string
  sortBy: 'timestamp' | 'level' | 'service' | 'action'
  sortOrder: 'asc' | 'desc'
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
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
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
                      ? 'bg-red-500/90' 
                      : counts.warning > 0 
                      ? 'bg-yellow-500/90' 
                      : 'bg-green-500/90'
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

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  services: string[];
  onRefresh: () => void;
  isLive: boolean;
  onLiveToggle: (live: boolean) => void;
  totalLogs: number;
}

function FilterPanel({
  filters,
  onFilterChange,
  services,
  onRefresh,
  isLive,
  onLiveToggle,
  totalLogs
}: FilterPanelProps) {
  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex flex-1 items-center space-x-4">
          {/* Time Range Selector */}
          <Select
            value={filters.timeRange}
            onValueChange={(value) => 
              onFilterChange({ ...filters, timeRange: value as FilterState['timeRange'] })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15 min</SelectItem>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select
            value={filters.level}
            onValueChange={(value) => onFilterChange({ ...filters, level: value })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Log Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LEVELS}>All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <Input
            placeholder="Search logs..."
            className="max-w-sm"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
          <div className="text-xs text-muted-foreground">
            {totalLogs} logs total
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLiveToggle(!isLive)}
          >
            {isLive ? "Stop Live" : "Go Live"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function LoggingDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    level: ALL_LEVELS,
    service: ALL_SERVICES,
    startDate: null,
    endDate: null,
    userId: '',
    ip: '',
    timeRange: '1h',
    search: '',
    action: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  })
  const [logs, setLogs] = useState<ILog[]>([])
  const [isLive, setIsLive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pagination, setPagination] = useState<IPagination>({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  })
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView();

  const debouncedFilters = useDebounce(filters, 500)

  const fetchLogs = useCallback(async (loadMore: boolean = false) => {
    try {
      if (initialLoading) {
        setIsLoading(true)
      }
      
      const currentPage = loadMore ? pagination.page + 1 : 1;
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        search: debouncedFilters.search,
        level: debouncedFilters.level === ALL_LEVELS ? '' : debouncedFilters.level,
        service: debouncedFilters.service === ALL_SERVICES ? '' : debouncedFilters.service,
        userId: debouncedFilters.userId,
        ip: debouncedFilters.ip,
        action: debouncedFilters.action,
        timeRange: debouncedFilters.timeRange,
        sortBy: debouncedFilters.sortBy,
        sortOrder: debouncedFilters.sortOrder
      })

      // Add date range if custom timeRange is selected
      if (debouncedFilters.timeRange === 'custom' && debouncedFilters.startDate && debouncedFilters.endDate) {
        queryParams.append('startDate', debouncedFilters.startDate.toISOString())
        queryParams.append('endDate', debouncedFilters.endDate.toISOString())
      }

      const response = await fetch(`/api/admin/logs?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch logs')

      const data = await response.json()
      setLogs(prev => loadMore ? [...prev, ...data.logs] : data.logs)
      setPagination(data.pagination)
      setHasMore(currentPage < data.pagination.pages)
    } catch (error) {
      toast.error("Failed to fetch logs. Please try again.");
    } finally {
      setIsLoading(false)
      setInitialLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedFilters, initialLoading])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchLogs, isLive])

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLive) {
      fetchLogs(true);
    }
  }, [inView, hasMore, isLoading, isLive]);

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
    toast.success("Log details copied to clipboard");
  }

  const uniqueServices = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.service)))
  }, [logs])

  if (initialLoading) {
    return <LoggingDashboardSkeleton />
  }

  return (
    <div className="flex flex-col bg-background w-full h-[calc(100vh-150px)]">
      <FilterPanel
        filters={filters}
        onFilterChange={setFilters}
        services={uniqueServices}
        onRefresh={() => fetchLogs(false)}
        isLive={isLive}
        onLiveToggle={setIsLive}
        totalLogs={pagination.total}
      />
      <LogTimeline logs={logs} />
      
      {/* Main content with fixed height and scrolling */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-auto">
          <Table className="relative w-full border-collapse">
            <TableHeader className="sticky top-0 bg-background z-10">
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
              
              {/* Load more trigger */}
              {!isLive && (
                <TableRow ref={loadMoreRef}>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RotateCw className="h-4 w-4 animate-spin" />
                        <span>Loading more...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-muted-foreground">Scroll to load more</span>
                    ) : (
                      <span className="text-muted-foreground">No more logs</span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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