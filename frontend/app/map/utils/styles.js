/* returns border and background styles based on course type */

export const getNodeStyle = (code = '', credit) => {
  if (['MATH', 'STAT', 'PHYS', 'CHEM'].some(p => code.startsWith(p)))
    return {
      border: '2px solid var(--color-science)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--color-science-bg)',
    }
  if (credit === 0)
    return {
      border: '2px dashed var(--color-required)',
      borderRadius: 'var(--radius-card)',
    }
  return {
    border: '2px solid var(--color-required)',
    borderRadius: 'var(--radius-card)',
  }
}

export const getElectiveStyle = (desc = '') => {
  const d = desc.toLowerCase()
  if (d.includes('complementary'))
    return {
      border: '2px solid var(--color-complementary)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--color-complementary-bg)',
    }
  if (d.includes('basic science'))
    return {
      border: '2px solid var(--color-science)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--color-science-bg)',
    }
  return {
    border: '2px solid var(--color-elective)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--color-elective-bg)',
  }
}
