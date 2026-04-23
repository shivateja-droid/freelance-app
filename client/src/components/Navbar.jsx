import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeneralContext } from '../context/GeneralContext';
import BrandTitle from './BrandTitle';

const Navbar = () => {

  const usertype = localStorage.getItem('usertype');
  const username = localStorage.getItem('username');

  const navigate = useNavigate();

  const {logout} = useContext(GeneralContext);

  const navClass = "theme-navbar navbar flex flex-col gap-4 p-4 shrink-0 sm:p-5 lg:flex-row lg:justify-between lg:items-center";
  const optionsClass = "nav-options flex flex-wrap gap-3 justify-center items-center text-sm sm:gap-5 sm:text-base";
  const linkClass = "theme-nav-link cursor-pointer rounded-md px-2 py-1";
  const brandButtonClass = "flex justify-center lg:justify-start";
  const brandRoute = usertype === 'admin' ? '/admin' : usertype === 'client' ? '/client' : '/freelancer';


  return (
    <>

      {usertype === 'freelancer' ?
          <div className={navClass}>
            <button type="button" className={brandButtonClass} onClick={() => navigate(brandRoute)}>
              <BrandTitle />
              <span className="brand-title__badge brand-title">{username}</span>
            </button>

            <div className={optionsClass}>
                <p className={linkClass} onClick={()=> navigate('/freelancer')} >Dashboard</p>
                <p className={linkClass} onClick={()=> navigate('/all-projects')} >All Projects</p>
                <p className={linkClass} onClick={()=> navigate('/my-projects')} >My Projects</p>
                <p className={linkClass} onClick={()=> navigate('/myApplications')} >Applications</p>
                <p className={linkClass} onClick={()=> logout()} >Logout</p>
            </div>
          </div>
      :
      
      ""}
      
      {
        usertype === 'client' ?
          <div className={navClass}>
            <button type="button" className={brandButtonClass} onClick={() => navigate(brandRoute)}>
              <BrandTitle />
              <span className="brand-title__badge brand-title">{username}</span>
            </button>

            <div className={optionsClass}>
                <p className={linkClass} onClick={()=> navigate('/client')} >Dashboard</p>
                <p className={linkClass} onClick={()=> navigate('/new-project')} >New Project</p>
                <p className={linkClass} onClick={()=> navigate('/project-applications')} >Applications</p>
                <p className={linkClass} onClick={()=> logout()}>Logout</p>
            </div>
          </div>
        :
        ""
      }

      
      {usertype === 'admin' ?
          <div className={navClass}>
            <button type="button" className={brandButtonClass} onClick={() => navigate(brandRoute)}>
              <BrandTitle admin />
            </button>

            <div className={optionsClass}>
                <p className={linkClass} onClick={()=> navigate('/admin')} >Home</p>
                <p className={linkClass} onClick={()=> navigate('/all-users')} >All users</p>
                <p className={linkClass} onClick={()=> navigate('/admin-projects')} >Projects</p>
                <p className={linkClass} onClick={()=> navigate('/admin-applications')} >Applications</p>
                <p className={linkClass} onClick={()=> logout()}>Logout</p>
            </div>
          </div>
      : ""}

      

    </>
    

    
  )
}

export default Navbar
