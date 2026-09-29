import { FilterToolbar } from '../filters/filter-toolbar'
import { ColumnsMenu } from './columns-menu'
import { RequestTable } from './request-table'
import { TimeHistogram } from './time-histogram'

export function RequestsView() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterToolbar actions={<ColumnsMenu />} />
      <TimeHistogram />
      <RequestTable />
    </div>
  )
}
