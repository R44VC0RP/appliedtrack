'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, RefreshCw } from 'lucide-react'
import { srv_listBackups, srv_getBackupDownloadUrl } from '@/app/actions/server/admin/backups/primary'
import { formatDistanceToNow, format } from 'date-fns'

export function BackupManagement() {
  const [backups, setBackups] = useState<Array<{
    key: string;
    lastModified: Date;
    size: number;
    downloadUrl?: string;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBackups = async () => {
    try {
      setIsRefreshing(true)
      const response = await srv_listBackups()
      if (response.success && response.data) {
        // Convert string dates to Date objects
        setBackups(response.data.map(backup => ({
          ...backup,
          lastModified: new Date(backup.lastModified)
        })))
      } else {
        toast.error('Failed to fetch backups')
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
      toast.error('Failed to fetch backups')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const handleDownload = async (key: string) => {
    try {
      const response = await srv_getBackupDownloadUrl(key)
      if (response.success && response.url) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = response.url
        link.download = key.split('/').pop() || 'backup.sql.gz' // Extract filename from key
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Download started')
      } else {
        toast.error('Failed to generate download link')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <Card className="flex-1 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Database Backups</h2>
        <Button
          onClick={fetchBackups}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading backups...
                </TableCell>
              </TableRow>
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No backups found
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.key}>
                  <TableCell className="font-medium">
                    {backup.key.split('/').pop()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(backup.lastModified, 'PPP')}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(backup.lastModified, { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(backup.size)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleDownload(backup.key)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  )
}
