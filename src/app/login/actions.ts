"use server"

import { createClient } from "@/lib/supabase"
import { shape } from "@/utils/client"
import { redirect } from "next/navigation"

type Credentials = { email: string; password: string }

export const login = async (fd: FormData) => {
  const supabase = await createClient()
  await supabase.auth.signInWithPassword(shape(fd) as Credentials)

  redirect("/")
}

export const signup = async (fd: FormData) => {
  const supabase = await createClient()
  await supabase.auth.signUp(shape(fd) as Credentials)

  redirect("/auth/verify")
}
