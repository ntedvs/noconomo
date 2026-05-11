import { ConvexProvider, ConvexReactClient } from "convex/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Outlet } from "react-router"
import "./index.css"
import Admin from "./admin"
import AdminEmail from "./admin-email"
import AdminHandbook from "./admin-handbook"
import App from "./app.tsx"
import { AuthProvider, RequireAuth } from "./auth"
import Bulletins from "./bulletins"
import Calendar from "./calendar"
import Documents from "./documents"
import Expenses from "./expenses"
import Gallery from "./gallery"
import Handbook from "./handbook"
import Members from "./members"
import Napkin from "./napkin"
import { Nav } from "./nav"
import NotFound from "./not-found"
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
                path="/bulletins"
                element={
                  <RequireAuth>
                    <Bulletins />
                  </RequireAuth>
                }
              />
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
                path="/store"
                element={
                  <RequireAuth>
                    <Store />
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
                path="/documents"
                element={
                  <RequireAuth>
                    <Documents />
                  </RequireAuth>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RequireAuth>
                    <Expenses />
                  </RequireAuth>
                }
              />
              <Route
                path="/napkin"
                element={
                  <RequireAuth>
                    <Napkin />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <Admin />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/handbook"
                element={
                  <RequireAuth>
                    <AdminHandbook />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/email"
                element={
                  <RequireAuth>
                    <AdminEmail />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConvexProvider>
  </StrictMode>,
)
