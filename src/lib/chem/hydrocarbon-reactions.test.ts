import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import {
  acetylide,
  acidicPermanganate,
  addH2SO4,
  addHX,
  addHydrogenToBenzene,
  addChlorineUV,
  addToAlkyne,
  addX2,
  alkyneAcidity,
  aromatise,
  baeyer,
  chlorinateExcess,
  combust,
  controlledOxidation,
  cyclicPolymerise,
  decarboxylate,
  decarboxylateBenzoate,
  dehalogenate,
  dehydrate,
  eliminate,
  electrophilicSubstitution,
  fromCalciumCarbide,
  fromVicinalDihalide,
  halogenate,
  hydrate,
  hydrogenate,
  isomerise,
  kolbe,
  ozonolysis,
  ozonolysisReverse,
  polymerise,
  pyrolysis,
  reducePhenol,
  reduceAlkylHalide,
  relativeNitrationRate,
  steamReform,
  wurtz,
} from './hydrocarbon-reactions'

const g = parseSmiles

describe('alkane reactions', () => {
  it('hydrogenates an alkene and an alkyne to the alkane', () => {
    expect(hydrogenate(g('C=C')).products[0].name).toBe('ethane')
    expect(hydrogenate(g('C#C')).products[0].name).toBe('ethane')
    expect(hydrogenate(g('C=C')).equation).toBe('\\ce{CH2=CH2 + H2 -> CH3CH3}')
  })
  it('Lindlar gives cis and sodium-ammonia gives trans for but-2-yne', () => {
    const cis = hydrogenate(g('CC#CC'), { alkyne: 'lindlar' })
    const trans = hydrogenate(g('CC#CC'), { alkyne: 'sodium-ammonia' })
    expect(cis.products[0].name).toBe('cis-but-2-ene')
    expect(trans.products[0].name).toBe('trans-but-2-ene')
    expect(cis.conditions).toMatch(/Lindlar/)
    expect(trans.conditions).toMatch(/NH3/)
  })
  it('rejects hydrogenation of a saturated molecule', () => {
    expect(() => hydrogenate(g('CC'))).toThrow(RangeError)
  })
  it('reduces an alkyl halide with zinc and acid', () => {
    expect(reduceAlkylHalide(g('CCBr')).products[0].name).toBe('ethane')
    expect(() => reduceAlkylHalide(g('CCF'))).toThrow(RangeError)
  })
  it('Wurtz with one halide gives one alkane', () => {
    expect(wurtz(g('CCBr'), g('CCBr')).products[0].name).toBe('butane')
  })
  it('Wurtz with two different halides gives a mixture of three alkanes (Exercise 9.25)', () => {
    const r = wurtz(g('CCBr'), g('CCCBr'))
    expect(r.products.map((p) => p.name)).toEqual(['butane', 'pentane', 'hexane'])
    expect(r.equations.length).toBe(3)
  })
  it('sodalime decarboxylation loses one carbon', () => {
    const r = decarboxylate(g('CC(=O)O'))
    expect(r.products[0].name).toBe('methane')
    expect(() => decarboxylate(g('CC'))).toThrow(RangeError)
  })
  it('Kolbe electrolysis gives the alkane with twice the skeleton', () => {
    expect(kolbe(g('CC(=O)O')).products[0].name).toBe('ethane')
  })
  it('halogenation lists each monohalo product with the H count and degree', () => {
    const r = halogenate(g('CCC'), 'Cl')
    expect(r.products.length).toBe(2)
    const secondary = r.products.find((p) => p.degree === '2°')!
    const primary = r.products.find((p) => p.degree === '1°')!
    expect(secondary.hydrogens).toBe(2)
    expect(primary.hydrogens).toBe(6)
    expect(() => halogenate(g('C=C'), 'Cl')).toThrow(RangeError)
  })
  it('combustion is balanced for a hydrocarbon with a whole-number coefficient', () => {
    const r = combust(g('CCCC'))
    expect(r.equation).toBe('\\ce{2CH3CH2CH2CH3 + 13O2 -> 8CO2 + 10H2O}')
    expect(combust(g('C')).equation).toBe('\\ce{CH4 + 2O2 -> CO2 + 2H2O}')
  })
  it('controlled oxidation covers NCERT examples and rejects others', () => {
    expect(controlledOxidation('methanol').products[0].name).toBe('methanol')
    expect(controlledOxidation('methanal').products[0].name).toBe('methanal')
    expect(controlledOxidation('ethanoic-acid').products[0].name).toBe('ethanoic acid')
    expect(() => controlledOxidation('nope' as never)).toThrow(RangeError)
  })
  it('isomerises n-hexane to the two methylpentanes', () => {
    expect(isomerise(g('CCCCCC')).products.length).toBe(2)
    expect(() => isomerise(g('CCCC'))).toThrow(RangeError)
  })
  it('aromatises hexane to benzene and heptane to toluene', () => {
    expect(aromatise(g('CCCCCC')).products[0].name).toBe('benzene')
    expect(aromatise(g('CCCCCCC')).products[0].name).toBe('methylbenzene')
    expect(() => aromatise(g('CC'))).toThrow(RangeError)
  })
  it('steam reforming of methane is balanced', () => {
    expect(steamReform(g('C')).equation).toBe('\\ce{CH4 + H2O -> CO + 3H2}')
    expect(() => steamReform(g('CC'))).toThrow(RangeError)
  })
  it('pyrolysis of n-hexane and dodecane', () => {
    expect(pyrolysis(g('CCCCCC')).equations.length).toBe(3)
    expect(pyrolysis(g('CCCCCCCCCCCC')).products.map((p) => p.name)).toEqual(['heptane', 'pent-1-ene'])
    expect(() => pyrolysis(g('CC'))).toThrow(RangeError)
  })
})

