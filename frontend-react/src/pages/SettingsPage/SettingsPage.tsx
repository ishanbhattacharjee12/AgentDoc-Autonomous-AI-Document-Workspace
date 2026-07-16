import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sliders, Settings, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react'
import { useSettings, type UserSettings } from '@/hooks/useSettings'
import type { DocumentFormat, ExecutionMode } from '@/types/api'

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings, resetToDefaults } = useSettings()

  // Local draft state for modifying preferences
  const [format, setFormat] = useState<DocumentFormat>('pdf')
  const [mode, setMode] = useState<ExecutionMode>('standard')
  const [requireReview, setRequireReview] = useState(false)
  const [ignoreCache, setIgnoreCache] = useState(false)

  // Notification states
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load preferences when DB values are loaded
  useEffect(() => {
    setFormat(settings.format)
    setMode(settings.mode)
    setRequireReview(settings.requireReview)
    setIgnoreCache(settings.ignoreCache)
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const newSettings: UserSettings = {
        format,
        mode,
        requireReview,
        ignoreCache,
      }
      await saveSettings(newSettings)
      setSaveSuccess(true)
      // Hide success notification after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Reset all preferences to default configurations?')) {
      await resetToDefaults()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default formats, execution modes, human-in-the-loop policies, and advanced settings.
        </p>
      </div>

      {/* 1. User Preferences Section */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4 bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" /> User Preferences
          </CardTitle>
          <CardDescription>
            Configure default variables and options pre-populated during document generation.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 flex flex-col gap-6">
          {/* Default Output Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Default Output Format</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Preferred default format for newly synthesized documents.
              </p>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={format} onValueChange={(val) => setFormat(val as DocumentFormat)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                  <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  <SelectItem value="md">Markdown Document (.md)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default Pipeline Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Default Pipeline Mode</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Default execution depth for standard, advanced multi-agent, or adaptive runs.
              </p>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={mode} onValueChange={(val) => setMode(val as ExecutionMode)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Generation</SelectItem>
                  <SelectItem value="advanced">Advanced Pipeline</SelectItem>
                  <SelectItem value="adaptive">Adaptive Sequence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Require Review Toggle */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Always Require Plan Review</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pause the agent pipeline after planning to review and edit task checklists on every run.
              </p>
            </div>
            <Switch checked={requireReview} onCheckedChange={setRequireReview} />
          </div>

          {/* Placeholder: Custom AI Writing Style */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5 opacity-55">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Custom Writing Style <Sparkles className="h-3 w-3 text-amber-500" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload custom style sheets or define system instructions to align document syntax with specific branding rules. (Phase 3)
              </p>
            </div>
            <Switch checked={false} disabled />
          </div>

          {/* Placeholder: Knowledge Glossary */}
          <div className="flex items-center justify-between gap-4 opacity-55">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Knowledge Context Glossary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide custom business definitions, keywords, or background files to contextualize prompt reasoning. (Phase 3)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="text-xs">
              Configure Glossary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Advanced Developer Settings Section */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4 bg-muted/10">
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-4 w-4 text-muted-foreground" /> Advanced Settings
          </CardTitle>
          <CardDescription>
            Configure debug mode parameters, model routing overrides, and request cache controls.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 flex flex-col gap-6">
          {/* Cache Bypass toggle */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Bypass Request Cache</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ignore local request-response cache and force the agent pipeline to rerun fresh LLM calls.
              </p>
            </div>
            <Switch checked={ignoreCache} onCheckedChange={setIgnoreCache} />
          </div>

          {/* Placeholder: Provider Override */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 opacity-55">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                LLM Provider Override <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Force specific LLM model routing overrides (e.g., Gemini 2.5 Pro vs. DeepSeek Coder). (Phase 3)
              </p>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value="system" disabled>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="System Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Placeholder: Pipeline Logs Switch */}
          <div className="flex items-center justify-between gap-4 opacity-55">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Verbose Debug Logs <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expose raw model console logs and budget client details during the generation sequence. (Phase 3)
              </p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Action Footer row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border p-4 rounded-lg">
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-[fadeIn_0.15s_ease-out]">
              <CheckCircle2 className="h-4 w-4" /> Changes saved successfully!
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground font-semibold px-6 py-2 cursor-pointer shadow-sm hover:bg-primary/95 transition-all text-xs"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
