'use client'

import { CommandRegion } from 'commandry/react'
import { AppSidebar } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { AppContextMenu } from '@/components/context-menu'
import { MessageView } from '@/components/message-view'
import { ScopeDebug } from '@/components/scope-debug'
import { SequenceHint } from '@/components/sequence-hint'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function MailShell() {
  return (
    <CommandRegion region="app" ctx={{ app: 'demo-mail' }} active hover={false}>
      <div className="flex min-h-dvh min-w-0 flex-col">
        <AppContextMenu>
          <TooltipProvider>
            <CommandRegion region="mailbox" ctx={{ region: 'mail' }} active hover={false}>
              <SidebarProvider
                style={{ "--sidebar-width": "350px" } as React.CSSProperties}
              >
                <AppSidebar />
                <SidebarInset>
                  <MessageView />
                </SidebarInset>
              </SidebarProvider>
            </CommandRegion>
          </TooltipProvider>
        </AppContextMenu>
      </div>
      <CommandPalette />
      <ScopeDebug />
      <SequenceHint />
    </CommandRegion>
  )
}
