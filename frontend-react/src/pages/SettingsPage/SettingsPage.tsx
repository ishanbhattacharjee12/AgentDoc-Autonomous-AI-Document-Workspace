import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sliders } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure workspace defaults, LLM threshold preferences, and pipeline parameters.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4 text-muted-foreground" /> Pipeline Defaults
          </CardTitle>
          <CardDescription>Default options pre-populated during document generation. (Coming Soon in Phase 3)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-6 opacity-60 pointer-events-none">
          {/* Default Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Default Output Format</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Preferred file format for synthesized document builds.</p>
            </div>
            <div className="w-[200px]">
              <Select value="pdf" disabled onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue placeholder="PDF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  <SelectItem value="md">Markdown (.md)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Review Steps */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Always Require Plan Review</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Force the planner stage to pause for user review on every single execution run.</p>
            </div>
            <Switch checked={false} disabled onCheckedChange={() => {}} />
          </div>

          {/* Cache Settings */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Bypass Request Cache</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Instruct the pipeline to bypass cache entries and execute fresh LLM calls.</p>
            </div>
            <Switch checked={false} disabled onCheckedChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 opacity-60">
        <Button variant="outline" disabled>Cancel</Button>
        <Button variant="default" disabled className="bg-primary text-primary-foreground">Save Preferences</Button>
      </div>
    </div>
  )
}
export default SettingsPage
