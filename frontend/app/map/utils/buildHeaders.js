import { COL_WIDTH } from './constants'

const YEAR_LABELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year']

export const buildHeaders = (numCols) => {
  const numYears = Math.ceil(numCols / 2)

  const yearHeaders = YEAR_LABELS.slice(0, numYears).map((label, i) => ({
    id: `year-${i}`,
    type: 'yearHeader',
    draggable: false,
    selectable: false,
    data: { label },
    position: { x: i * 2 * COL_WIDTH, y: 0 },
  }))

  const termHeaders = YEAR_LABELS.slice(0, numYears).flatMap((_, yi) =>
    ['Fall', 'Winter']
      .slice(0, numCols - yi * 2 > 1 ? 2 : 1)
      .map((term, ti) => ({
        id: `term-${yi}-${ti}`,
        type: 'termHeader',
        draggable: false,
        selectable: false,
        data: { label: term },
        position: { x: (yi * 2 + ti) * COL_WIDTH, y: 46 },
      }))
  )

  return [...yearHeaders, ...termHeaders]
}