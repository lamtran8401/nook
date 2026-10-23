import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { Board } from '@/components/board.tsx'
import { DisplayMenu } from '@/components/display-menu.tsx'
import { orGap } from '@/components/gap.tsx'
import { boardOptions } from '@/lib/board.ts'
import { board, openWorkspace } from '@/lib/workspace.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ workspace: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Works({ params, searchParams }: Props) {
  const workspace = await openWorkspace(params)
  const options = boardOptions(await searchParams)
  return (
    <>
      <PageHeader title="Board" description={`The items of ${workspace.name} by phase, from the spec to done.`} actions={<DisplayMenu base={workspace.base} options={options} />} />
      {orGap(() => <Board cards={board(workspace.dir)} options={options} base={workspace.base} />)}
    </>
  )
}
