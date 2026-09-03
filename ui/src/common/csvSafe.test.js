import { sanitizeCsvCell, sanitizeCsvData } from './csvSafe'
import { expect } from 'chai'

describe('csvSafe', () => {
  it('prefixes formula-triggering cells with a quote', () => {
    expect(sanitizeCsvCell('=HYPERLINK("http://evil")')).to.equal("'=HYPERLINK(\"http://evil\")")
    expect(sanitizeCsvCell('+cmd|calc')).to.equal("'+cmd|calc")
    expect(sanitizeCsvCell('-1+1')).to.equal("'-1+1")
    expect(sanitizeCsvCell('@SUM(A1)')).to.equal("'@SUM(A1)")
    expect(sanitizeCsvCell('\t=1')).to.equal("'\t=1")
    expect(sanitizeCsvCell('  =1')).to.equal("'  =1")
  })

  it('leaves ordinary values untouched', () => {
    expect(sanitizeCsvCell('Alice')).to.equal('Alice')
    expect(sanitizeCsvCell('')).to.equal('')
    expect(sanitizeCsvCell(null)).to.equal(null)
    expect(sanitizeCsvCell(undefined)).to.equal(undefined)
    expect(sanitizeCsvCell(42)).to.equal(42)
  })

  it('sanitizes every field of every row without mutating input', () => {
    const rows = [{ firstName: '=1+1', homeTown: 'Atlanta', age: 7 }]
    const out = sanitizeCsvData(rows)
    expect(out).to.deep.equal([{ firstName: "'=1+1", homeTown: 'Atlanta', age: 7 }])
    expect(rows[0].firstName).to.equal('=1+1')
  })
})
