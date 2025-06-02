import { updateSession } from "@/lib/supabase"
import { NextRequest } from "next/server"

export const middleware = async (req: NextRequest) => await updateSession(req)
export const config = { matcher: ["/private"] }
