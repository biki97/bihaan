import { createContext, useContext, useState, useEffect } from 'react'

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bihaan_wishlist') || '[]')
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('bihaan_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  function toggleWishlist(product) {
    setWishlist(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    )
  }

  function isWishlisted(id) {
    return wishlist.some(p => p.id === id)
  }

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  return useContext(WishlistContext)
}