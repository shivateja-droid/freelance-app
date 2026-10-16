import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import Authenticate from './pages/Authenticate.jsx'
import Client from './pages/client/Client.jsx'
import NewProject from './pages/client/NewProject.jsx'
import ProjectApplications from './pages/client/ProjectApplications.jsx'
import ProjectWorking from './pages/client/ProjectWorking.jsx'
import Freelancer from './pages/freelancer/Freelancer.jsx'
import AllProjects from './pages/freelancer/AllProjects.jsx'
import MyProjects from './pages/freelancer/MyProjects.jsx'
import MyApplications from './pages/freelancer/MyApplications.jsx'
import ProjectData from './pages/freelancer/ProjectData.jsx'
import Admin from './pages/admin/Admin.jsx'
import AdminProjects from './pages/admin/AdminProjects.jsx'
import AllApplications from './pages/admin/AllApplications.jsx'
import AllUsers from './pages/admin/AllUsers.jsx'
import { Analytics } from '@vercel/analytics/react'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {


  return (
    <div className="app-shell h-screen overflow-hidden flex flex-col">
      <Analytics />
      <Navbar />
      <div className="app-backdrop fixed inset-0 -z-10 h-full w-full"></div>
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/authenticate' element={<Authenticate />} />

          <Route path='/client' element={<ProtectedRoute allowedRoles={['client']}><Client /></ProtectedRoute>} />
          <Route path='/new-project' element={<ProtectedRoute allowedRoles={['client']}><NewProject /></ProtectedRoute>} />
          <Route path='/project-applications' element={<ProtectedRoute allowedRoles={['client']}><ProjectApplications /></ProtectedRoute>} />
          <Route path='/client-project/:id' element={<ProtectedRoute allowedRoles={['client']}><ProjectWorking /></ProtectedRoute>} />

          <Route path='/freelancer' element={<ProtectedRoute allowedRoles={['freelancer']}><Freelancer /></ProtectedRoute>} />
          <Route path='/all-projects' element={<ProtectedRoute allowedRoles={['freelancer']}><AllProjects /></ProtectedRoute>} />
          <Route path='/my-projects' element={<ProtectedRoute allowedRoles={['freelancer']}><MyProjects /></ProtectedRoute>} />
          <Route path='/myApplications' element={<ProtectedRoute allowedRoles={['freelancer']}><MyApplications /></ProtectedRoute>} />
          <Route path='/project/:id' element={<ProtectedRoute allowedRoles={['freelancer']}><ProjectData /></ProtectedRoute>} />

          <Route path='/admin' element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
          <Route path='/admin-projects' element={<ProtectedRoute allowedRoles={['admin']}><AdminProjects /></ProtectedRoute>} />
          <Route path='/admin-applications' element={<ProtectedRoute allowedRoles={['admin']}><AllApplications /></ProtectedRoute>} />
          <Route path='/all-users' element={<ProtectedRoute allowedRoles={['admin']}><AllUsers /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
