import { ConvexProvider, ConvexReactClient } from "convex/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Outlet } from "react-router"
import "./index.css"
import App from "./app.tsx"
import { AuthProvider, RequireAuth } from "./auth"
import Calendar from "./calendar"
import Gallery from "./gallery"
import Handbook from "./handbook"
import Members from "./members"
import { Nav } from "./nav"
import Store from "./store"

function Layout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<App />} />
              <Route
                path="/calendar"
                element={
                  <RequireAuth>
                    <Calendar />
                  </RequireAuth>
                }
              />
              <Route
                path="/members"
                element={
                  <RequireAuth>
                    <Members />
                  </RequireAuth>
                }
              />
              <Route
                path="/gallery"
                element={
                  <RequireAuth>
                    <Gallery />
                  </RequireAuth>
                }
              />
              <Route
                path="/handbook"
                element={
                  <RequireAuth>
                    <Handbook />
                  </RequireAuth>
                }
              />
              <Route
                path="/store"
                element={
                  <RequireAuth>
                    <Store />
                  </RequireAuth>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConvexProvider>
  </StrictMode>,
)
