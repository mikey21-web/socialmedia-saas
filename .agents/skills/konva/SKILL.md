---
name: konva
description: Build interactive 2D canvas applications with Konva.js and React-Konva. Use when building plot visualization, floor plans, interactive diagrams, canvas-based games, real-time drawing tools, or zoomable/draggable interfaces.
---

# Konva.js & React-Konva Expert Guide

## Installation

```bash
npm install konva react-konva
```

## Quick Start with React-Konva

```typescript
import React, { useRef } from 'react'
import { Stage, Layer, Rect, Text, Circle } from 'react-konva'

export default function Canvas() {
  const stageRef = useRef(null)

  return (
    <Stage
      width={800}
      height={600}
      ref={stageRef}
      style={{ border: '1px solid #ccc' }}
    >
      <Layer>
        {/* Background */}
        <Rect width={800} height={600} fill="#f0f0f0" />

        {/* Plot/Shape */}
        <Rect
          x={50}
          y={50}
          width={150}
          height={200}
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth={2}
          draggable
        />

        {/* Label */}
        <Text x={60} y={100} text="Plot A-101" fill="white" />

        {/* Marker */}
        <Circle
          x={400}
          y={300}
          radius={10}
          fill="#ef4444"
          draggable
        />
      </Layer>
    </Stage>
  )
}
```

## Core Concepts

### Stage, Layer, Shapes

```typescript
import { Stage, Layer, Rect, Circle, Line, Polygon, Text, Image } from 'react-konva'

// Stage = canvas container (width, height, onClick, etc.)
// Layer = grouping container (for performance, z-index)
// Shapes = Rect, Circle, Line, Polygon, Image, Wedge, Star, etc.

<Stage width={1200} height={800}>
  <Layer>
    {/* All shapes on this layer */}
    <Rect x={10} y={10} width={100} height={100} fill="blue" />
    <Circle cx={200} cy={50} radius={30} fill="red" />
    <Line points={[0, 0, 100, 100]} stroke="black" strokeWidth={2} />
    <Text x={50} y={150} text="Label" fill="black" fontSize={16} />
  </Layer>
</Stage>
```

### Common Props

```typescript
// All shapes support:
x={10}                    // position
y={20}
width={100}               // dimensions
height={150}
fill="#3b82f6"           // colors
stroke="#1e40af"
strokeWidth={2}
opacity={0.8}            // transparency
rotation={45}            // degrees
scaleX={1.5}             // scale
scaleY={1}
visible={true}           // show/hide
zIndex={10}              // layering

draggable={true}         // interactivity
onMouseEnter={() => {}}
onMouseLeave={() => {}}
onClick={() => {}}
onDragStart={() => {}}
onDragMove={() => {}}
onDragEnd={() => {}}

// Text-specific
fontSize={14}
fontFamily="Arial"
fontStyle="normal"       // italic, bold
textDecoration="none"    // underline, line-through
align="left"             // center, right
verticalAlign="top"      // middle, bottom
```

## Interactive Elements & Selections

```typescript
import React, { useState, useRef } from 'react'
import { Stage, Layer, Rect, Group } from 'react-konva'

export function SelectablePlots() {
  const [selected, setSelected] = useState(null)
  const stageRef = useRef(null)

  const plots = [
    { id: 1, x: 50, y: 50, width: 100, height: 150, label: 'A-101', price: '₹45L' },
    { id: 2, x: 200, y: 50, width: 100, height: 150, label: 'A-102', price: '₹48L' },
    { id: 3, x: 350, y: 50, width: 100, height: 150, label: 'A-103', price: '₹50L' },
  ]

  const handlePlotClick = (id) => {
    setSelected(id)
  }

  return (
    <Stage width={800} height={400} ref={stageRef}>
      <Layer>
        {plots.map((plot) => (
          <Group key={plot.id}>
            <Rect
              x={plot.x}
              y={plot.y}
              width={plot.width}
              height={plot.height}
              fill={selected === plot.id ? '#10b981' : '#3b82f6'}
              stroke={selected === plot.id ? '#059669' : '#1e40af'}
              strokeWidth={3}
              onClick={() => handlePlotClick(plot.id)}
              onMouseEnter={(e) => {
                e.target.scaleX(1.05)
                e.target.scaleY(1.05)
              }}
              onMouseLeave={(e) => {
                e.target.scaleX(1)
                e.target.scaleY(1)
              }}
              draggable
            />
            <Text
              x={plot.x + 5}
              y={plot.y + 10}
              text={plot.label}
              fill="white"
              fontSize={12}
              fontWeight="bold"
            />
            <Text
              x={plot.x + 5}
              y={plot.y + 60}
              text={plot.price}
              fill="white"
              fontSize={11}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}
```

## Zooming & Panning

