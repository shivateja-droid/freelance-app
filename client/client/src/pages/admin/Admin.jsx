import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

const Admin = () => {

  const navigate = useNavigate();

  const [projectsCount, setProjectsCount] = useState(0);
  const [completedProsCount, setCompletedProsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const BASE_URI = import.meta.env.VITE_API_URL;


  useEffect(() => {
    fetchProjects();
    fetchApplications();
    fetchUsers();
  }, [])

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        setProjectsCount(response.data.length);
        const comPros = response.data.filter((pro) => pro.status === "Completed");
        setCompletedProsCount(comPros.length);
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const fetchApplications = async () => {
    await axios.get(`${BASE_URI}/fetch-applications`).then(
      (response) => {
        setApplicationsCount(response.data.length);
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const fetchUsers = async () => {
    await axios.get(`${BASE_URI}/fetch-users`).then(
      (response) => {
        setUsersCount(response.data.length);
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  return (
    <div className="admin-page">
      <div className="admin-home-cards flex gap-10 m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg">

        <div className="w-1/4 border-r-2 border-[#2A652E] pr-4 flex flex-col gap-4 justify-center items-center">
          <h4  className='text-2xl'>All Projects</h4>
          <p>{projectsCount}</p>
          <button className='text-white rounded-lg px-4 py-2 bg-[#2A652E]' onClick={() => navigate('/admin-projects')}>View projects</button>
        </div>

        <div className="w-1/4 border-r-2 border-[#2A652E] pr-4 flex flex-col gap-4 justify-center items-center">
          <h4 className='text-2xl'>Completed projects</h4>
          <p>{completedProsCount}</p>
          <button className='text-white rounded-lg px-4 py-2 bg-[#2A652E]' onClick={() => navigate('/admin-projects')}>View projects</button>
        </div>

        <div className="w-1/4 border-r-2 border-[#2A652E] pr-4 flex flex-col gap-4 justify-center items-center">
          <h4 className='text-2xl'>Applications</h4>
          <p>{applicationsCount}</p>
          <button className='text-white rounded-lg px-4 py-2 bg-[#2A652E]' onClick={() => navigate('/admin-applications')}>View Applications</button>
        </div>

        <div className="w-1/4 flex flex-col gap-4 justify-center items-center">
          <h4 className='text-2xl'>Users</h4>
          <p>{usersCount}</p>
          <button className='text-white rounded-lg px-4 py-2 bg-[#2A652E]' onClick={() => navigate('/all-users')}>View Users</button>
        </div>


      </div>
    </div>
  )
}

export default Admin