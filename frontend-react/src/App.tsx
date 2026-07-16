import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorState } from '@/components/ui/error-state'
import { Inbox, RefreshCw } from 'lucide-react'

function App() {
  const [toggleState, setToggleState] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-background text-foreground p-8 max-w-5xl mx-auto flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">AgentDoc UI</h1>
        <p className="text-muted-foreground mt-1">Design System Primitives Showcase & Visual Verification</p>
      </div>

      {/* Buttons & Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons & Badges</CardTitle>
          <CardDescription>Standard interactive elements styled using custom theme tokens.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
          
          <div className="flex gap-2 ml-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Inputs & Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs & Selection</CardTitle>
          <CardDescription>Form controls mapped with Tailwind colors.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Text Input</label>
            <Input 
              placeholder="Type something..." 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
            />
            {inputValue && <p className="text-xs text-muted-foreground mt-1">Typed: {inputValue}</p>}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Dropdown Select</label>
            <Select value={selectValue} onValueChange={(val) => setSelectValue(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="docx">Word Document</SelectItem>
                <SelectItem value="md">Markdown File</SelectItem>
              </SelectContent>
            </Select>
            {selectValue && <p className="text-xs text-muted-foreground mt-1">Selected: {selectValue}</p>}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Toggle Switch</label>
            <div className="flex items-center gap-3 mt-2">
              <Switch checked={toggleState} onCheckedChange={setToggleState} />
              <span className="text-sm font-medium text-foreground">
                {toggleState ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Header */}
      <Card>
        <CardHeader>
          <CardTitle>Section Headers</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionHeader 
            title="Generated Document Options" 
            subtitle="Configure parameters for the document synth pipeline" 
            actions={
              <Button size="sm" variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Reset Settings
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Placeholders, Loaders, and Error Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empty State */}
        <div className="flex flex-col gap-4">
          <SectionHeader title="Empty State Case" />
          <EmptyState 
            title="No reports generated yet" 
            description="Enter a prompt outline on the main tab to invoke the document synthesis agent." 
            icon={Inbox}
            action={<Button variant="outline">Start Generating</Button>}
          />
        </div>

        {/* Loading State */}
        <div className="flex flex-col gap-4">
          <SectionHeader title="Loading State Case" />
          <Card className="h-[212px] flex items-center justify-center">
            <LoadingState 
              title="Executing Synthesis Plan" 
              description="Structuring document sections and checking formatting models..." 
            />
          </Card>
        </div>
      </div>

      {/* Graceful Errors */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Graceful Failure States (Addendum 5)" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorState 
            type="network" 
            message="FastAPI server is not reachable on port 8000. Ensure the python backend is running."
            onRetry={() => console.log('Retrying...')}
          />
          <ErrorState 
            type="timeout" 
            message="The synthesising stage exceeded the maximum time budget of 90 seconds."
            onRetry={() => console.log('Retrying...')}
            onCancel={() => console.log('Cancelling...')}
          />
        </div>

        {/* Error state preserving preview content */}
        <div className="mt-4">
          <ErrorState 
            type="export-fail" 
            message="Document compiled successfully, but PDF file generation failed."
            onRetry={() => console.log('Retrying export...')}
          >
            <div className="p-4 bg-background border border-border rounded">
              <h5 className="font-bold text-foreground">1. Executive Summary</h5>
              <p className="text-xs text-muted-foreground mt-2">
                The objective is to deploy a comprehensive customer support automated bot to lower total resolution times.
              </p>
            </div>
          </ErrorState>
        </div>
      </div>
    </div>
  )
}

export default App
