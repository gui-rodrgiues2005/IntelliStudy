import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { StudyProvider } from "./context/StudyContext";
import Dashboard from "./pages/Dashboard/Dashboard";
import Registro from "./pages/Registro/Registro";
import Login from "./pages/Login/Login";
import PrivateRoute from "../src/pages/Service/PrivateRoute";
import Resumos from "./pages/Resumos/Resumos";
import Simulados from "./pages/Simulados/Simulados";
import Perfil from "./pages/Perfil/Perfil";
import Ranking from "./pages/Ranking/Ranking";
import PlanoDeEstudo from "./pages/PlanoDeEstudo/PlanoDeEstudo";
import HistoricoDePlanos from "./pages/HistoricoDePlanos/HistoricoDePlanos";
import PricingPage from "./pages/PricingPage/PricingPage";
import PixPage from "./pages/Agradecimento/Agradecimento";
import MainLayout from "./components/Layout/MainLayout";

import Inicio from "./pages/SITE/Inicio/Inicio";
import Contato from "./pages/SITE/Contato/Contato";
import Sobre from "./pages/SITE/Sobre/Sobre";

import Termos from "./components/Termos/Termos "
import Politica from "./components/Politica/Politica"

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AgradecimentoPage from "./pages/Agradecimento/Agradecimento";

function App() {

  return (
    <Router>
      <StudyProvider>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/politica" element={<Politica />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/meus-resumos"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Resumos />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/meus-simulados"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Simulados />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Perfil />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <PrivateRoute>
                <MainLayout>
                  <Ranking />
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/plano-de-estudo"
            element={
              <PrivateRoute>
                <MainLayout>
                  <PlanoDeEstudo />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/historico-de-planos"
            element={
              <PrivateRoute>
                <MainLayout>
                  <HistoricoDePlanos />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/planos"
            element={
              <PrivateRoute>
                <MainLayout>
                  <PricingPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/agradecimento"
            element={
              <PrivateRoute>
                <MainLayout>
                  <AgradecimentoPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </StudyProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