```typescript
import React, { useRef, useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'

export function ZoomableCanvas() {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleWheel = (e) => {
    e.evt.preventDefault()
    const scaleBy = 1.2
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

    // Constrain zoom
    if (newScale < 0.5 || newScale > 5) return

    const newX = pointer.x - (pointer.x - stage.x()) / oldScale * newScale
    const newY = pointer.y - (pointer.y - stage.y()) / oldScale * newScale

    stage.scale({ x: newScale, y: newScale })
    stage.position({ x: newX, y: newY })

    setScale(newScale)
    setPosition({ x: newX, y: newY })
  }

  const handleDragStage = () => {
    const stage = stageRef.current
    setPosition({ x: stage.x(), y: stage.y() })
  }

  return (
    <Stage
      width={1000}
      height={700}
      ref={stageRef}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragStage}
      style={{ cursor: 'grab' }}
    >
      <Layer>
        <Rect width={2000} height={1500} fill="#f9fafb" />
        {/* Your shapes here */}
      </Layer>
    </Stage>
  )
}
```

## Tooltips & Popups

```typescript
import React, { useState } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'

export function PlotsWithTooltip() {
  const [hovered, setHovered] = useState(null)

  const plots = [
    { id: 1, x: 50, y: 50, name: 'Plot A-101', price: '₹45,00,000', area: '1200 sq ft', status: 'Available' },
    { id: 2, x: 200, y: 50, name: 'Plot A-102', price: '₹48,00,000', area: '1200 sq ft', status: 'Booked' },
  ]

  return (
    <Stage width={600} height={400}>
      <Layer>
        {plots.map((plot) => (
          <Group key={plot.id}>
            <Rect
              x={plot.x}
              y={plot.y}
              width={100}
              height={150}
              fill={plot.status === 'Booked' ? '#9ca3af' : '#3b82f6'}
              stroke="#1e40af"
              strokeWidth={2}
              onMouseEnter={() => setHovered(plot.id)}
              onMouseLeave={() => setHovered(null)}
            />

            {/* Tooltip */}
            {hovered === plot.id && (
              <Group>
                <Rect
                  x={plot.x}
                  y={plot.y - 100}
                  width={200}
                  height={90}
                  fill="white"
                  stroke="black"
                  strokeWidth={1}
                  cornerRadius={5}
                />
                <Text
                  x={plot.x + 10}
                  y={plot.y - 90}
                  text={plot.name}
                  fontSize={12}
                  fontWeight="bold"
                  fill="black"
                />
                <Text
                  x={plot.x + 10}
                  y={plot.y - 70}
                  text={`Price: ${plot.price}`}
                  fontSize={11}
                  fill="#374151"
                />
                <Text
                  x={plot.x + 10}
                  y={plot.y - 55}
                  text={`Area: ${plot.area}`}
                  fontSize={11}
                  fill="#374151"
                />
                <Text
                  x={plot.x + 10}
                  y={plot.y - 40}
                  text={`Status: ${plot.status}`}
                  fontSize={11}
                  fill={plot.status === 'Available' ? '#10b981' : '#ef4444'}
                  fontWeight="bold"
                />
              </Group>
            )}
          </Group>
        ))}
      </Layer>
    </Stage>
  )
}
```

## Real Estate Floor Plan Example

```typescript
import React, { useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva'

export function FloorPlan() {
  const [selectedUnit, setSelectedUnit] = useState(null)

  // Grid of units (4x3 layout)
  const generateUnits = () => {
    const units = []
    const cols = 4
    const rows = 3
    const unitWidth = 120
    const unitHeight = 100
    const spacing = 20

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = `${String.fromCharCode(65 + row)}-${col + 1}`
        units.push({
          id,
          x: 50 + col * (unitWidth + spacing),
          y: 50 + row * (unitHeight + spacing),
          width: unitWidth,
          height: unitHeight,
          price: '₹' + (25 + Math.random() * 15).toFixed(0) + 'L',
          status: Math.random() > 0.6 ? 'Booked' : 'Available',
        })
      }
    }
    return units
  }

  const units = generateUnits()

  return (
    <div className="p-4 bg-white">
      <h2 className="text-2xl font-bold mb-4">Floor Plan - Block A</h2>

      <Stage width={700} height={500} style={{ border: '1px solid #e5e7eb' }}>
        <Layer>
          {/* Background */}
          <Rect width={700} height={500} fill="#f9fafb" />

          {/* Units */}
          {units.map((unit) => (
            <Group
              key={unit.id}
              onClick={() => setSelectedUnit(unit.id)}
              onMouseEnter={(e) => {
                e.target.getParent().zIndex(100)
              }}
            >
              <Rect
                x={unit.x}
                y={unit.y}
                width={unit.width}
                height={unit.height}
                fill={
                  selectedUnit === unit.id
                    ? '#dbeafe'
                    : unit.status === 'Booked'
                      ? '#d1d5db'
                      : '#dbeafe'
                }
                stroke={
                  selectedUnit === unit.id
                    ? '#0284c7'
                    : unit.status === 'Booked'
                      ? '#6b7280'
                      : '#0ea5e9'
                }
                strokeWidth={selectedUnit === unit.id ? 3 : 2}
                cornerRadius={3}
              />

              {/* Status Indicator */}
              <Circle
                x={unit.x + unit.width - 8}
                y={unit.y + 8}
                radius={5}
                fill={unit.status === 'Available' ? '#10b981' : '#ef4444'}
              />

              {/* Unit ID */}
              <Text
                x={unit.x + 5}
                y={unit.y + 10}
                text={unit.id}
                fontSize={11}
                fontWeight="bold"
                fill="#1f2937"
              />

              {/* Price */}
              <Text
                x={unit.x + 5}
                y={unit.y + 35}
                text={unit.price}
                fontSize={9}
                fill={unit.status === 'Available' ? '#10b981' : '#6b7280'}
                fontWeight="bold"
              />

              {/* Status */}
              <Text
                x={unit.x + 5}
                y={unit.y + 60}
                text={unit.status}
                fontSize={8}
                fill={unit.status === 'Available' ? '#047857' : '#6b7280'}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Details Panel */}
      {selectedUnit && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold">Unit: {selectedUnit}</h3>
          <p className="text-sm text-gray-600">
            {units.find((u) => u.id === selectedUnit)?.status} •{' '}
            {units.find((u) => u.id === selectedUnit)?.price}
          </p>
        </div>
      )}
    </div>
  )
}
```

