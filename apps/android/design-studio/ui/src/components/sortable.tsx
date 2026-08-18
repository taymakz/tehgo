"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable as useDndSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@workspace/ui/lib/utils"

// ─── Context ──────────────────────────────────────────────────────────────────

type SortableItemContextValue = {
  listeners: ReturnType<typeof useDndSortable>["listeners"]
  setActivatorNodeRef: (node: HTMLElement | null) => void
}

const SortableItemContext = React.createContext<SortableItemContextValue>({
  listeners: undefined,
  setActivatorNodeRef: () => undefined,
})

// ─── Sortable ─────────────────────────────────────────────────────────────────

interface SortableProps<T> {
  value: T[]
  onValueChange: (value: T[]) => void
  getItemValue: (item: T) => string
  layout?: "vertical" | "grid"
  className?: string
  children: React.ReactNode
}

function Sortable<T>({
  value,
  onValueChange,
  getItemValue,
  layout = "vertical",
  className,
  children,
}: SortableProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = value.map(getItemValue)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = itemIds.indexOf(active.id as string)
    const newIndex = itemIds.indexOf(over.id as string)
    onValueChange(arrayMove(value, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itemIds}
        strategy={
          layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  )
}

// ─── SortableItem ─────────────────────────────────────────────────────────────

interface SortableItemProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

function SortableItem({
  value,
  disabled,
  className,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useDndSortable({ id: value, disabled })

  return (
    <SortableItemContext.Provider value={{ listeners, setActivatorNodeRef }}>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        className={cn(isDragging && "relative z-10 opacity-50", className)}
      >
        {children}
      </div>
    </SortableItemContext.Provider>
  )
}

// ─── SortableItemHandle ───────────────────────────────────────────────────────

interface SortableItemHandleProps {
  className?: string
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

function SortableItemHandle({
  className,
  children,
  onClick,
}: SortableItemHandleProps) {
  const { listeners, setActivatorNodeRef } =
    React.useContext(SortableItemContext)
  return (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      type="button"
      onClick={onClick}
      className={cn("cursor-grab touch-none active:cursor-grabbing", className)}
    >
      {children}
    </button>
  )
}

export { Sortable, SortableItem, SortableItemHandle }
