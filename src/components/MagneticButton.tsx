import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { ReactNode, MouseEvent } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  strength?: number
  type?: 'button' | 'submit'
  disabled?: boolean
  ariaLabel?: string
}

/** Button that gently gravitates toward the cursor. */
export function MagneticButton({
  children,
  onClick,
  className,
  strength = 0.35,
  type = 'button',
  disabled,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    setOffset({ x: relX * strength, y: relY * strength })
  }

  const reset = () => setOffset({ x: 0, y: 0 })

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 180, damping: 16, mass: 0.6 }}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  )
}
