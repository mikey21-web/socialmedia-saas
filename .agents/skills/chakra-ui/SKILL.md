---
name: chakra-ui
description: Build React UIs with Chakra UI v3. Use when using Chakra components like Button/Input/Modal/Table, customizing Chakra theme/tokens, using Chakra's style props, implementing dark mode with Chakra, building accessible forms, or using Chakra UI with Next.js.
---

# Chakra UI Expert Guide (v3)

## Installation

```bash
npm install @chakra-ui/react @emotion/react
```

```typescript
// app/providers.tsx (Next.js)
'use client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
}

// app/layout.tsx
import { Providers } from './providers'
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Custom Theme (v3)

```typescript
// theme.ts
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          900: { value: '#1e3a8a' },
        },
      },
      fonts: {
        heading: { value: '"Inter", sans-serif' },
        body: { value: '"Inter", sans-serif' },
      },
      radii: {
        md: { value: '8px' },
      },
    },
    semanticTokens: {
      colors: {
        'chakra-body-bg': {
          _light: { value: '{colors.white}' },
          _dark: { value: '{colors.gray.900}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)

// Use in providers:
<ChakraProvider value={system}>
```

## Common Components

```tsx
import {
  Box, Stack, HStack, VStack, Flex, Grid, GridItem,
  Container, Center, Spacer,
  Heading, Text, Link, Badge, Tag,
  Button, IconButton, ButtonGroup,
  Input, Textarea, Select, Checkbox, Radio, Switch,
  FormControl, FormLabel, FormErrorMessage, FormHelperText,
  Image, Avatar, Icon,
  Card, CardHeader, CardBody, CardFooter,
  Divider, Separator,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Spinner, Progress, CircularProgress,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Tooltip, Popover,
  Drawer, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, useToast, useColorMode,
} from '@chakra-ui/react'

function ExamplePage() {
  const { open, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={6} align="stretch">
        <Heading size="xl">Dashboard</Heading>

        <HStack gap={4}>
          <Button colorPalette="blue" onClick={onOpen}>Open Modal</Button>
          <Button variant="outline">Cancel</Button>
          <Badge colorPalette="green">Active</Badge>
        </HStack>

        <Card>
          <CardHeader>
            <Heading size="md">User Stats</Heading>
          </CardHeader>
          <CardBody>
            <Text color="fg.muted">Some statistics here</Text>
          </CardBody>
        </Card>

        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Warning!</AlertTitle>
          <AlertDescription>Please verify your email.</AlertDescription>
        </Alert>
      </VStack>

      <Modal isOpen={open} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Action</ModalHeader>
          <ModalCloseButton />
          <ModalBody>Are you sure?</ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorPalette="red">Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}
```

## Style Props

```tsx
// Chakra's style props map to CSS
<Box
  bg="blue.500"          // background-color
  color="white"          // color
  p={4}                  // padding: 4 * 4px = 16px
  px={6} py={3}          // paddingX, paddingY
  mt={4}                 // marginTop
  borderRadius="md"      // border-radius
  border="1px solid"
  borderColor="gray.200"
  boxShadow="md"
  display="flex"
  alignItems="center"
  justifyContent="space-between"
  gap={3}
  // Responsive (mobile-first)
  w={{ base: 'full', md: 'auto' }}
  fontSize={{ base: 'sm', lg: 'md' }}
  flexDir={{ base: 'column', md: 'row' }}
  // Hover/focus
  _hover={{ bg: 'blue.600', transform: 'translateY(-1px)' }}
  _focus={{ outline: 'none', ring: 2, ringColor: 'blue.400' }}
  // Dark mode
  bg={{ _light: 'white', _dark: 'gray.800' }}
>
  Content
</Box>
```

## Forms

```tsx
import { useForm } from 'react-hook-form'
import {
  FormControl, FormLabel, FormErrorMessage,
  Input, Button, VStack,
} from '@chakra-ui/react'

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={4}>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
            })}
          />
          <FormErrorMessage>{errors.email?.message as string}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 chars' } })}
          />
          <FormErrorMessage>{errors.password?.message as string}</FormErrorMessage>
        </FormControl>

        <Button type="submit" colorPalette="blue" width="full" loading={isSubmitting}>
          Sign In
        </Button>
      </VStack>
    </form>
  )
}
```

## Toast Notifications

```tsx
import { useToast } from '@chakra-ui/react'

function MyComponent() {
  const toast = useToast()

  function showSuccess() {
    toast({
      title: 'Saved successfully',
      description: 'Your changes have been saved.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    })
  }

  function showError(message: string) {
    toast({
      title: 'Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
  }
}
```

## Dark Mode

```tsx
import { useColorMode, Button, Icon } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'

function DarkModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Button onClick={toggleColorMode} variant="ghost">
      {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}
```

## Drawer (Side Panel)

```tsx
import { useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter, Button } from '@chakra-ui/react'

function SidePanel() {
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button onClick={onOpen}>Open Filters</Button>
      <Drawer isOpen={open} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody>
            {/* filter controls */}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorPalette="blue">Apply</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
```
