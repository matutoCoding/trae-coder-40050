import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import WaxMolding from "@/pages/WaxMolding";
import WaxInspection from "@/pages/WaxInspection";
import AssemblyWelding from "@/pages/AssemblyWelding";
import ShellMaking from "@/pages/ShellMaking";
import DewaxingFiring from "@/pages/DewaxingFiring";
import AlloyMelting from "@/pages/AlloyMelting";
import Pouring from "@/pages/Pouring";
import CleaningPolishing from "@/pages/CleaningPolishing";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wax-molding" element={<WaxMolding />} />
          <Route path="/wax-inspection" element={<WaxInspection />} />
          <Route path="/assembly-welding" element={<AssemblyWelding />} />
          <Route path="/shell-making" element={<ShellMaking />} />
          <Route path="/dewaxing-firing" element={<DewaxingFiring />} />
          <Route path="/alloy-melting" element={<AlloyMelting />} />
          <Route path="/pouring" element={<Pouring />} />
          <Route path="/cleaning-polishing" element={<CleaningPolishing />} />
        </Routes>
      </Layout>
    </Router>
  );
}
