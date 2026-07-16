import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Clock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const HistoryPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Document History</h1>
        <p className="text-sm text-muted-foreground mt-1">Review, search, and download your previously generated document drafts.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Recent Documents
          </CardTitle>
          <CardDescription>A listing of all documents synthesized by the agent pipeline in your current session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState
            title="History Feature Coming Soon"
            description="Local browser-based IndexedDB storage is currently being finalized. In Phase 3, your last 10 generated documents will display here automatically for easy preview and downloading."
            icon={Clock}
            action={
              <Button variant="outline" disabled className="gap-2">
                <Download className="h-4 w-4" /> Download Archive
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
export default HistoryPage
