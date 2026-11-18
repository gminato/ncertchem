import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PrivacyPage from './privacy/page'
import TermsPage from './terms/page'

describe('Privacy page', () => {
  const html = renderToStaticMarkup(<PrivacyPage />)

  it('is marked as a draft pending legal review', () => {
    expect(html).toContain('Draft, pending legal review')
  })

  it('states exactly what is stored', () => {
    expect(html).toContain('email address')
    expect(html).toContain('name')
    expect(html).toContain('Answered Checks')
    expect(html).toContain('Last Section opened')
  })

  it('states what is never stored or tracked', () => {
    expect(html).toContain('Wrong answers or attempts')
    expect(html).toContain('Revealed solutions')
    expect(html).toContain('Grades or scores')
    expect(html).toContain('Advertising or third-party tracking')
  })

  it('states how to delete data on the Account page', () => {
    expect(html).toContain('Account page')
    expect(html).toContain('Delete Account')
    expect(html).toContain('DELETE')
    expect(html).toContain('Reset Progress')
  })

  it('includes the under-18 section seeking consent without claiming it is verified', () => {
    expect(html).toContain('Learners under 18')
    expect(html).toContain('Parental or guardian consent is being sought')
    expect(html).toContain('do not claim that parental consent has been verified')
  })

  it('includes the NCERT independence disclaimer', () => {
    expect(html).toContain('not affiliated with, authorized by, or endorsed by')
    expect(html).toContain('National Council of Educational Research and Training')
  })

  it('links to Terms of Use', () => {
    expect(html).toContain('href="/terms"')
  })
})

describe('Terms page', () => {
  const html = renderToStaticMarkup(<TermsPage />)

  it('is marked as a draft pending legal review', () => {
    expect(html).toContain('Draft, pending legal review')
  })

  it('explains free access without an account', () => {
    expect(html).toContain('Free Sections')
  })

  it('explains original intellectual property and NCERT citations', () => {
    expect(html).toContain('original works')
    expect(html).toContain('NCERT')
  })

  it('includes educational disclaimer', () => {
    expect(html).toContain('educational aid')
  })

  it('links to Privacy Policy', () => {
    expect(html).toContain('href="/privacy"')
  })
})
