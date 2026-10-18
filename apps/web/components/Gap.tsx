import type { EvError } from '@nook/shared/errors.ts'

/** A gap of the desk, such as a ledger that needs a migration, with its fix, in place of the data of a page. */
export function Gap({ error }: { error: EvError }) {
  return (
    <div className="bn-alert" data-tone="warning">
      <div className="bn-alert__icon">!</div>
      <div>
        <div className="bn-alert__label">{error.message.charAt(0).toUpperCase() + error.message.slice(1)}</div>
        {error.fix ? <div className="bn-alert__body">Fix: {error.fix}</div> : null}
      </div>
    </div>
  )
}
