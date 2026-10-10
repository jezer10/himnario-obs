import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AboutApp from '../../src/components/AboutApp.vue'
import packageJson from '../../package.json'
import { store } from '../../src/store'
import { DialogHTMLAttributes } from 'vue'

describe("AboutApp component", () => {
  it("displays release notes at first visit", () => {
    const wrapper = mount(AboutApp)
    const hymns = wrapper.find('[data-test="release-notes"]')
    const dialog = hymns.element as DialogHTMLAttributes
    expect(dialog.open).toBe(true)
    expect(hymns.text()).toContain(packageJson.version)
  })

  it('does not display release notes if not first visit', async () => {
    store.isFirstTimeInVersion = false
    const wrapper = mount(AboutApp)
    const dialog = wrapper.find('[data-test="release-notes"]').element as DialogHTMLAttributes
    expect(dialog.open).toBe(false)
  })

  it.skip('displays release notes when clicking on "Acerca de" button', async () => {
    const wrapper = mount(AboutApp)
    const dialog = wrapper.find('[data-test="release-notes"]').element as DialogHTMLAttributes
    expect(dialog.open).toBe(false)
    const aboutButton = wrapper.find('[title="Acerca de"]')
    await aboutButton.trigger('click')
    expect(dialog.open).toBe(true)
  })
})
