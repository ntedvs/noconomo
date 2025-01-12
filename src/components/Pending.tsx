"use client"

import { useFormStatus } from "react-dom"

export default function Pending() {
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      className="button disabled:cursor-not-allowed disabled:bg-primary/80"
    >
      Submit
    </button>
  )
}
