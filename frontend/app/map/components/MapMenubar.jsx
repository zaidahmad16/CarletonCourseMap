/* Hallmark · component: MapMenubar · genre: modern-minimal · theme: custom (Carleton)
 * states: default · hover · focus · active · disabled · open (submenu)
 * Base UI Menubar — View / Program / Help
 */

'use client'

import * as React from 'react'
import { Menubar } from '@base-ui-components/react/menubar'
import { Menu } from '@base-ui-components/react/menu'

// ── Shared style tokens (inline, references CSS vars from globals.css) ─────────

const triggerBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  borderRadius: 'var(--radius-input)',
  padding: '4px 10px',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  color: 'var(--color-ink)',
  cursor: 'pointer',
  lineHeight: 1,
  transition: 'background var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)',
  outline: 'none',
  userSelect: 'none',
}

const popupBase = {
  background: 'var(--color-paper)',
  border: '1px solid var(--color-rule)',
  borderRadius: 6,
  boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
  padding: '4px 0',
  minWidth: 180,
  zIndex: 100,
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
}

const itemBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '7px 14px',
  cursor: 'pointer',
  color: 'var(--color-ink)',
  outline: 'none',
  userSelect: 'none',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-body)',
  borderRadius: 0,
  transition: 'background var(--dur-short) var(--ease-out)',
}

const separatorStyle = {
  height: 1,
  background: 'var(--color-rule)',
  margin: '4px 0',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const MenuTrigger = React.forwardRef(({ children, open, ...props }, ref) => (
  <Menu.Trigger
    ref={ref}
    {...props}
    style={{
      ...triggerBase,
      background: open ? 'var(--color-accent-soft)' : 'none',
      color: open ? 'var(--color-accent)' : 'var(--color-ink)',
    }}
    onMouseEnter={e => {
      if (!open) e.currentTarget.style.background = 'var(--color-paper-2)'
    }}
    onMouseLeave={e => {
      if (!open) e.currentTarget.style.background = 'none'
    }}
  >
    {children}
  </Menu.Trigger>
))
MenuTrigger.displayName = 'MenuTrigger'

const MenuItem = ({ children, shortcut, disabled, onClick, ...props }) => (
  <Menu.Item
    {...props}
    disabled={disabled}
    onClick={onClick}
    style={{
      ...itemBase,
      color: disabled ? 'var(--color-ink-3)' : 'var(--color-ink)',
      cursor: disabled ? 'default' : 'pointer',
    }}
    onMouseEnter={e => {
      if (!disabled) {
        e.currentTarget.style.background = 'var(--color-accent-soft)'
        e.currentTarget.style.color = 'var(--color-accent)'
      }
    }}
    onMouseLeave={e => {
      if (!disabled) {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = 'var(--color-ink)'
      }
    }}
  >
    <span>{children}</span>
    {shortcut && (
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-ink-3)',
        marginLeft: 24,
        letterSpacing: '0.02em',
      }}>
        {shortcut}
      </span>
    )}
  </Menu.Item>
)

// ── MapMenubar ─────────────────────────────────────────────────────────────────

export const MapMenubar = ({
  onFitView,
  onZoomIn,
  onZoomOut,
  onSelectProgram,
  onShowNotes,
  onCopyLink,
  hasProgram,
  onCompare,
}) => {
  const [viewOpen, setViewOpen]       = React.useState(false)
  const [programOpen, setProgramOpen] = React.useState(false)
  const [helpOpen, setHelpOpen]       = React.useState(false)

  return (
    <Menubar
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* ── View ──────────────────────────────────────────── */}
      <Menu.Root onOpenChange={setViewOpen}>
        <MenuTrigger open={viewOpen}>View</MenuTrigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="start">
            <Menu.Popup style={popupBase}>
              <MenuItem onClick={onFitView} shortcut="⌘⇧F">Fit to screen</MenuItem>
              <MenuItem onClick={onZoomIn}  shortcut="⌘+">Zoom in</MenuItem>
              <MenuItem onClick={onZoomOut} shortcut="⌘−">Zoom out</MenuItem>
              <div style={separatorStyle} />
              <MenuItem onClick={onShowNotes}>Show notes</MenuItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* ── Program ───────────────────────────────────────── */}
      <Menu.Root onOpenChange={setProgramOpen}>
        <MenuTrigger open={programOpen}>Program</MenuTrigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="start">
            <Menu.Popup style={popupBase}>
              <MenuItem onClick={onSelectProgram}>Change program…</MenuItem>
              <MenuItem onClick={onCopyLink} disabled={!hasProgram}>Copy link to program</MenuItem>
              <div style={separatorStyle} />
              <MenuItem onClick={onCompare}>Compare programs…</MenuItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* ── Help ──────────────────────────────────────────── */}
      <Menu.Root onOpenChange={setHelpOpen}>
        <MenuTrigger open={helpOpen}>Help</MenuTrigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="start">
            <Menu.Popup style={popupBase}>
              <MenuItem
                onClick={() => window.open('https://calendar.carleton.ca/undergrad/courses', '_blank', 'noopener')}
              >
                Course calendar ↗
              </MenuItem>
              <div style={separatorStyle} />
              <MenuItem disabled>
                <span style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-xs)' }}>
                  CarletonCourseMap — not official
                </span>
              </MenuItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  )
}
