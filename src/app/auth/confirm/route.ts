import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const hash = new URL(request.url).searchParams.get("hash")

  if (hash) {
    const supabase = await createClient()
    await supabase.auth.verifyOtp({ type: "email", token_hash: hash })
  }

  redirect("/")
}
