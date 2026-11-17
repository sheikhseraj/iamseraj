import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { writeFile, unlink } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { createFixtureApi } from './community-fixtures.mjs'

const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'http://localhost/community' })
for (const key of ['window','document','navigator','HTMLElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage']) Object.defineProperty(globalThis,key,{ value: key === 'window' ? dom.window : dom.window[key], configurable: true })
dom.window.HTMLElement.prototype.scrollIntoView = function () {}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const output = await build({ stdin: { contents: "export { default } from './src/Community.jsx'; export { default as PortfolioApp } from './src/App.jsx';", resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', external: ['react','react/*'], loader: { '.css': 'empty' }, write: false })
const generated = new URL(`.community-public-render-${process.pid}.mjs`, import.meta.url)
await writeFile(generated, output.outputFiles[0].text)
let Community, PortfolioApp
try { const module = await import(generated.href); Community = module.default; PortfolioApp = module.PortfolioApp } finally { await unlink(generated) }
async function waitFor(check) {
  for (let attempt=0;attempt<80;attempt++) { if (check()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve,10)) }) }
  assert.fail('Public UI did not reach expected state')
}
function control(label) { return [...document.querySelectorAll('label')].find(element => element.textContent === label)?.control }
function button(label) { return [...document.querySelectorAll('button')].find(element => element.textContent === label || element.getAttribute('aria-label') === label) }
async function fill(label,value) {
  const element = control(label); assert.ok(element,label)
  await act(async () => {
    const prototype = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value)
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input',{ bubbles:true }))
  })
}
async function click(element) { assert.ok(element); await act(async () => element.click()) }
async function submit(form) { await act(async () => form.dispatchEvent(new Event('submit',{ bubbles:true,cancelable:true }))) }
async function mount(fixture = createFixtureApi({ publicEnabled:true }), lang='en') {
  localStorage.clear(); localStorage.setItem('lang',lang); globalThis.fetch=fixture.fetch
  const root=createRoot(document.getElementById('test-root'))
  await act(async () => root.render(React.createElement(Community)))
  return { fixture,root }
}
async function completeApplication() {
  await waitFor(() => control('Full name'))
  await fill('Full name','Example Applicant'); await fill('WhatsApp / mobile number','0049 176 1234 5678'); await fill('Current city','Magdeburg')
  await fill('Requested group','1'); await fill('Why would you like to join?','I would like to meet neighbours and share local advice.')
  for (const checkbox of document.querySelectorAll('#join-request input[type="checkbox"]')) await click(checkbox)
}
test('public join flow selects a group, normalizes phone, acknowledges current policy and confirms receipt',async () => {
  const { fixture,root }=await mount()
  try {
    await waitFor(() => button('Request to join this group: Indians in Magdeburg'))
    await click(button('Request to join this group: Indians in Magdeburg'))
    assert.equal(control('Requested group').value,'1')
    assert.equal(document.activeElement.id,'join-request')
    await completeApplication(); await submit(document.querySelector('#join-request form'))
    await waitFor(() => document.querySelector('.public-community-success'))
    const request=fixture.calls.find(call => call.path === '/api/community/join-requests')
    assert.equal(request.body.phone,'+4917612345678'); assert.equal(request.body.groupId,1); assert.equal(request.body.privacyVersion,'1')
    assert.equal(request.body.rulesAccepted,true); assert.equal(request.body.privacyAccepted,true)
    assert.match(document.querySelector('.public-community-success').textContent,/will be reviewed/)
    assert.equal(document.querySelector('#join-request input'),null)
    assert.deepEqual(Object.keys(localStorage),['lang'])
  } finally { await act(async () => root.unmount()) }
})
test('validation and acknowledgements prevent public submission; repeat clicks do not duplicate a pending request',async () => {
  const fixture=createFixtureApi({ publicEnabled:true }), original=fixture.fetch
  let finish; const gate=new Promise(resolve => { finish=resolve })
  fixture.fetch=async (url,options) => { const response=await original(url,options); if (String(url).endsWith('/join-requests') && options?.method === 'POST') await gate; return response }
  const { root }=await mount(fixture)
  try {
    await completeApplication(); const boxes=document.querySelectorAll('#join-request input[type="checkbox"]')
    await click(boxes[0]); await submit(document.querySelector('#join-request form'))
    assert.match(document.querySelector('[role="alert"]').textContent,/acknowledge/); assert.equal(fixture.calls.filter(call => call.method==='POST').length,0)
    await click(boxes[0]); const form=document.querySelector('#join-request form'); await submit(form); await submit(form)
    assert.equal(fixture.calls.filter(call => call.path === '/api/community/join-requests').length,1)
    assert.equal(button('Submitting…').disabled,true)
    await act(async () => finish()); await waitFor(() => document.querySelector('.public-community-success'))
  } finally { finish(); await act(async () => root.unmount()) }
})
test('stale policy requires refreshed versions and fresh acknowledgement while retaining application fields',async () => {
  const fixture=createFixtureApi({ publicEnabled:true }), original=fixture.fetch
  let stale=true
  fixture.fetch=async (url,options) => String(url).endsWith('/join-requests') && options?.method==='POST' && stale ? Response.json({}, {status:409}) : original(url,options)
  const { root }=await mount(fixture)
  try {
    await completeApplication(); await submit(document.querySelector('#join-request form'))
    await waitFor(() => button('Refresh current information'))
    assert.equal(button('Submit join request').disabled,true)
    fixture.config.privacy_version='2'; stale=false
    await click(button('Refresh current information')); await waitFor(() => !document.querySelector('#join-request fieldset').disabled)
    assert.equal(control('Full name').value,'Example Applicant')
    const boxes=document.querySelectorAll('#join-request input[type="checkbox"]'); assert.equal(boxes[0].checked,false); assert.equal(boxes[1].checked,false)
    for (const checkbox of boxes) await click(checkbox)
    await submit(document.querySelector('#join-request form')); await waitFor(() => document.querySelector('.public-community-success'))
    assert.equal(fixture.calls.find(call => call.path === '/api/community/join-requests').body.privacyVersion,'2')
  } finally { await act(async () => root.unmount()) }
})
test('disabled community hides applications/reports and never fetches private or public group records',async () => {
  const { fixture,root }=await mount(createFixtureApi())
  try {
    await waitFor(() => document.querySelector('#community-groups').textContent.includes('not accepting public requests'))
    assert.equal(document.querySelector('#join-request form'),null); assert.equal(document.querySelector('#community-report'),null)
    assert.equal(fixture.calls.some(call => call.path === '/api/community/groups'),false)
  } finally { await act(async () => root.unmount()) }
})
test('German public UI and configured text are rendered safely with no identity-document or private-link fields',async () => {
  const fixture=createFixtureApi({ publicEnabled:true }); fixture.config.rules_text='<script>private()</script> Respect other members.'
  const { root }=await mount(fixture,'de')
  try {
    await waitFor(() => control('Vollständiger Name'))
    assert.equal(document.documentElement.lang,'de'); assert.match(document.querySelector('h1').textContent,/Werde Teil/)
    assert.equal(document.querySelector('#community-rules script'),null)
    assert.match(document.querySelector('#community-rules').textContent,/<script>/)
    assert.equal(document.querySelector('input[type="file"]'),null)
    assert.equal(document.querySelector('a[href*="chat.whatsapp.com"]'),null)
    assert.equal(document.querySelector('a.nav__brand').getAttribute('href'),'/')
  } finally { await act(async () => root.unmount()) }
})
test('optional public reporting appears only when enabled and submits minimal report information',async () => {
  const fixture=createFixtureApi({ publicEnabled:true }); fixture.config.public_reporting_enabled=1
  const { root }=await mount(fixture)
  try {
    await waitFor(() => button('Submit a report')); await click(button('Submit a report'))
    await fill('Group involved','1'); await fill('Describe the concern','A repeated unsolicited promotional message was posted.')
    await click(document.querySelector('#community-report input[type="checkbox"]'))
    await submit(document.querySelector('#community-report form')); await waitFor(() => document.querySelector('#community-report .public-community-success'))
    const report=fixture.calls.find(call => call.path === '/api/community/reports')
    assert.equal(report.body.groupId,1); assert.equal(report.body.privacyAccepted,true); assert.equal(report.body.privacyVersion,'1')
    assert.equal(report.body.memberId,undefined); assert.equal(report.body.severity,undefined)
  } finally { await act(async () => root.unmount()) }
})
test('shared layout preserves the portfolio sections, contact link and chatbot while adding community discovery',async () => {
  localStorage.clear(); globalThis.fetch=async () => Response.json({})
  const root=createRoot(document.getElementById('test-root'))
  try {
    await act(async () => root.render(React.createElement(PortfolioApp)))
    for (const id of ['top','about','skills','projects','cloud-journey','experience','education','certifications','contact']) assert.ok(document.getElementById(id),id)
    assert.ok(document.querySelector('#contact a[href^="mailto:"]'))
    assert.ok(document.querySelector('footer a[href="/community"]'))
    assert.equal(document.querySelector('a.nav__brand').getAttribute('href'),'#top')
    assert.ok(document.querySelector('.chat-fab'))
  } finally { await act(async () => root.unmount()) }
})
test('unavailable service shows a retry state without exposing forms or internal errors',async () => {
  const fixture=createFixtureApi({ publicEnabled:true }), original=fixture.fetch
  let unavailable=true
  fixture.fetch=async (url,options) => unavailable ? Response.json({ error:'Private database configuration' },{status:503}) : original(url,options)
  const { root }=await mount(fixture)
  try {
    await waitFor(() => button('Try again'))
    assert.equal(document.querySelector('#join-request form'),null)
    assert.ok(!document.body.textContent.includes('Private database configuration'))
    unavailable=false; await click(button('Try again')); await waitFor(() => control('Full name'))
    assert.ok(document.querySelector('#join-request form'))
  } finally { await act(async () => root.unmount()) }
})
test('closed mobile navigation is inert and becomes accessible when opened',async () => {
  const previous=window.matchMedia
  window.matchMedia=() => ({ matches:true,addEventListener(){},removeEventListener(){} })
  const { root }=await mount()
  try {
    const navigation=document.getElementById('site-navigation')
    assert.equal(navigation.hasAttribute('inert'),true)
    await click(button('Menu')); assert.equal(navigation.hasAttribute('inert'),false)
    await act(async () => navigation.dispatchEvent(new window.KeyboardEvent('keydown',{ key:'Escape',bubbles:true })))
    assert.equal(navigation.hasAttribute('inert'),true)
  } finally { await act(async () => root.unmount()); window.matchMedia=previous }
})
