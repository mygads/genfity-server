export interface MenuItem {
  id: number
  title: string
  path?: string
  newTab: boolean
  icon?: string
  desc?: string
}

export interface MenuCategory {
  title: string
  items: MenuItem[]
}

export interface Menu {
  id: number
  title: string
  path?: string
  newTab: boolean
  submenu?: MenuItem[]
  megaMenu?: MenuCategory[]
}
