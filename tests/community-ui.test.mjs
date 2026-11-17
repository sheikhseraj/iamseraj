import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { writeFile, unlink } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { createFixtureApi } from './community-fixtures.mjs'

const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'http://localhost/admin?section=community&view=overview' })
for (const key of ['window','document','navigator','HTMLElement','Element','Node','Event','MouseEvent','localStorage']) Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true })
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const output = await build({ entryPoints: ['src/admin/community/CommunityManager.jsx'], bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react','react/*'], loader: { '.css': 'empty' }, write: false })
const generated = new URL(`.community-render-${process.pid}.mjs`, import.meta.url)
await writeFile(generated, output.outputFiles[0].text)
let CommunityManager
try { CommunityManager = (await import(generated.href)).default } finally { await unlink(generated) }

async function waitFor(check) {
  for (let attempt = 0; attempt < 60; attempt++) { if (check()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)) }) }
  assert.fail('UI did not reach the expected state')
}
function button(label, scope = document) { return [...scope.querySelectorAll('button')].find(item => item.getAttribute('aria-label') === label || item.textContent.trim() === label) }
async function click(element) { assert.ok(element, 'Expected control exists'); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))) }
async function mount(view = 'overview') {
  window.history.replaceState(null, '', `/admin?section=community&view=${view}`)
  const fixture = createFixtureApi(); globalThis.fetch = fixture.fetch
  const root = createRoot(document.getElementById('test-root'))
  await act(async () => root.render(React.createElement(CommunityManager, { token: 'synthetic', onUnauthorized: () => {} })))
  return { fixture, root }
}
test('admin review requires confirmation and keeps website approval separate from WhatsApp admission', async () => {
  const { fixture, root } = await mount('requests')
  try {
    await waitFor(() => button('Example ApplicantRequest #12'))
    await click(button('Example ApplicantRequest #12'))
    await waitFor(() => button('Approve'))
    await click(button('Approve'))
    assert.equal(fixture.calls.filter(call => call.method === 'POST').length, 0)
    assert.match(document.querySelector('dialog').textContent, /Membership remains pending/)
    await click(button('Save decision', document.querySelector('dialog')))
    // jsdom doesn't submit a form for synthetic clicks; dispatch the form submit explicitly.
    if (!fixture.calls.some(call => call.path.endsWith('/decision'))) await act(async () => document.querySelector('dialog form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await waitFor(() => button('Confirm admission'))
    assert.equal(fixture.current.status, 'APPROVED'); assert.equal(fixture.current.handoff_status, 'PENDING')
    await click(button('Confirm admission'))
    assert.equal(fixture.current.handoff_status, 'PENDING')
    await act(async () => document.querySelector('dialog form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await waitFor(() => fixture.current.handoff_status === 'COMPLETED' && !document.querySelector('dialog'))
    assert.deepEqual(fixture.calls.find(call => call.path.endsWith('/handoff-complete')).body, { admissionConfirmed: true })
  } finally { await act(async () => root.unmount()) }
})
test('conflicting decisions show a recoverable error and leave the confirmation dialog open', async () => {
  const { fixture, root } = await mount('requests')
  fixture.setFailDecision(true)
  try {
    await waitFor(() => button('Example ApplicantRequest #12')); await click(button('Example ApplicantRequest #12'))
    await waitFor(() => button('Reject')); await click(button('Reject'))
    await act(async () => document.querySelector('dialog form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await waitFor(() => document.querySelector('dialog [role="alert"]'))
    assert.match(document.querySelector('dialog [role="alert"]').textContent, /already has a final decision/)
    assert.equal(fixture.current.status, 'PENDING'); assert.equal(button('Save decision', document.querySelector('dialog')).disabled, false)
  } finally { await act(async () => root.unmount()) }
})
test('all nine sections render inside the existing module and applicant content is escaped', async () => {
  const { fixture, root } = await mount()
  fixture.current.full_name = '<img src=x onerror=alert(1)>'
  try {
    await waitFor(() => document.querySelector('.community-stat'))
    assert.equal(document.querySelectorAll('.community-stat').length, 5)
    for (const label of ['Join Requests','Members','Groups','Reports','Warnings','Blocked','Settings','Audit Log']) {
      await click(button(label)); await waitFor(() => !document.querySelector('.community-panel [role="status"]'))
      assert.ok(document.querySelector('.community-panel'), label)
      assert.equal(document.querySelector('.community-panel img'), null)
      if (label === 'Join Requests') assert.match(document.querySelector('.community-panel').textContent, /<img src=x onerror=alert\(1\)>/)
    }
    assert.match(document.querySelector('.community-panel').textContent, /Audit log/)
    await click(button('Settings')); await waitFor(() => button('Review and save settings'))
    assert.equal([...document.querySelectorAll('input[type="checkbox"]')].find(input => input.closest('label')?.textContent.includes('AI-assisted')).disabled, true)
  } finally { await act(async () => root.unmount()) }
})
test('reference dashboard inline approval still requires confirmation and leaves membership pending', async () => {
  const { fixture, root } = await mount()
  try {
    await waitFor(() => button('Approve'))
    await click(button('Approve'))
    assert.equal(fixture.calls.filter(call => call.method === 'POST').length, 0)
    assert.match(document.querySelector('dialog').textContent, /membership remains pending/)
    await act(async () => document.querySelector('dialog form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await waitFor(() => fixture.current.status === 'APPROVED' && !document.querySelector('dialog'))
    assert.equal(fixture.current.handoff_status, 'PENDING')
  } finally { await act(async () => root.unmount()) }
})
test('top-bar search uses the existing member, group and request APIs', async () => {
  const { fixture, root } = await mount()
  try {
    await waitFor(() => document.querySelector('.community-global-search input'))
    const input = document.querySelector('.community-global-search input')
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input, 'Example')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(button('Search community'))
    await waitFor(() => fixture.calls.filter(call => call.url.includes('search=Example')).length === 3)
    assert.equal(document.querySelectorAll('dialog .community-search-result').length, 5)
  } finally { await act(async () => root.unmount()) }
})
test('mobile navigation makes the closed sidebar inert and restores focus after choosing a section', async () => {
  const previous = window.matchMedia
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  const { root } = await mount()
  try {
    const sidebar = document.querySelector('#community-sidebar')
    assert.equal(sidebar.hasAttribute('inert'), true)
    await click(button('Toggle navigation'))
    assert.equal(sidebar.hasAttribute('inert'), false)
    assert.equal(document.querySelector('.community-workspace').hasAttribute('inert'), true)
    await click(button('Groups'))
    assert.equal(sidebar.hasAttribute('inert'), true)
    assert.equal(document.querySelector('.community-workspace').hasAttribute('inert'), false)
    assert.equal(document.activeElement, button('Toggle navigation'))
  } finally { await act(async () => root.unmount()); window.matchMedia = previous }
})
