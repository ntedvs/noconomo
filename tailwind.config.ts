import { Config } from "tailwindcss"

const config: Config = {
  content: ["src/app/**/*.tsx", "src/components/*.tsx"],
  theme: {
    extend: {
      colors: {
        foreground: "#120506",
        background: "#fcf5f4",
        primary: "#c74439",
        secondary: "#9ed365",
      },
    },
  },
}

export default config
