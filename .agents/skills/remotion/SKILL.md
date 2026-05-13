---
name: remotion
description: Create programmatic videos with React using Remotion. Use when creating video content with React code, building animated visualizations, generating social media videos, making data-driven video content, or rendering videos programmatically.
---

# Remotion — Videos in React

## Setup

```bash
npm create video@latest
# or add to existing:
npm install remotion @remotion/player @remotion/renderer
```

## Core Concepts

```
Composition → a video clip (width, height, fps, duration)
Sequence → a time offset container
AbsoluteFill → fills the entire frame
useCurrentFrame() → current frame number
useVideoConfig() → fps, durationInFrames, width, height
interpolate() → map frame number to any value
spring() → spring animation
```

## Basic Composition

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

export function MyVideo() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()

  // Fade in over first 30 frames
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })

  // Move from left to center over first 60 frames
  const translateX = interpolate(frame, [0, 60], [-200, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#0f0f0f' }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: `translate(-50%, -50%) translateX(${translateX}px)`,
        opacity,
        color: 'white',
        fontSize: 80,
        fontWeight: 'bold',
      }}>
        Hello World
      </div>
    </AbsoluteFill>
  )
}
```

## Register Composition

```tsx
// src/Root.tsx
import { Composition } from 'remotion'
import { MyVideo } from './MyVideo'

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}     // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'My Video',
          color: '#ff0080',
        }}
      />
    </>
  )
}
```

## interpolate() Patterns

```tsx
import { interpolate } from 'remotion'

// Fade in then hold
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

// Bounce in and out
const scale = interpolate(
  frame,
  [0, 15, 30, 45, 60],
  [0, 1.2, 1, 1.05, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
)

// Color animation (use for position, not directly for color)
const position = interpolate(frame, [0, 60], [0, 100])
```

## spring() Animation

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

const frame = useCurrentFrame()
const { fps } = useVideoConfig()

const scale = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: {
    damping: 10,    // higher = less bounce
    stiffness: 100, // higher = faster
    mass: 1,
  },
})

const translateY = spring({ frame, fps, from: -100, to: 0, durationInFrames: 30 })
```

## Sequence (Timing Multiple Elements)

```tsx
import { Sequence, AbsoluteFill } from 'remotion'

export function Timeline() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Shows from frame 0 to 60 */}
      <Sequence from={0} durationInFrames={60}>
        <Title />
      </Sequence>

      {/* Shows from frame 30 to end */}
      <Sequence from={30}>
        <Subtitle />
      </Sequence>

      {/* Always visible */}
      <Background />
    </AbsoluteFill>
  )
}
```

## Audio & Video

```tsx
import { Audio, Video, OffthreadVideo } from 'remotion'

// Background music
<Audio src={staticFile('music.mp3')} volume={0.5} />

// Sound effect at frame 30
<Sequence from={30}>
  <Audio src={staticFile('pop.mp3')} />
</Sequence>

// Video clip
<OffthreadVideo src={staticFile('clip.mp4')} style={{ width: '100%' }} />
```

## Data-Driven Video

```tsx
interface Props {
  title: string
  stats: Array<{ label: string; value: number }>
  color: string
}

export function DataVideo({ title, stats, color }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: '#fff', padding: 80 }}>
      <h1 style={{ fontSize: 72, fontWeight: 800 }}>{title}</h1>
      {stats.map((stat, i) => {
        const barWidth = spring({
          frame: frame - i * 10,  // stagger by 10 frames each
          fps,
          from: 0,
          to: stat.value,
          config: { damping: 12 },
        })
        return (
          <div key={stat.label} style={{ marginBottom: 24 }}>
            <span>{stat.label}</span>
            <div style={{ width: `${barWidth}%`, height: 40, background: color, borderRadius: 8 }} />
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
```

## Rendering

```bash
# Preview in browser
npx remotion studio

# Render to file
npx remotion render src/index.ts MyVideo output.mp4
npx remotion render --codec=gif output.gif

# With custom props
npx remotion render src/index.ts MyVideo output.mp4 --props='{"title":"Hello"}'

# Frames only (PNG sequence)
npx remotion render src/index.ts MyVideo --sequence
```

## Programmatic Rendering (Node.js)

```typescript
import { renderMedia, selectComposition } from '@remotion/renderer'

const comp = await selectComposition({
  serveUrl: 'http://localhost:3000',  // or bundle path
  id: 'MyVideo',
  inputProps: { title: 'Generated!' },
})

await renderMedia({
  composition: comp,
  serveUrl: 'http://localhost:3000',
  codec: 'h264',
  outputLocation: 'out/video.mp4',
  inputProps: { title: 'My Rendered Video' },
})
```
