import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Client = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Client Dashboard - KaamSetu";
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const BASE_URI = import.meta.env.VITE_API_URL;
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        const pros = response.data.filter(pro => pro.clientId === localStorage.getItem('userId'));
        setProjects(pros);
        setDisplayProjects(pros.reverse());
      }
    ).catch((err) => {
      console.log(err);
      fetchProjects();
    });
  };

  const handleFilter = async (status) => {
    if (status === "All") {
      setDisplayProjects(projects);
    } else if (status === "Un assigned") {
      setDisplayProjects(projects.filter(project => project.status === "Available"));
    } else if (status === "In Progress") {
      setDisplayProjects(projects.filter(project => project.status === "Assigned"));
    } else if (status === "Completed") {
      setDisplayProjects(projects.filter(project => project.status === "Completed"));
    }
  };

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <div className='mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center'>
        <div>
          <p className='theme-heading text-3xl font-bold'>My Projects</p>
        </div>
        <div className='relative'>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} id="dropdownRadioHelperButton" data-dropdown-toggle="dropdownRadioHelper" className="theme-button-accent theme-dropdown-button inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium" type="button">
            Project Status
            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>
          <div id="dropdownRadioHelper" className={`theme-dropdown-panel z-10 ${dropdownOpen ? '' : 'hidden'} absolute right-1 top-15 w-60 rounded-xl`}>
            <ul className="space-y-1 p-3 text-sm text-black" aria-labelledby="dropdownRadioHelperButton">
              <li>
                <div className="theme-dropdown-option flex p-2">
                  <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex h-5 items-center">
                    <input onChange={(e) => handleFilter(e.target.value)} id="helper-radio-4" name="helper-radio" type="radio" value="All" className="theme-radio h-4 w-4 border-gray-300 bg-gray-100 focus:ring-2" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-4" className="font-medium text-gray-900">
                      <div>All</div>
                    </label>
                  </div>
                </div>
              </li>
              <li>
                <div className="theme-dropdown-option flex p-2">
                  <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex h-5 items-center">
                    <input onChange={(e) => handleFilter(e.target.value)} id="helper-radio-unassigned" name="helper-radio" type="radio" value="Un assigned" className="theme-radio h-4 w-4 border-gray-300 bg-gray-100 focus:ring-2" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-unassigned" className="font-medium text-gray-900">
                      <div>Un assigned</div>
                    </label>
                  </div>
                </div>
              </li>
              <li>
                <div className="theme-dropdown-option flex p-2">
                  <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex h-5 items-center">
                    <input onChange={(e) => handleFilter(e.target.value)} id="helper-radio-5" name="helper-radio" type="radio" value="In Progress" className="theme-radio h-4 w-4 border-gray-300 bg-gray-100 focus:ring-2" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-5" className="font-medium text-gray-900">
                      <div>In Progress</div>
                    </label>
                  </div>
                </div>
              </li>
              <li>
                <div className="theme-dropdown-option flex p-2">
                  <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex h-5 items-center">
                    <input onChange={(e) => handleFilter(e.target.value)} id="helper-radio-6" name="helper-radio" type="radio" value="Completed" className="theme-radio h-4 w-4 border-gray-300 bg-gray-100 focus:ring-2" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-6" className="font-medium text-gray-900">
                      <div>Completed</div>
                    </label>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className='mt-20 flex flex-col items-center justify-center'>
          <p className='theme-muted-text text-2xl'>No projects found</p>
        </div>
      ) : (
        <div className='grid min-h-[200px] grid-cols-1 gap-4 overflow-auto scrollbar-hide md:grid-cols-2 lg:grid-cols-3'>
          {displayProjects.map(project => (
            <div key={project._id} className='flex'>
              <div onClick={() => navigate(`/client-project/${project._id}`)} className='theme-card flex min-h-[150px] w-[260px] flex-1 cursor-pointer flex-col overflow-auto rounded-xl p-4 scrollbar-hide'>
                <h3 className='mb-3 text-lg font-bold'>{project.title.slice(0, 30)}{project.title.length > 30 ? '...' : ''}</h3>
                <p className='mb-2 wrap-break-word text-sm'>{project.description.slice(0, 100)}{project.description.length > 100 ? '...' : ''}</p>
                <p className='mb-2 text-sm'>Budget: ₹{project.budget}</p>
                <p className='mb-2 text-sm'>Skills: {project.skills}</p>
                <p className='mb-2 text-sm'>
                  Status:<span className={`text-sm ${project.status === "Available" ? "text-green-500" : project.status === "In Progress" ? "text-yellow-500" : project.status === "Assigned" ? "text-blue-500" : "text-red-500"}`}> {project.status}</span>
                </p>
                <div className='theme-muted-text mt-auto text-sm'>{project.postedDate.slice(0, 15)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Client;
