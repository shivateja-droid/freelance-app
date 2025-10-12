import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Client = () => {
  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        let pros = response.data.filter(pro => pro.freelancerId === localStorage.getItem('userId'));
        setProjects(pros);
        setDisplayProjects(pros.reverse());
        console.log(response.data);
      }
    ).catch((err) => {
      console.log(err);
      fetchProjects();
    })
  }
  const HandleFilter = (status) => {
    if (status === "") {
      setDisplayProjects(projects.reverse());
    } else if (status === "In Progress") {
      setDisplayProjects(projects.filter(project => project.status === "Assigned").reverse());
    } else if (status === "Completed") {
      setDisplayProjects(projects.filter(project => project.status === "Completed").reverse());
    }
  }
  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll'>
      <div className=' flex justify-between mb-10'>
        <div className='flex gap-5 justify-between w-full'>
          <p className='text-4xl font-bold'>My Projects</p>
          <select className='form-control' placeholder='Project status' onChange={(e) => HandleFilter(e.target.value)} >
            <option value="">Choose project status</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]'>
        {displayProjects.map((project) => (
          <div key={project._id} className='flex'>
            <div onClick={() => navigate(`/project/${project._id}`)} className='border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1 min-h-[150px] bg-green-100 hover:cursor-pointer hover:shadow-lg'>
              <h3 className='text-lg font-bold mb-3'>{project.title}</h3>
              <p className='text-sm mb-2'>{project.description}</p>
              <p className='text-sm mb-2'>Budget: ₹{project.budget}</p>
              <p className='text-sm mb-2'>
                Status:<span className={`text-sm ${project.status === "Available" ? "text-green-500" : project.status === "In Progress" ? "text-yellow-500" : "text-red-500"}`}> {project.status}</span>
              </p>
              <div className='text-sm text-gray-500 mt-auto'>{project.postedDate.slice(0, 15)}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Client