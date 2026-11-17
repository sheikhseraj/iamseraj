
import assert from 'node:assert/strict'
import test from 'node:test'
import { unlink, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { act } from 'react'

test('the real router loads the lab on a direct visit and the portfolio links back to it', async () => {
  const dom = new JSDOM('<!doctype html><title>Portfolio</title><div id="root"></div>', {
    url: 'http://localhost/aws-practice/',
  })
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: key === 'window' ? dom.window : dom.window[key],
    })
  }
  window.scrollTo = () => {}
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const output = await build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    jsx: 'automatic',
    external: ['react', 'react/*', 'react-dom/*'],
    loader: { '.css': 'empty' },
    write: false,
  })
  const generated = new URL(`.aws-practice-render-${process.pid}.mjs`, import.meta.url)
  await writeFile(generated, output.outputFiles[0].text)
  try {
    await act(async () => { await import(generated.href) })
    // The router loads the lab through React.lazy.
    await act(async () => {})
    assert.equal(document.querySelector('h1').textContent, 'AWS Cloud Practitioner Practice Lab')
    assert.equal(document.querySelectorAll('.lab-dashboard-card').length, 8)
    assert.equal(document.querySelector('.lab-metrics dd').textContent, '306')

    await act(async () => {
      window.location.hash = 'domains'
      window.dispatchEvent(new window.HashChangeEvent('hashchange'))
    })
    assert.equal(document.querySelectorAll('.aws-lab__domain').length, 4)

    await act(async () => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new window.PopStateEvent('popstate'))
    })
    assert.equal(document.querySelector('#tools a[href="/aws-practice"]').textContent, 'AWS Practice Lab')
    assert.equal(document.querySelector('.aws-lab'), null)
  } finally {
    await unlink(generated)
    dom.window.close()
  }
})
