import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AboutApp from '../../src/components/AboutApp.vue'
import packageJson from '../../package.json'
import { useSettingsStore } from '../../src/store'
import { nextTick } from 'vue'

describe("AboutApp component", () => {
  it("displays release notes at first visit", async () => {
    const wrapper = mount(AboutApp)
    await nextTick()
    const hymns = wrapper.find('[data-test="release-notes"]')
    const dialog = hymns.element as DialogHTMLAttributes
    expect(wrapper.find('[data-test="release-notes"]').exists()).toBe(true)
    expect(hymns.text()).toContain(packageJson.version)
  })

  it('does not display release notes if not first visit', async () => {
    useSettingsStore().markVersionSeen()
    const wrapper = mount(AboutApp)
    await nextTick()
    expect(wrapper.find('[data-test="release-notes"]').exists()).toBe(false)
  })

  it.skip('displays release notes when clicking on "Acerca de" button', async () => {
    const wrapper = mount(AboutApp)
    await nextTick()
    expect(wrapper.find('[data-test="release-notes"]').exists()).toBe(false)
    const aboutButton = wrapper.find('[title="Acerca de"]')
    await aboutButton.trigger('click')
    expect(dialog.open).toBe(true)
  })
})