describe('alkene reactions', () => {
  it('Markovnikov HBr addition gives 2-bromopropane from propene', () => {
    const r = addHX(g('C=CC'), 'HBr')
    expect(r.products.find((p) => p.major)!.name).toBe('2-bromopropane')
    expect(r.equation).toBe('\\ce{CH2=CHCH3 + HBr -> CH3CH(CH3)Br}')
  })
  it('peroxide HBr gives 1-bromopropane (anti-Markovnikov)', () => {
    const r = addHX(g('C=CC'), 'HBr', { peroxide: true })
    expect(r.products.find((p) => p.major)!.name).toBe('1-bromopropane')
  })
  it('peroxide with HCl or HI is rejected', () => {
    expect(() => addHX(g('C=CC'), 'HCl', { peroxide: true })).toThrow(RangeError)
    expect(() => addHX(g('C=CC'), 'HI', { peroxide: true })).toThrow(RangeError)
  })
  it('HX addition needs a C=C', () => {
    expect(() => addHX(g('CC'), 'HCl')).toThrow(RangeError)
  })
  it('bromine adds across the double bond to a vicinal dibromide', () => {
    const r = addX2(g('C=C'), 'Br2')
    expect(r.products[0].name).toBe('1,2-dibromoethane')
    expect(r.equation).toBe('\\ce{CH2=CH2 + Br2 -> BrCH2CH2Br}')
  })
  it('sulphuric acid addition gives the Markovnikov hydrogen sulphate', () => {
    const r = addH2SO4(g('C=CC'))
    expect(r.products[0].name).toBe('propan-2-yl hydrogen sulphate')
  })
  it('hydration is Markovnikov', () => {
    expect(hydrate(g('C=CC')).products[0].name).toBe('propan-2-ol')
    expect(hydrate(g('C=C')).products[0].name).toBe('ethanol')
  })
  it('Baeyer oxidation gives the vicinal diol', () => {
    expect(baeyer(g('C=C')).products[0].name).toBe('ethane-1,2-diol')
  })
  it('acidic permanganate cleaves the C=C to acids and ketones', () => {
    const r = acidicPermanganate(g('CC=CC'))
    expect(r.products.map((p) => p.name)).toEqual(['ethanoic acid', 'ethanoic acid'])
    expect(() => acidicPermanganate(g('CC'))).toThrow(RangeError)
  })
  it('ozonolysis leaves an aromatic ring alone and cleaves the side-chain C=C', () => {
    const r = ozonolysis(g('CCC=CC1=CC=CC=C1'))
    expect(r.products.map((p) => p.name)).toEqual(['propanal', 'benzaldehyde'])
  })
  it('ozonolysis of the Kekulé form of o-xylene cleaves the ring when asked', () => {
    const r = ozonolysis(g('CC1=C(C)C=CC=C1'), { aromatic: 'cleave' })
    expect(r.products.length).toBe(3)
  })
  it('ozonolysis of 2-methylbut-2-ene gives propanone and ethanal', () => {
    const names = ozonolysis(g('CC(C)=CC')).products.map((p) => p.name)
    expect(names).toEqual(['propan-2-one', 'ethanal'])
  })
  it('reverse ozonolysis rebuilds the alkene from its two carbonyl compounds', () => {
    const r = ozonolysisReverse([g('CC=O'), g('CC(C)=O')])
    expect(r.products[0].name).toBe('2-methylbut-2-ene')
  })
  it('polymerises ethene to poly(ethene)', () => {
    expect(polymerise(g('C=C')).products[0].name).toBe('poly(ethene)')
  })
  it('eliminates an alkyl halide to every alkene that can form', () => {
    expect(eliminate(g('CCC(Br)C')).products.length).toBe(2)
    expect(eliminate(g('CCC(Br)C')).products.find((p) => p.major)).toBeUndefined()
  })
  it('dehydrates an alcohol with conc. H2SO4', () => {
    expect(dehydrate(g('CCO')).products[0].name).toBe('ethene')
    expect(() => dehydrate(g('CC'))).toThrow(RangeError)
  })
  it('dehalogenates a vicinal dihalide with zinc', () => {
    expect(dehalogenate(g('BrCCBr')).products[0].name).toBe('ethene')
    expect(() => dehalogenate(g('BrCCCBr'))).toThrow(RangeError)
  })
})

