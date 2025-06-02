import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const place = (cookies: any[], store: any) => {
  cookies.forEach(({ name, value, options }) => {
    store.set(name, value, options)
  })
}

export const createClient = async () => {
  const store = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (cookies) => {
          try {
            place(cookies, store)
          } catch {
            console.log("Cookies from server")
          }
        },
      },
    },
  )
}

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          place(cookies, request.cookies)
          response = NextResponse.next({ request })
          place(cookies, response.cookies)
        },
      },
    },
  )

  const { data } = await supabase.auth.getUser()
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url))

  return response
}
