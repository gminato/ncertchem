import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PrivacyPage from './privacy/page'
import TermsPage from './terms/page'
import PricingPage from './pricing/page'

describe('Privacy page', () => {
  const html = renderToStaticMarkup(<PrivacyPage />)

  it('is published without draft labels and shows a last-updated date', () => {
    expect(html).not.toContain('Draft, pending legal review')
    expect(html).toContain('Last updated:')
  })

  it('states exactly what is stored including Subscription records and Razorpay disclosure', () => {
    expect(html).toContain('email address')
    expect(html).toContain('name')
    expect(html).toContain('Answered Checks')
    expect(html).toContain('Last Section opened')
    expect(html).toContain('Subscription records')
    expect(html).toContain('Razorpay')
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

  it('links to Terms of Use, Pricing, and contact emails', () => {
    expect(html).toContain('href="/terms"')
    expect(html).toContain('href="/pricing"')
    expect(html).toContain('support@ncertchem.com')
    expect(html).toContain('grievance@ncertchem.com')
  })
})

describe('Terms page', () => {
  const html = renderToStaticMarkup(<TermsPage />)

  it('is published without draft labels and shows a last-updated date', () => {
    expect(html).not.toContain('Draft, pending legal review')
    expect(html).not.toContain('Draft placeholder')
    expect(html).toContain('Last updated:')
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

  it('details the 365-day Subscription pricing and non-recurring terms', () => {
    expect(html).toContain('Paid Sections and 365-Day Subscription')
    expect(html).toContain('₹999')
    expect(html).toContain('365-day Entitlement')
    expect(html).toContain('non-recurring')
    expect(html).toContain('no automatic renewal')
  })

  it('includes parental or guardian consent notice for payments', () => {
    expect(html).toContain('Parental or Guardian Consent for Payments')
    expect(html).toContain('single Account model')
    expect(html).toContain('under 18')
    expect(html).toContain('UPI QR')
  })

  it('explains non-refundable policy with statutory technical-failure exception', () => {
    expect(html).toContain('Refund Policy and Technical Failures')
    expect(html).toContain('non-refundable once activated')
    expect(html).toContain('duplicate charge')
    expect(html).toContain('without activating your Entitlement')
    expect(html).toContain('7 business days')
  })

  it('publishes Grievance Officer details with statutory timelines and governing law', () => {
    expect(html).toContain('Grievance Officer')
    expect(html).toContain('Harshit Gupta')
    expect(html).toContain('grievance@ncertchem.com')
    expect(html).toContain('support@ncertchem.com')
    expect(html).toContain('Bengaluru, Karnataka, India')
    expect(html).toContain('48 hours')
    expect(html).toContain('30 days')
    expect(html).toContain('Governing law')
  })

  it('links to Privacy Policy and Pricing', () => {
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/pricing"')
  })
})

describe('Pricing page', () => {
  const html = renderToStaticMarkup(<PricingPage />)

  it('renders the 365-day Subscription price and non-recurring notice', () => {
    expect(html).toContain('365-Day All-Access Subscription')
    expect(html).toContain('₹999')
    expect(html).toContain('365 days')
    expect(html).toContain('Non-recurring')
    expect(html).toContain('no auto-debit')
  })

  it('highlights the visual pedagogy and Free Sections', () => {
    expect(html).toContain('Scrolly Animations')
    expect(html).toContain('Interactive Simulations')
    expect(html).toContain('Ungraded Checks')
    expect(html).toContain('Key Ideas')
    expect(html).toContain('Free Sections')
  })

  it('lists accepted payment methods including UPI QR and Razorpay', () => {
    expect(html).toContain('Razorpay')
    expect(html).toContain('UPI QR')
    expect(html).toContain('Debit and credit cards')
    expect(html).toContain('International cards')
  })

  it('includes pre-payment parental consent notice for Learners under 18', () => {
    expect(html).toContain('Learners under 18')
    expect(html).toContain('parent or legal guardian')
  })

  it('explains non-refundable terms with technical-failure protection and links to legal pages', () => {
    expect(html).toContain('non-refundable once activated')
    expect(html).toContain('technical failures')
    expect(html).toContain('href="/terms"')
    expect(html).toContain('href="/privacy"')
  })
})