describe('alkyne reactions', () => {
  it('a terminal alkyne is acidic and an internal one is not', () => {
    expect(alkyneAcidity(g('C#C')).acidic).toBe(true)
    expect(alkyneAcidity(g('CC#CC')).acidic).toBe(false)
  })
  it('forms sodium acetylide with sodium or sodamide', () => {
    expect(acetylide(g('C#C'), 'Na').products[0].name).toBe('sodium ethynide')
    expect(acetylide(g('C#C'), 'NaNH2').equation).toMatch(/NH3/)
    expect(() => acetylide(g('CC#CC'), 'Na')).toThrow(RangeError)
  })
  it('H2 addition goes through the alkene to the alkane', () => {
    const r = addToAlkyne(g('C#C'), 'H2')
    expect(r.products.map((p) => p.name)).toEqual(['ethene', 'ethane'])
  })
  it('X2 addition gives a dihaloalkene then the tetrahalide', () => {
    const r = addToAlkyne(g('C#C'), 'X2')
    expect(r.products.map((p) => p.name)).toEqual(['1,2-dibromoethene', '1,1,2,2-tetrabromoethane'])
  })
  it('HX addition twice gives a geminal dihalide', () => {
    const r = addToAlkyne(g('C#C'), 'HX')
    expect(r.products[1].name).toBe('1,1-dibromoethane')
  })
  it('Hg2+ hydration gives ethanal from ethyne and a ketone from other alkynes', () => {
    expect(addToAlkyne(g('C#C'), 'H2O').products[1].name).toBe('ethanal')
    expect(addToAlkyne(g('CC#C'), 'H2O').products[1].name).toBe('propan-2-one')
  })
  it('cyclic polymerisation of ethyne gives benzene', () => {
    expect(cyclicPolymerise(g('C#C')).products[0].name).toBe('benzene')
    expect(cyclicPolymerise(g('C#C')).equation).toBe('\\ce{3CH#CH -> C6H6}')
  })
  it('ethyne from calcium carbide', () => {
    expect(fromCalciumCarbide().products[0].name).toBe('ethyne')
  })
  it('dihalide to alkyne', () => {
    expect(fromVicinalDihalide(g('BrCCBr')).products[0].name).toBe('ethyne')
  })
})

describe('arene reactions', () => {
  it('nitration of benzene gives nitrobenzene and names the electrophile', () => {
    const r = electrophilicSubstitution(g('c1ccccc1'.toUpperCase().length ? 'C1=CC=CC=C1' : ''), 'nitration')
    expect(r.products[0].name).toBe('nitrobenzene')
    expect(r.electrophile!.formula).toBe('NO2+')
    expect(r.sigmaComplex).toBeDefined()
  })
  it('toluene nitration gives ortho and para products (CH3 activates)', () => {
    const r = electrophilicSubstitution(g('CC1=CC=CC=C1'), 'nitration')
    expect(r.products.map((p) => p.position).sort()).toEqual(['ortho', 'para'])
    expect(r.substituent!.activating).toBe(true)
    expect(r.substituent!.directs).toBe('ortho-para')
  })
  it('nitrobenzene nitration gives meta', () => {
    const r = electrophilicSubstitution(g('O=[N+]([O-])C1=CC=CC=C1'), 'nitration')
    expect(r.products.every((p) => p.position === 'meta')).toBe(true)
    expect(r.substituent!.activating).toBe(false)
  })
  it('rejects a ring with two substituents and an unknown kind', () => {
    expect(() => electrophilicSubstitution(g('CC1=CC(C)=CC=C1'), 'nitration')).toThrow(RangeError)
    expect(() => electrophilicSubstitution(g('C1=CC=CC=C1'), 'fluorination' as never)).toThrow(RangeError)
  })
  it('chlorinates benzene in excess to hexachlorobenzene', () => {
    expect(chlorinateExcess(g('C1=CC=CC=C1')).equation).toBe('\\ce{C6H6 + 6Cl2 -> C6Cl6 + 6HCl}')
  })
  it('hydrogenates benzene to cyclohexane and adds chlorine to BHC', () => {
    expect(addHydrogenToBenzene(g('C1=CC=CC=C1')).products[0].name).toBe('cyclohexane')
    expect(addChlorineUV(g('C1=CC=CC=C1')).products[0].name).toMatch(/hexachlorocyclohexane/)
  })
  it('benzene preparations', () => {
    expect(decarboxylateBenzoate().products[0].name).toBe('benzene')
    expect(reducePhenol(g('OC1=CC=CC=C1')).products[0].name).toBe('benzene')
  })
  it('ranks nitration rate: fewer deactivating first', () => {
    const r = relativeNitrationRate([g('O=[N+]([O-])C1=CC=CC=C1'), g('C1=CC=CC=C1'), g('CC1=CC=CC=C1')])
    expect(r.order).toEqual([2, 1, 0])
  })
})

describe('reaction records', () => {
  it('every reaction returns a condition text', () => {
    expect(hydrogenate(g('C=C')).conditions.length).toBeGreaterThan(0)
    expect(addX2(g('C=C'), 'Cl2').conditions.length).toBeGreaterThan(0)
  })
})
