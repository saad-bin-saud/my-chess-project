import React from "react"
import { motion } from "framer-motion"

// Apple-style mobile menu component
// - Tailwind CSS classes used for styling (assumes Tailwind configured)
// - Uses system font stack to mimic Apple SF UI
// - Gentle shadows, large rounded cards, lots of white space

export default function AppleStyleGameMenu() {
  return (
    <div className="apple-menu-root">
      <div className="apple-menu-container">
        {/* Large Start Button */}
  <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="apple-start-btn"
          aria-label="Start Game"
        >
          Start Game
        </motion.button>

        {/* Menu list */}
        <div className="apple-menu-list">
          <MenuRow icon="🏅" label="Tournaments" />
          <MenuRow icon="🤝" label="Anonymous Talk" />
          <MenuRow icon="🤖" label="Ranking Match" />
          <MenuRow icon="👩‍🦰" label="Earn BNS" />
        </div>

        {/* More button */}
        <div className="apple-more-wrap">
          <button className="apple-more-btn" aria-label="More">
            More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuRow({ icon, label }) {
  return (
    <motion.button whileTap={{ scale: 0.995 }} className="apple-menu-row" aria-label={label}>
      <div className="apple-menu-row-icon" aria-hidden>{icon}</div>
      <div className="apple-menu-row-label">{label}</div>
    </motion.button>
  )
}

/* Styling notes / how to make it feel more "Apple":

Use the system font stack that includes San Francisco: font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

Keep lots of white space, subtle shadows, soft rounded corners (2xl), restrained color palette (mostly white/gray)

Large, legible typography; call-to-action (Start Game) is prominent and slightly bigger than other items

Use gentle motion for entrance and tap feedback (Framer Motion)

How to use:

Ensure Tailwind CSS is configured in your project

Install framer-motion: npm i framer-motion

Drop this component into a page and it should render the Apple-like menu */
