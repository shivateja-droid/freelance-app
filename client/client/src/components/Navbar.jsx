import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeneralContext } from '../context/GeneralContext';

const Navbar = () => {


  const userId = localStorage.getItem('userId');

  const usertype = localStorage.getItem('usertype');

  const navigate = useNavigate();

  const {logout} = useContext(GeneralContext);


  return (
    <>

      {usertype === 'freelancer' ?
          <div className="navbar flex justify-between items-center bg-[#A9DBAC] p-5 mb-5">
            <h3 className='text-4xl font-bold flex justify-center items-center'>SB Works</h3>

            <div className="nav-options flex gap-5 justify-between items-center">
                <p onClick={()=> navigate('/freelancer')} >Dashboard</p>
                <p onClick={()=> navigate('/all-projects')} >All Projects</p>
                <p onClick={()=> navigate('/my-projects')} >My Projects</p>
                <p onClick={()=> navigate('/myApplications')} >Applications</p>
                <p onClick={()=> logout()} >Logout</p>
            </div>
          </div>
      :
      
      ""}
      
      {
        usertype === 'client' ?
          <div className="navbar flex justify-between items-center bg-[#A9DBAC] p-5 mb-5">
            <h3 className='text-4xl font-bold flex justify-center items-center'>SB Works</h3>

            <div className="nav-options flex gap-5 justify-between items-center">
                <p onClick={()=> navigate('/client')} >Dashboard</p>
                <p onClick={()=> navigate('/new-project')} >New Project</p>
                <p onClick={()=> navigate('/project-applications')} >Applications</p>
                <p onClick={()=> logout()}>Logout</p>
            </div>
          </div>
        :
        ""
      }

      
      {usertype === 'admin' ?
          <div className="navbar flex justify-between items-center bg-[#A9DBAC] p-5 mb-5">
            <h3 className='text-4xl font-bold flex justify-center items-center'>SB Works (admin)</h3>

            <div className="nav-options flex gap-5 justify-between items-center">
                <p onClick={()=> navigate('/admin')} >Home</p>
                <p onClick={()=> navigate('/all-users')} >All users</p>
                <p onClick={()=> navigate('/admin-projects')} >Projects</p>
                <p onClick={()=> navigate('/admin-applications')} >Applications</p>
                <p onClick={()=> logout()}>Logout</p>
            </div>
          </div>
      : ""}

      

    </>
    

    
  )
}

export default Navbar