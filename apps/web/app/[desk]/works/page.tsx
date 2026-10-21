import { PageHeader } from '@nook/ui/components/page-header.tsx'

import { Board } from '@/components/board.tsx'
import { DisplayMenu } from '@/components/display-menu.tsx'
import { orGap } from '@/components/gap.tsx'
import { boardOptions } from '@/lib/board.ts'
import { board, openDesk } from '@/lib/desk.ts'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ desk: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Works({ params, searchParams }: Props) {
  const desk = await openDesk(params)
  const options = boardOptions(await searchParams)
  return (
    <>
      <PageHeader title="Board" description={`The items of ${desk.name} by phase, from the spec to done.`} actions={<DisplayMenu base={desk.base} options={options} />} />
      {orGap(() => <Board cards={board(desk.dir)} options={options} base={desk.base} />)}
    </>
  )
}
