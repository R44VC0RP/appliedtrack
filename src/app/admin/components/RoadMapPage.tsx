'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { srv_getRoadmapData, srv_updateRoadmap, srv_createRoadmap, srv_deleteRoadmap, srv_migrateMongoRoadmapData } from '@/app/actions/server/admin/roadmap/primary'
import { TRoadmap, RoadmapStatus, toBackendStatus, toFrontendStatus } from '@/types/roadmap'
import { FaTrash } from 'react-icons/fa'
import { PiKeyReturnLight } from 'react-icons/pi'
import KeyboardShortcut from "@/components/ui/keyboard-shortcut"

type DisplayStatus = 'not-started' | 'in-progress' | 'completed'

export function RoadMapPage() {
    const [items, setItems] = useState<TRoadmap[]>([])
    const [editItem, setEditItem] = useState<TRoadmap | null>(null)
    const [newItem, setNewItem] = useState({ title: '', description: '' })
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        const data = await srv_getRoadmapData()
        setItems(data)
    }

    const handleDragEnd = async (result: any) => {
        const { source, destination, draggableId } = result

        if (!destination ||
            (destination.droppableId === source.droppableId &&
                destination.index === source.index)) {
            return
        }

        try {
            const draggedItem = items.find(item => item.id === draggableId)
            if (!draggedItem) return

            const newItems = Array.from(items)
            const [removed] = newItems.splice(
                source.index,
                1
            )

            if (source.droppableId !== destination.droppableId) {
                removed.status = toBackendStatus(destination.droppableId)
            }

            const insertIndex = destination.index
            newItems.splice(insertIndex, 0, removed)

            setItems(newItems)

            if (source.droppableId !== destination.droppableId) {
                const response = await srv_updateRoadmap(
                    draggableId,
                    draggedItem.title,
                    draggedItem.description,
                    toBackendStatus(destination.droppableId)
                )

                if (!response.id) {
                    toast.error("Failed to update item")
                    fetchItems()
                    return
                }
            }

            toast.success("Item moved successfully")
        } catch (error) {
            console.error('Error moving item:', error)
            toast.error("Failed to move item")
        }
    }

    const handleUpdateItem = async () => {
        console.log('handleUpdateItem', editItem)
        if (!editItem) return

        setItems(items.map(item =>
            item.id === editItem.id ? editItem : item
        ))
        setEditItem(null)

        await srv_updateRoadmap(editItem.id, editItem.title, editItem.description, toBackendStatus(toFrontendStatus(editItem.status)))

        toast.success("Item updated successfully")
    }

    const handleCreateItem = async () => {
        if (!newItem.title.trim()) return

        const response = await srv_createRoadmap(
            newItem.title,
            newItem.description,
            'not_started'
        )

        if (!response.id) {
            toast.error("Failed to create item")
            return
        }

        setNewItem({ title: '', description: '' })
        fetchItems()
        setDialogOpen(false)
        toast.success("Item created successfully")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            handleCreateItem()
        }
    }

    const handleDeleteItem = async (id: string) => {
        try {
            await srv_deleteRoadmap(id)
            toast.success("Item deleted successfully")
            fetchItems()
        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    const handleMigration = async () => {
        try {

            await srv_migrateMongoRoadmapData()
            toast.success("Migration completed successfully")
            fetchItems()
        } catch (error) {
            console.error('Migration error:', error)
            toast.error("Migration failed")
        }
    }

    const displayColumns: DisplayStatus[] = ['not-started', 'in-progress', 'completed']
    const columnTitles = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'completed': 'Completed'
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Roadmap</h2>
                <div className="flex gap-2">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                    <span className="mr-2">Create</span>
                                    <KeyboardShortcut text="cmd + enter" />
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={handleMigration}>
                        Migrate from MongoDB
                    </Button>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-3 gap-4">
                    {displayColumns.map(status => (
                        <div key={status} className="bg-muted/50 rounded-lg p-4 min-h-[500px]">
                            <h3 className="font-semibold mb-4">{columnTitles[status]}</h3>
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`space-y-4 min-h-[200px] ${snapshot.isDraggingOver ? 'bg-muted/80' : ''
                                            }`}
                                    >
                                        {items
                                            .filter(item => toFrontendStatus(item.status) === status)
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
                                                            className={`p-4 cursor-pointer transition-shadow relative group ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                                                                } ${toFrontendStatus(item.status) === 'not-started'
                                                                    ? 'bg-red-500/10 hover:bg-red-500/20'
                                                                    : toFrontendStatus(item.status) === 'in-progress'
                                                                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                                                                        : 'bg-green-500/10 hover:bg-green-500/20'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div onClick={() => setEditItem(item)} className="flex-1">
                                                                    <h4 className="font-medium">{item.title}</h4>
                                                                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
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
                                className='h-40'
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