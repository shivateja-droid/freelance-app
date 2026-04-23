import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Client = () => {
  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My Projects - KaamSetu";
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        const pros = response.data.filter(pro => pro.freelancerId === localStorage.getItem('userId'));
        setProjects(pros);
        setDisplayProjects(pros.reverse());
      }
    ).catch((err) => {
      console.log(err);
      fetchProjects();
    });
  };

  const handleFilter = (status) => {
    if (status === "") {
      setDisplayProjects(projects.reverse());
    } else if (status === "In Progress") {
      setDisplayProjects(projects.filter(project => project.status === "Assigned").reverse());
    } else if (status === "Completed") {
      setDisplayProjects(projects.filter(project => project.status === "Completed").reverse());
    }
  };

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <div className='mb-8 flex justify-between sm:mb-10'>
        <div className='flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center'>
          <p className='theme-heading text-3xl font-bold'>My Projects</p>
          <select className='theme-select form-control w-full rounded-xl p-2 sm:w-auto' placeholder='Project status' onChange={(e) => handleFilter(e.target.value)} >
            <option value="">Choose project status</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
      <div className='grid min-h-[200px] grid-cols-1 gap-4 overflow-auto scrollbar-hide md:grid-cols-2 lg:grid-cols-3'>
        {displayProjects.map((project) => (
          <div key={project._id} className='flex'>
            <div onClick={() => navigate(`/project/${project._id}`)} className='theme-card flex min-h-[150px] w-[260px] flex-1 cursor-pointer flex-col overflow-auto rounded-xl p-4 scrollbar-hide'>
              <h3 className='mb-3 text-lg font-bold'>{project.title.slice(0, 30)}{project.title.length > 30 ? '...' : ''}</h3>
              <p className='mb-2 wrap-break-word text-sm'>{project.description.slice(0, 100)}{project.description.length > 100 ? '...' : ''}</p>
              <p className='mb-2 text-sm'>Budget: ₹{project.budget}</p>
              <p className='mb-2 text-sm'>
                Status:<span className={`text-sm ${project.status === "Available" ? "text-green-500" : project.status === "In Progress" ? "text-yellow-500" : project.status === "Assigned" ? "text-blue-500" : "text-red-500"}`}> {project.status}</span>
              </p>
              <div className='theme-muted-text mt-auto text-sm'>{project.postedDate.slice(0, 15)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Client;
