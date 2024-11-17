'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from 'lucide-react'

interface AddServiceModalProps {
  onAdd: (serviceKey: string, serviceName: string, description: string) => void
}

export function AddServiceModal({ onAdd }: AddServiceModalProps) {
  const [open, setOpen] = useState(false)
  const [serviceKey, setServiceKey] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!serviceKey || !serviceName) return
    
    // Convert service key to uppercase and replace spaces with underscores
    const formattedKey = serviceKey.toUpperCase().replace(/\s+/g, '_')
    
    onAdd(formattedKey, serviceName, description)
    setOpen(false)
    
    // Reset form
    setServiceKey('')
    setServiceName('')
    setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="serviceKey">Service Key</Label>
            <Input
              id="serviceKey"
              placeholder="e.g., AI_RESUME"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This will be automatically converted to uppercase with underscores
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              placeholder="e.g., AI Resume Generation"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this service does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!serviceKey || !serviceName}>
            Add Service
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}