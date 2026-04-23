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

function App() {


  return (
    <div className="app-shell h-screen overflow-hidden flex flex-col">
      <Navbar />
      <div className="app-backdrop fixed inset-0 -z-10 h-full w-full"></div>
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/authenticate' element={<Authenticate />} />

          <Route path='/client' element={<Client />} />
          <Route path='/new-project' element={<NewProject />} />
          <Route path='/project-applications' element={<ProjectApplications />} />
          <Route path='/client-project/:id' element={<ProjectWorking />} />

          <Route path='/freelancer' element={<Freelancer />} />
          <Route path='/all-projects' element={<AllProjects />} />
          <Route path='/my-projects' element={<MyProjects />} /> 
          <Route path='/myApplications' element={<MyApplications />} />
          <Route path='/project/:id' element={<ProjectData />} />

          <Route path='/admin' element={<Admin />} />
          <Route path='/admin-projects' element={<AdminProjects />} />
          <Route path='/admin-applications' element={<AllApplications />} />
          <Route path='/all-users' element={<AllUsers />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