## Drawing Tools (Drag to Draw)

```typescript
import React, { useState } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'

export function DrawingCanvas() {
  const [lines, setLines] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)

  const handleMouseDown = (e) => {
    if (e.evt.buttons !== 1) return
    setIsDrawing(true)
    const pos = e.target.getStage().getPointerPosition()
    setLines([...lines, [pos.x, pos.y]])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const lastLine = lines[lines.length - 1]

    if (!lastLine) return

    lastLine.push(point.x, point.y)
    setLines([...lines.slice(0, -1), lastLine])
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  return (
    <Stage
      width={800}
      height={600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ border: '1px solid #ccc', cursor: 'crosshair' }}
    >
      <Layer>
        <Rect width={800} height={600} fill="white" />
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line}
            stroke="#3b82f6"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </Layer>
    </Stage>
  )
}
```

## Animation

```typescript
import React, { useRef, useEffect } from 'react'
import { Stage, Layer, Rect } from 'react-konva'

export function AnimatedShapes() {
  const rectRef = useRef(null)

  useEffect(() => {
    const animate = () => {
      const rect = rectRef.current
      if (!rect) return

      const rotation = (rect.rotation() + 1) % 360
      rect.rotation(rotation)

      const x = 100 + 50 * Math.sin(rotation * (Math.PI / 180))
      rect.x(x)
    }

    const interval = setInterval(animate, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <Stage width={400} height={400}>
      <Layer>
        <Rect
          ref={rectRef}
          x={100}
          y={150}
          width={100}
          height={100}
          fill="#3b82f6"
          rotation={0}
        />
      </Layer>
    </Stage>
  )
}
```

## Performance Tips

```typescript
// 1. Use Layer batching for many shapes
<Stage>
  <Layer>
    {/* Render 1000+ shapes efficiently */}
  </Layer>
</Stage>

// 2. Disable listening on non-interactive shapes
<Rect listening={false} />

// 3. Cache expensive shapes
const cacheRef = useRef(null)
useEffect(() => {
  if (cacheRef.current) {
    cacheRef.current.cache()
  }
}, [])

// 4. Use requestAnimationFrame instead of setInterval
useEffect(() => {
  const animate = () => {
    // Update position
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}, [])

// 5. Detach event listeners when component unmounts
onMouseEnter={() => {}}  // Good: React cleans up automatically
```

## Gotchas & Best Practices

| Issue | Solution |
|-------|----------|
| Stage not responsive to window resize | Add `window.addEventListener('resize', handleResize)` and update Stage width/height |
| Memory leak from animations | Use `useEffect` cleanup to stop animations: `return () => cancelAnimationFrame(id)` |
| Dragging causes jittery movement | Add `dragBoundFunc` to constrain drag: `dragBoundFunc={(pos) => ({x: Math.max(0, pos.x), y: Math.max(0, pos.y)})}` |
| Text not rendering | Use `text` prop instead of children; ensure `fill` is set |
| Shapes not interactive | Set `draggable={true}` or add `onClick`; check that parent isn't blocking events |
| Performance with 1000+ shapes | Use Layer batching, set `listening={false}` on static shapes, cache groups |
| Images not loading | Ensure image is fully loaded before rendering: `<Image image={imgObj} />` where imgObj is HTMLImageElement |

## Resources

- **Official Docs**: https://konvajs.org/docs/
- **React-Konva**: https://konvajs.org/docs/react/
- **API Reference**: https://konvajs.org/api/Konva.html
- **Examples**: https://konvajs.org/docs/sandbox/
