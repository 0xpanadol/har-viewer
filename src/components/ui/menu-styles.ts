/** Shared by dropdown and context menus so both read as one system. */
export const menuContent =
  'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-48 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1'

export const menuItem =
  'relative flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-muted data-[variant=danger]:text-danger data-[variant=danger]:data-[highlighted]:bg-danger/10 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[variant=danger]:[&_svg]:text-danger'

export const menuLabel = 'px-2 pt-2 pb-1 text-2xs font-medium tracking-wide text-subtle-foreground uppercase'

export const menuSeparator = '-mx-1 my-1 h-px bg-border'

export const menuShortcut = 'ml-auto pl-4 text-xs tracking-wide text-subtle-foreground'
