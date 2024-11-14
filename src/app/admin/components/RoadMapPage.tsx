'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { srv_getRoadmapData, srv_updateRoadmap, srv_createRoadmap, srv_deleteRoadmap } from '@/app/actions/server/admin/roadmap/primary'
import { Roadmap } from '@/models/Roadmap'
import { FaTrash } from 'react-icons/fa'
import { PiKeyReturnLight } from 'react-icons/pi'

type Status = 'not-started' | 'in-progress' | 'completed'


export function RoadMapPage() {
    const [items, setItems] = useState<Roadmap[]>([])
    const [editItem, setEditItem] = useState<Roadmap | null>(null)
    const [newItem, setNewItem] = useState({ title: '', description: '' })
    const { toast } = useToast()

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        const data = await srv_getRoadmapData()
        setItems(data)
    }

    const handleDragEnd = async (result: any) => {
        const { source, destination, draggableId } = result

        // If there's no destination, or the item was dropped in its original position
        if (!destination || 
            (destination.droppableId === source.droppableId && 
             destination.index === source.index)) {
            return
        }

        try {
            // Find the item being dragged
            const draggedItem = items.find(item => item.id === draggableId)
            if (!draggedItem) return

            // Create a new array of items
            const newItems = Array.from(items)
            
            // Remove the item from its source
            const [removed] = newItems.splice(
                newItems.findIndex(item => item.id === draggableId),
                1
            )

            // Update the status immediately for optimistic update
            if (source.droppableId !== destination.droppableId) {
                removed.status = destination.droppableId as Status
            }

            // Find the correct insertion index and insert
            const insertIndex = destination.index
            newItems.splice(insertIndex, 0, removed)

            // Update UI immediately
            setItems(newItems)

            // Then sync with server in the background
            if (source.droppableId !== destination.droppableId) {
                await srv_updateRoadmap(
                    draggableId,
                    draggedItem.title,
                    draggedItem.description,
                    destination.droppableId as Status
                )
            }
            
            toast({
                title: "Success",
                description: "Item moved successfully",
            })
        } catch (error) {
            console.error('Error during drag and drop:', error)
            toast({
                title: "Error",
                description: "Failed to move item",
                variant: "destructive",
            })
            // Revert to original state
            fetchItems()
        }
    }

    const handleUpdateItem = async () => {
        console.log('handleUpdateItem', editItem)
        if (!editItem) return

        setItems(items.map(item =>
            item.id === editItem.id ? editItem : item
        ))
        setEditItem(null)

        await srv_updateRoadmap(editItem.id, editItem.title, editItem.description, editItem.status)

        toast({
            title: "Success",
            description: "Item updated successfully",
        })
    }

    const handleCreateItem = async () => {
        if (!newItem.title.trim()) return  // Prevent empty submissions
        
        await srv_createRoadmap(newItem.title, newItem.description, 'not-started')
        setNewItem({ title: '', description: '' })
        fetchItems()

        toast({
            title: "Success",
            description: "New item created successfully",
        })

        // Close the dialog

    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleCreateItem()
        }
    }

    const handleDeleteItem = async (id: string) => {
        try {
            await srv_deleteRoadmap(id)
            setItems(items.filter(item => item.id !== id))
            toast({
                title: "Success",
                description: "Item deleted successfully",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete item",
                variant: "destructive",
            })
        }
    }

    const columns: Status[] = ['not-started', 'in-progress', 'completed']
    const columnTitles = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'completed': 'Completed'
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Roadmap</h2>
                <Dialog open={!!newItem.title} onOpenChange={() => setNewItem({ title: '', description: '' })}>
                    <DialogTrigger asChild >
                        <Button>Add New Item</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 flex flex-col">
                            <Input
                                placeholder="Title"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                onKeyDown={handleKeyDown}
                            />
                            <Textarea
                                placeholder="Description"
                                className="h-32"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                onKeyDown={handleKeyDown}
                            />
                            <Button 
                                onClick={handleCreateItem}
                            >
                                Create
                                <PiKeyReturnLight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-3 gap-4">
                    {columns.map(status => (
                        <div key={status} className="bg-muted/50 rounded-lg p-4 min-h-[500px]">
                            <h3 className="font-semibold mb-4">{columnTitles[status]}</h3>
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`space-y-4 min-h-[200px] ${
                                            snapshot.isDraggingOver ? 'bg-muted/80' : ''
                                        }`}
                                    >
                                        {items
                                            .filter(item => item.status === status)
                                            .map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-4 cursor-pointer transition-shadow relative group ${
                                                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                                            } ${
                                                                item.status === 'not-started' 
                                                                    ? 'bg-red-500/10 hover:bg-red-500/20' 
                                                                    : item.status === 'in-progress'
                                                                    ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                                                                    : 'bg-green-500/10 hover:bg-green-500/20'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div onClick={() => setEditItem(item)} className="flex-1">
                                                                    <h4 className="font-medium">{item.title}</h4>
                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteItem(item.id);
                                                                    }}
                                                                >
                                                                    <FaTrash className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {editItem && (
                <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                value={editItem.title}
                                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                            />
                            <Textarea
                                value={editItem.description}
                                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                            />
                            <Button onClick={handleUpdateItem}>Update</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
} 