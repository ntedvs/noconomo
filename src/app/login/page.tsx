import { login, signup } from "./actions"

export default function LoginPage() {
  return (
    <>
      <form className="flex flex-col">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="input"
        />

        <div className="">
          <button formAction={login} className="button">
            Log In
          </button>

          <button formAction={signup} className="button">
            Sign Up
          </button>
        </div>
      </form>
    </>
  )
}
