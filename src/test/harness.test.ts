import { expect, test } from 'vitest'
import '@testing-library/jest-dom'

test('matchMedia is mocked', () => {
  expect(typeof window.matchMedia).toBe('function')
  const mql = window.matchMedia('(max-width: 820px)')
  expect(mql).toHaveProperty('matches')
  expect(mql).toHaveProperty('media')
  expect(mql).toHaveProperty('addEventListener')
  expect(mql).toHaveProperty('removeEventListener')
})

test('jest-dom matchers are registered', () => {
  const div = document.createElement('div')
  document.body.appendChild(div)
  expect(div).toBeInTheDocument()
  document.body.removeChild(div)
})