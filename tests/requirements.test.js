import { describe, it, expect } from 'vitest'
import { REQUIREMENTS, requirementById } from '../src/docs/requirements.js'
import { RISKS, riskById, rpn } from '../src/docs/risks.js'
import { USER_PROFILES } from '../src/docs/userProfiles.js'

// These assertions enforce the INCOSE characteristics that can be checked
// mechanically. The rest (necessary, correct, feasible) need human review.
describe('requirement quality', () => {
  it('gives every requirement a unique identifier', () => {
    const ids = REQUIREMENTS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('states exactly one "shall" per requirement (singular)', () => {
    for (const r of REQUIREMENTS) {
      const count = (r.text.match(/\bshall\b/g) ?? []).length
      expect(count, `${r.id}: ${r.text}`).toBe(1)
    }
  })

  it('names the system as the subject', () => {
    for (const r of REQUIREMENTS) {
      expect(r.text, r.id).toContain('Simulator shall')
    }
  })

  it('avoids ambiguous and unverifiable terms', () => {
    const banned = [
      'user-friendly', 'as appropriate', 'as needed', 'etc.', 'and/or',
      'sufficient', 'adequate', 'robust', 'quickly', 'easy to use', 'if possible',
      'support for', 'be able to handle', 'minimize', 'maximize', 'optimal',
    ]
    for (const r of REQUIREMENTS) {
      const lower = r.text.toLowerCase()
      for (const term of banned) {
        expect(lower.includes(term), `${r.id} contains "${term}"`).toBe(false)
      }
    }
  })

  it('keeps rationale out of the requirement statement', () => {
    for (const r of REQUIREMENTS) {
      expect(r.text.toLowerCase(), r.id).not.toContain(' because ')
      expect(r.rationale, r.id).toBeTruthy()
    }
  })

  it('ends each statement as a complete sentence', () => {
    for (const r of REQUIREMENTS) {
      expect(r.text.endsWith('.'), r.id).toBe(true)
    }
  })

  it('assigns a verification method to every requirement', () => {
    for (const r of REQUIREMENTS) {
      expect(r.verification, r.id).toBeTruthy()
    }
  })

  it('attributes every requirement to at least one user profile', () => {
    for (const r of REQUIREMENTS) {
      expect(r.profiles?.length, r.id).toBeGreaterThan(0)
      for (const p of r.profiles) {
        expect(USER_PROFILES[p], `${r.id} references unknown profile ${p}`).toBeDefined()
      }
    }
  })
})

describe('traceability', () => {
  it('links every requirement to at least one risk and one test', () => {
    for (const r of REQUIREMENTS) {
      expect(r.risks?.length, `${r.id} has no linked risk`).toBeGreaterThan(0)
      expect(r.tests?.length, `${r.id} has no linked test`).toBeGreaterThan(0)
    }
  })

  it('resolves every risk referenced by a requirement', () => {
    for (const r of REQUIREMENTS) {
      for (const id of r.risks) {
        expect(riskById(id), `${r.id} references unknown risk ${id}`).not.toBeNull()
      }
    }
  })

  it('resolves every requirement referenced by a risk mitigation', () => {
    for (const risk of RISKS) {
      for (const id of risk.mitigatedBy ?? []) {
        expect(requirementById(id), `${risk.id} references unknown requirement ${id}`).not.toBeNull()
      }
    }
  })

  it('leaves no risk without a mitigating requirement', () => {
    for (const risk of RISKS) {
      expect(risk.mitigatedBy?.length, `${risk.id} has no mitigation`).toBeGreaterThan(0)
    }
  })
})

describe('risk scoring', () => {
  it('scores severity, occurrence and detection within 1-10', () => {
    for (const r of RISKS) {
      for (const k of ['severity', 'occurrence', 'detection']) {
        expect(r[k], `${r.id}.${k}`).toBeGreaterThanOrEqual(1)
        expect(r[k], `${r.id}.${k}`).toBeLessThanOrEqual(10)
      }
    }
  })

  it('computes RPN as the product of the three scores', () => {
    for (const r of RISKS) {
      expect(rpn(r)).toBe(r.severity * r.occurrence * r.detection)
    }
  })

  it('states a residual risk position for every risk', () => {
    for (const r of RISKS) {
      expect(r.residual, r.id).toBeTruthy()
    }
  })
})
