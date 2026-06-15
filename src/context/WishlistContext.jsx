import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()

// Build the storage key for a given user. Guests share a 'guest' bucket;
// each logged-in user gets their own bucket keyed by their id.
function keyFor(userId) {
  return userId ? `bihaan_wishlist_${userId}` : 'bihaan_wishlist_guest'
}

function readWishlist(userId) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId)) || '[]')
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id || null

  // Initialise from the current user's bucket
  const [wishlist, setWishlist] = useState(() => readWishlist(userId))

  // When the logged-in user changes (login / logout / switch account),
  // load THAT user's own wishlist instead of carrying over the previous one.
  useEffect(() => {
    setWishlist(readWishlist(userId))
  }, [userId])

  // Persist to the current user's bucket whenever the wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(wishlist))
    } catch {}
  }, [wishlist, userId])

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