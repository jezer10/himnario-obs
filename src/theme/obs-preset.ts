import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import palettes from './obs-palettes.json'

const light = palettes['com.obsproject.Yami.Light'].colors
const dark = palettes['com.obsproject.Yami'].colors

// The OBS bridge can override each color; manual modes use Yami / Light.
const color = (key: keyof typeof dark) =>
  `var(--obs-${key}, light-dark(${light[key]}, ${dark[key]}))`

const overlay = {
  background: color('base'),
  borderColor: color('border'),
  color: color('text'),
}

export default definePreset(Aura, {
  primitive: {
    borderRadius: { xs: '2px', sm: '3px', md: '4px', lg: '4px', xl: '6px' },
  },
  semantic: {
    typography: { fontFamily: '"Segoe UI", system-ui, sans-serif', fontSize: '13px' },
    transitionDuration: '0.12s',
    primary: {
      50: '{blue.50}', 100: '{blue.100}', 200: '{blue.200}',
      300: '{blue.300}', 400: '#718cdc', 500: '#4267cd',
      600: '#284cb8', 700: '#203d93', 800: '{blue.800}',
      900: '{blue.900}', 950: '{blue.950}',
      color: '#284cb8', contrastColor: '#ffffff',
      hoverColor: '#355dca', activeColor: '#203d93',
    },
    focusRing: { color: color('focus'), width: '1px', offset: '1px' },
    formField: {
      background: color('input'), color: color('text'),
      borderColor: color('input'), hoverBorderColor: color('border'),
      focusBorderColor: color('focus'),
      disabledBackground: color('base'), disabledColor: color('muted'),
      placeholderColor: color('muted'), iconColor: color('muted'),
      filledBackground: color('input'), filledHoverBackground: color('hover'),
      filledFocusBackground: color('input'), shadow: 'none',
      paddingX: '0.5rem', paddingY: '0.25rem',
    },
    text: {
      color: color('text'), hoverColor: color('text'),
      mutedColor: color('muted'), hoverMutedColor: color('text'),
    },
    content: { ...overlay, hoverBackground: color('hover'), hoverColor: color('text') },
    highlight: {
      background: color('selection'), focusBackground: color('selection'),
      color: color('text'), focusColor: color('text'),
    },
    list: { option: { focusBackground: color('hover') } },
    overlay: { select: overlay, popover: overlay, modal: overlay },
  },
  // App-wide defaults and responsive control sizing belong to the PrimeVue preset.
  extend: {
    app: { controlSize: '32px', touchTarget: '44px' },
  },
  css: (options) => {
    if (!options) return ''
    const { dt } = options
    return `
    body {
      margin: 0;
      font-family: ${dt('typography.font.family')};
      font-size: ${dt('typography.font.size')};
      color: ${dt('text.color')};
      background: ${dt('content.background')};
    }
    .p-button { min-width: ${dt('app.control.size')}; min-height: ${dt('app.control.size')}; }
    @media (pointer: coarse), (max-width: 480px) and (min-height: 500px) {
      .p-button, .p-inputtext, .p-select, .p-autocomplete-option, .p-select-option {
        min-height: ${dt('app.touch.target')};
      }
      .p-button { min-width: ${dt('app.touch.target')}; }
    }
  `
  },
  components: {
    button: {
      root: {
        label: { fontWeight: '400' },
        secondary: {
          background: color('control'), hoverBackground: color('hover'),
          activeBackground: color('pressed'), borderColor: color('control'),
          hoverBorderColor: color('border'), activeBorderColor: color('border'),
          color: color('text'), hoverColor: color('text'), activeColor: color('text'),
          focusRing: { color: color('focus'), shadow: 'none' },
        },
      },
    },
  },
})
