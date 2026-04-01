// import AdminPanel from "./components/AdminPanel";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <TooltipProvider>
      {/* <AdminPanel /> */}
      <AdminPanel />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
