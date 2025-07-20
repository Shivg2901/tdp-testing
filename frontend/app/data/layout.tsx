'use client';

import { AppBar } from '@/components/app';
import { LeftSideBar } from '@/components/left-panel';
import { RightSideBar } from '@/components/right-panel';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

export default function NetworkLayoutPage({ children }: { children: React.ReactNode }) {
  const [leftSidebar, setLeftSidebar] = React.useState<boolean>(true);
  const [rightSidebar, setRightSidebar] = React.useState<boolean>(true);

  return (
    <div className='h-screen flex flex-col'>
      <div className='bg-primary h-12 flex items-center justify-between p-2'>
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setLeftSidebar(!leftSidebar)}>
          {leftSidebar ? <ChevronLeft className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
        </Button>
        <AppBar />
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setRightSidebar(!rightSidebar)}>
          {rightSidebar ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </Button>
      </div>

      <ResizablePanelGroup direction='horizontal' className='flex flex-1'>
        <ResizablePanel defaultSize={16} minSize={16} className={leftSidebar ? 'block' : 'hidden'}>
          <LeftSideBar graphConfigPresent={false} />
        </ResizablePanel>
        <ResizableHandle withHandle className={leftSidebar ? 'flex' : 'hidden'} />
        <ResizablePanel defaultSize={68} className='bg-white h-full w-full'>
          {children}
        </ResizablePanel>
        <ResizableHandle withHandle className={rightSidebar ? 'flex' : 'hidden'} />
        <ResizablePanel defaultSize={16} minSize={16} className={rightSidebar ? 'block' : 'hidden'}>
          <RightSideBar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
