import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { DirectionProvider } from "@workspace/ui/components/direction"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DirectionProvider direction="rtl">
      <App />
    </DirectionProvider>
  </StrictMode>
)
