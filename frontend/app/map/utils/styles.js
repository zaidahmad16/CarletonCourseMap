export const getNodeStyle = (code = '', credit) => {
  if (['MATH', 'STAT', 'PHYS', 'CHEM'].some(p => code.startsWith(p)))
    return { border: '3px solid #16a34a', borderRadius: 4 }
  if (credit === 0)
    return { border: '3px dashed #111', borderRadius: 4 }
  return { border: '3px solid #111', borderRadius: 4 }
}

export const getElectiveStyle = (desc = '') => {
  const d = desc.toLowerCase()
  if (d.includes('complementary')) return { border: '3px solid #dc2626', borderRadius: 4 }
  if (d.includes('basic science'))  return { border: '3px solid #16a34a', borderRadius: 4 }
  return { border: '3px solid #ea580c', borderRadius: 4 }
}