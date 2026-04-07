'use client'

import { CommandScope } from 'commandry/react'
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
    <CommandScope scope="app" ctx={{ app: 'demo-mail' }} activateOn="mount">
      <div className="flex min-h-dvh min-w-0 flex-col">
        <AppContextMenu>
          <TooltipProvider>
            <CommandScope scope="mailbox" ctx={{ region: 'mail' }} activateOn="mount">
              <SidebarProvider
                style={{ "--sidebar-width": "350px" } as React.CSSProperties}
              >
                <AppSidebar />
                <SidebarInset>
                  <MessageView />
                </SidebarInset>
              </SidebarProvider>
            </CommandScope>
          </TooltipProvider>
        </AppContextMenu>
      </div>
      <CommandPalette />
      <ScopeDebug />
      <SequenceHint />
    </CommandScope>
  )
}
