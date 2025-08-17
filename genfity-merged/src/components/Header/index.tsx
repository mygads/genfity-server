"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import ThemeToggler from "./ThemeToggler"
import menuData from "./menuData"
import { InteractiveHoverButton } from "../ui/interactive-hover-button"
import { ScrollProgress } from "../ui/scroll-progress"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/components/Cart/CartContext"
import CartSidebar from "../Cart/CartSidebar"
import { IoCartOutline } from "react-icons/io5"
import * as FiIcons from "react-icons/fi"
import { useAuth } from "../Auth/AuthContext"

const Header = () => {
  const t = useTranslations('Header')
  
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false)
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen)
  }
  // Sticky Navbar
  const [sticky, setSticky] = useState(false)
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true)
    } else {
      setSticky(false)
    }
  }
  
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar)
    
    // Cleanup timeouts on unmount
    return () => {
      window.removeEventListener("scroll", handleStickyNavbar)
      Object.values(hoverTimeouts).forEach((timeoutId: any) => {
        if (timeoutId) clearTimeout(timeoutId)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // submenu handler with dual trigger (hover + click)
  const [openIndex, setOpenIndex] = useState(-1)
  const [clickedIndex, setClickedIndex] = useState(-1) // Track clicked state
  const [hoverTimeouts, setHoverTimeouts] = useState({})
  
  const handleSubmenu = (index) => {
    if (clickedIndex === index) {
      setClickedIndex(-1)
      setOpenIndex(-1)
    } else {
      setClickedIndex(index)
      setOpenIndex(index)
    }
  }

  // Smart hover handlers with delay
  const handleMouseEnter = (index) => {
    // Clear any existing timeout for this menu
    if (hoverTimeouts[index]) {
      clearTimeout(hoverTimeouts[index])
    }
    
    // Only open on hover if not already clicked open
    if (clickedIndex === -1) {
      setOpenIndex(index)
    }
  }

  const handleMouseLeave = (index) => {
    // Only close on hover leave if it was opened by hover (not click)
    if (clickedIndex === -1) {
      // Add delay before closing to allow mouse movement
      const timeoutId = setTimeout(() => {
        setOpenIndex(-1)
      }, 300) // 300ms delay
      
      setHoverTimeouts(prev => ({ ...prev, [index]: timeoutId }))
    }
  }
  // Clear timeout when mouse re-enters the dropdown area
  const handleDropdownMouseEnter = (index) => {
    if (hoverTimeouts[index]) {
      clearTimeout(hoverTimeouts[index])
      setHoverTimeouts(prev => ({ ...prev, [index]: null }))
    }
  }
  
  const usePathName = usePathname()
  const params = useParams()
  const router = useRouter()
  const currentLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale || "en"
  const otherLocale = currentLocale === "en" ? "id" : "en"
  
  // Close mobile navbar when pathname changes (navigation occurs)
  useEffect(() => {
    setNavbarOpen(false)
    setOpenIndex(-1)
    setClickedIndex(-1)
  }, [usePathName])
  
  // Function to check if path matches, considering locale prefix
  const isPathActive = (itemPath: string): boolean => {
    // Remove locale prefix from current path for comparison
    const pathWithoutLocale = usePathName.replace(`/${currentLocale}`, '') || '/'
    return pathWithoutLocale === itemPath || usePathName === itemPath
  }

  // Fungsi untuk switch bahasa
  const handleLocaleSwitch = (targetLocale) => {
    const segments = usePathName.split("/").filter(Boolean)
    if (segments[0] === "en" || segments[0] === "id") {
      segments[0] = targetLocale
    } else {
      segments.unshift(targetLocale)
    }
    const newPath = "/" + segments.join("/")
    router.push(newPath)
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Tutup dropdown jika klik di luar
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false)
    }
  }, [])
  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen, handleClickOutside])

  const flagSVG = {
    en: (
      // UK flag (Union Jack) - improved and more accurate
      <svg width="20" height="14" viewBox="0 0 60 42" className="inline-block mr-2 align-middle">
        <rect width="60" height="42" fill="#012169" />
        <g>
          <polygon points="0,0 60,42 60,38 8,0" fill="#FFF" />
          <polygon points="60,0 0,42 0,38 52,0" fill="#FFF" />
          <polygon points="0,0 24,16 20,16 0,2" fill="#C8102E" />
          <polygon points="60,0 36,16 40,16 60,2" fill="#C8102E" />
          <polygon points="0,42 24,26 20,26 0,40" fill="#C8102E" />
          <polygon points="60,42 36,26 40,26 60,40" fill="#C8102E" />
        </g>
        <rect x="25" width="10" height="42" fill="#FFF" />
        <rect y="16" width="60" height="10" fill="#FFF" />
        <rect x="27" width="6" height="42" fill="#C8102E" />
        <rect y="18" width="60" height="6" fill="#C8102E" />
      </svg>
    ),
    id: (
      <svg width="20" height="14" viewBox="0 0 20 14" className="inline-block mr-2 align-middle">
        <rect width="20" height="7" fill="#e70011" />
        <rect y="7" width="20" height="7" fill="#fff" />
      </svg>
    ),
  }

  const { items } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0)

  const { user, isLoading } = useAuth()

  return (
    <>
      <header
        className={`header left-0 top-0 z-30 flex w-full items-center ${
          sticky
            ? "dark:bg-gray-dark dark:shadow-sticky-dark fixed bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm transition"
            : "absolute bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4">
              <Link href="/" className={`header-logo block w-full ${sticky ? "py-5 lg:py-2" : "py-5"} `}>
                <Image src="/logo-dark.svg" alt="logo" width={140} height={30} className="w-full dark:hidden" />
                <Image
                  src="/logo-light.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="hidden w-full dark:block"
                />
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0 " : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white px-6 py-4 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100 max-h-[80vh] overflow-y-auto"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                  <ul className="block lg:flex lg:space-x-8">                    {menuData.slice(0, 5).map((menuItem, index) => (
                      <li
                        key={index}
                        className="group relative"
                        onMouseEnter={() => (menuItem.submenu || menuItem.megaMenu) && handleMouseEnter(index)}
                        onMouseLeave={() => (menuItem.submenu || menuItem.megaMenu) && handleMouseLeave(index)}
                      >                        {menuItem.path ? (
                          <Link
                            href={menuItem.path}
                            onClick={() => {
                              // Close mobile menu when clicking a link
                              setNavbarOpen(false)
                              setOpenIndex(-1)
                              setClickedIndex(-1)
                            }}
                            className={`flex py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 font-medium transition-all duration-300 relative ${
                              isPathActive(menuItem.path)
                                ? "text-primary dark:text-white scale-105 after:content-[''] after:absolute after:bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-white after:rounded-full"                                : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white hover:scale-105"
                            }`}>
                            {t(menuItem.title)}
                          </Link>) : (
                            <>
                            <p
                              onClick={() => handleSubmenu(index)}
                              className={`flex cursor-pointer items-center justify-between py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 font-medium transition-all duration-300 relative ${
                                // Check if current path matches any submenu or megaMenu items
                                (menuItem.submenu && menuItem.submenu.some(sub => isPathActive(sub.path))) ||
                                (menuItem.megaMenu && menuItem.megaMenu.some(cat => cat.items.some(item => isPathActive(item.path))))
                                  ? "text-primary dark:text-white scale-105 after:content-[''] after:absolute after:bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-white after:rounded-full"
                                  : "text-dark group-hover:text-primary dark:text-white/70 dark:group-hover:text-white hover:scale-105"
                                }`}
                            >
                              {t(menuItem.title)}
                              <span className="pl-1">
                              <svg width="25" height="24" viewBox="0 0 25 24">
                                <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                fill="currentColor"
                                />
                              </svg>
                              </span>
                            </p>                            
                            {/* Regular Submenu */}
                            {menuItem.submenu && (
                              <div
                              onMouseEnter={() => handleDropdownMouseEnter(index)}
                              className={`submenu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-bg-color-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                                openIndex === index ? "block max-h-[60vh] overflow-y-auto lg:max-h-none" : "hidden"
                              }`}
                              style={{
                                pointerEvents: openIndex === index ? "auto" : "none",
                                paddingTop: 16,
                                paddingBottom: 16,
                              }}
                              >
                              {menuItem.submenu.map((submenuItem, idx) => {
                                const Icon = submenuItem.icon ? FiIcons[submenuItem.icon] : null
                                const translatedTitle = t(submenuItem.title)
                                const isComingSoon = translatedTitle.toLowerCase().includes("coming soon") || translatedTitle.toLowerCase().includes("segera hadir")
                                const cleanTitle = translatedTitle.replace(/\s*\((Coming Soon|Segera Hadir)\)/i, "")
                                return (
                                <div key={idx}>
                                  {idx !== 0 && (
                                  <hr className="my-1 border-t border-gray-400 dark:border-gray-500" />
                                  )}
                                  {isComingSoon ? (
                                  <div className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm mb-1">
                                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                                    <span>{cleanTitle}</span>
                                    <span
                                    className="ml-2 px-1 py-0.5 text-xs font-medium rounded-full"
                                    style={{
                                      borderRadius: '9999px',
                                      borderWidth: '2px',
                                      borderStyle: 'solid',
                                      borderImage: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet) 1',
                                      display: 'inline-block',
                                    }}
                                  >
                                    coming soon
                                    </span>
                                  </div>
                                  ) : (
                                  <Link
                                    href={submenuItem.path}
                                    onClick={() => {
                                      // Close mobile menu when clicking a submenu link
                                      setNavbarOpen(false)
                                      setOpenIndex(-1)
                                      setClickedIndex(-1)
                                    }}
                                    className={`flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm transition-all border mb-1 ${
                                      isPathActive(submenuItem.path)
                                        ? "bg-primary/20 text-primary border-primary/50 dark:bg-primary/30 dark:text-white dark:border-primary/50 font-semibold"
                                        : "text-dark hover:bg-primary/10 hover:text-primary dark:text-white dark:hover:text-white dark:hover:bg-primary/20 border-transparent hover:border-primary/30"
                                    }`}
                                    style={{ minHeight: 44 }}
                                  >
                                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                                    <span>{translatedTitle}</span>
                                  </Link>
                                  )}
                                </div>
                                )
                              })}
                              </div>
                            )}                            
                            {/* Mega Menu */}
                            {menuItem.megaMenu && (
                              <div
                              onMouseEnter={() => handleDropdownMouseEnter(index)}
                              className={`mega-menu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-bg-color-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[750px] lg:p-6 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                                openIndex === index ? "block max-h-[60vh] overflow-y-auto lg:max-h-none" : "hidden"
                              }`}
                              style={{ pointerEvents: openIndex === index ? "auto" : "none" }}
                              >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {menuItem.megaMenu.map((category, catIdx) => (
                                  <div key={catIdx} className="space-y-4">
                                  <h3 className="text-sm font-semibold text-black dark:text-white border-b pb-2 border-gray-500">
                                  {t(category.title)}
                                  </h3>
                                  <div className="space-y-2">
                                  {category.items.map((item, itemIdx) => {
                                    const Icon = item.icon ? FiIcons[item.icon] : null
                                    return (
                                    <div key={itemIdx}>
                                      {itemIdx !== 0 && (
                                      <hr className="my-1 border-t border-gray-400 dark:border-gray-500" />
                                      )}
                                      <Link
                                      href={item.path}
                                      onClick={() => {
                                        // Close mobile menu when clicking a megamenu link
                                        setNavbarOpen(false)
                                        setOpenIndex(-1)
                                        setClickedIndex(-1)
                                      }}
                                      className={`flex items-start gap-3 rounded-lg py-2 px-3 text-sm transition-all border ${
                                        isPathActive(item.path)
                                          ? "bg-primary/20 text-primary border-primary/50 dark:bg-primary/30 dark:text-white dark:border-primary/50 font-semibold"
                                          : "text-dark hover:bg-primary/10 hover:text-primary dark:text-white dark:hover:text-white dark:hover:bg-primary/20 border-transparent hover:border-primary/30"
                                      }`}                                      >
                                      {Icon && <Icon className="w-5 h-5 text-primary dark:text-white mt-0.5 flex-shrink-0" />}
                                      <div>
                                        <div className="font-medium">{t(item.title)}</div>
                                        {item.desc && (
                                        <div className="text-xs text-gray-500 dark:text-white/70 mt-0.5 leading-tight">
                                          {t(item.desc)}
                                        </div>
                                        )}
                                      </div>
                                      </Link>
                                    </div>
                                    )
                                  })}
                                  </div>
                                </div>
                                ))}
                              </div>
                              </div>
                            )}
                            </>
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* Add Sign In Buttons */}
                    <div className="mt-4 border-t border-gray-300 pt-4 dark:border-gray-700 lg:hidden">
                      <div className="mb-2">
                      <button
                      onClick={() => {
                        handleLocaleSwitch(otherLocale)
                        // Close mobile menu when switching language
                        setNavbarOpen(false)
                        setOpenIndex(-1)
                        setClickedIndex(-1)
                      }}
                      className="flex items-center w-full px-3 py-2 rounded border text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white transition"
                      >
                      {flagSVG[otherLocale]}
                      <span className="ml-1 uppercase">{otherLocale}</span>
                      </button>
                    </div>
                    {isLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded bg-gray-100 dark:bg-gray-800 animate-pulse text-xs">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full" />
                        <span className="font-medium bg-gray-300 dark:bg-gray-700 rounded w-12 h-3 inline-block" />
                      </div>
                    ) : user ? (
                      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 mt-2 rounded bg-primary/10 dark:bg-primary/20 text-xs font-medium text-primary dark:text-primary-dark hover:bg-primary/20 dark:hover:bg-primary/30 transition cursor-pointer"
                      onClick={() => {
                        // Close mobile menu when clicking dashboard link
                        setNavbarOpen(false)
                        setOpenIndex(-1)
                        setClickedIndex(-1)
                      }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate max-w-[100px]">{user.name}</span>
                      </Link>                    
                      ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <Link
                        href="/signin"
                        className="block w-full px-3 py-1 text-center bg-transparent text-primary rounded-lg transition font-medium"
                        onClick={() => {
                          // Close mobile menu when clicking sign in
                          setNavbarOpen(false)
                          setOpenIndex(-1)
                          setClickedIndex(-1)
                        }}
                      >
                      {t('signIn')}
                      </Link>
                      <InteractiveHoverButton
                        className="block w-full px-4 py-2 text-center"
                        link="/signup"
                        text={t('signUp')}
                        onClick={() => {
                          // Close mobile menu when clicking sign up
                          setNavbarOpen(false)
                          setOpenIndex(-1)
                          setClickedIndex(-1)
                        }}
                      />
                    </div>
                    )}
                    </div>
                </nav>
              </div>

              <div className="flex items-center justify-end pr-16 lg:pr-0 gap-2">                
                <button
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label={t('cart')}
                  onClick={() => setCartOpen(true)}
                >
                  <IoCartOutline className="w-6 h-6" />
                  {totalQty > 0 && (
                    <span className="absolute -top-1 -right-1 bg-dark text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {totalQty}
                    </span>
                  )}
                </button>
                {isLoading ? (
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 mt-2 rounded bg-gray-100 dark:bg-gray-800 animate-pulse text-xs">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <span className="font-medium bg-gray-300 dark:bg-gray-700 rounded w-12 h-3 inline-block" />
                  </div>                ) : user ? (
                  <Link href="/dashboard" className="hidden md:flex items-center gap-2 px-2 py-2  bg-primary/10 dark:bg-primary/20 text-xs font-medium text-primary dark:text-white hover:bg-primary/20 dark:hover:bg-primary/30 transition cursor-pointer rounded-xl">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate max-w-[100px]">{user.name}</span>
                  </Link>                
                  ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      href="/signin"
                      className="px-4 py-1 text-center bg-transparent text-primary rounded-lg transition font-medium hover:bg-primary/10 dark:hover:bg-primary/20 dark:text-white"
                    >
                    {t('signIn')}
                    </Link>
                    <InteractiveHoverButton link="/signup" text={t('signUp')} />
                  </div>
                )}
                {/* Language Switcher: Desktop only */}
                <div className="relative hidden lg:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center px-2 py-2 rounded-xl border border-transparent text-sm font-medium bg-transparent hover:bg-gray-100 dark:hover:bg-stroke-dark dark:hover:text-white transition min-w-[70px]"
                  >
                    {flagSVG[currentLocale]}
                    <span className="ml-1 uppercase">{currentLocale}</span>
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-22 bg-white dark:bg-gray-900 rounded shadow-lg z-50 border border-gray-200 dark:border-gray-700 animate-fade-in">
                      {["en", "id"].map((locale) => (
                        <button
                          key={locale}
                          onClick={() => {
                            setDropdownOpen(false)
                            if (locale !== currentLocale) handleLocaleSwitch(locale)
                          }}
                          className={`flex items-center w-full px-3 py-2 text-left hover:bg-primary/10 dark:hover:bg-primary/20 transition ${locale === currentLocale ? "font-bold bg-gray-100 dark:bg-gray-800" : ""}`}
                        >
                          {flagSVG[locale]}
                          <span className="ml-1 uppercase">{locale}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <ThemeToggler />
                </div>
              </div>
            </div>
          </div>
          <ScrollProgress className="absolute bottom-0" />
        </div>
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      </header>
    </>
  )
}

export default Header
