import React from 'react'

export const TypingCursor: React.FC = () => {
  return (
    <span 
      className="inline-block w-1.5 h-3.5 bg-primary/80 animate-[cursorBlink_1s_infinite] ml-1 align-middle" 
      aria-hidden="true" 
    />
  )
}
export default TypingCursor
