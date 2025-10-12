import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Client = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const BASE_URI = import.meta.env.VITE_API_URL;
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        let pros = response.data.filter(pro => pro.clientId === localStorage.getItem('userId'));
        setProjects(pros);
        setDisplayProjects(pros.reverse());
      }
    ).catch((err) => {
      console.log(err);
      fetchProjects();
    })
  }
  const HandleFilter = async (status) => {
    if (status === "") {
      setDisplayProjects(projects);
    } else if (status === "Un assigned") {
      setDisplayProjects(projects.filter(project => project.status === "Available"));
    } else if (status === "In Progress") {
      setDisplayProjects(projects.filter(project => project.status === "Assigned"));
    } else if (status === "Completed") {
      setDisplayProjects(projects.filter(project => project.status === "Completed"));
    }
  }
  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg overflow-y-scroll'>
      <div className=' flex justify-between mb-10'>
        <div>
          <p className='text-4xl font-bold'>My Projects</p>
        </div>
        <div className='relative'>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} id="dropdownRadioHelperButton" data-dropdown-toggle="dropdownRadioHelper" className="text-white bg-[#2A652E] hover:bg-[#2A652E] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-[#2A652E] dark:hover:bg-[#2A652E] dark:focus:ring-[#2A652E]" type="button">Project Status <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
          </svg>
          </button>
          <div id="dropdownRadioHelper" className={`z-10 ${dropdownOpen ? '' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-60 dark:bg-[#A9DBAC] dark:divide-gray-600 absolute top-15 right-1`}>
            <ul className="p-3 space-y-1 text-sm text-black dark:text-gray-200" aria-labelledby="dropdownRadioHelperButton">
              <li>
                <div className="flex p-2 rounded-sm hover:bg-[#2A652E] dark:hover:bg-[#2A652E]">
                  <div className="flex items-center h-5">
                    <input onChange={(e) => HandleFilter(e.target.value)} id="helper-radio-4" name="helper-radio" type="radio" value="Un assigned" className="w-4 h-4 text-[#2A652E] bg-gray-100 border-gray-300 focus:ring-[#2A652E] dark:focus:ring-[#2A652E] dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-4" className="font-medium text-gray-900 dark:text-gray-900">
                      <div>Un assigned</div>
                    </label>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex p-2 rounded-sm hover:bg-[#2A652E] dark:hover:bg-[#2A652E]">
                  <div className="flex items-center h-5">
                    <input onChange={(e) => HandleFilter(e.target.value)} id="helper-radio-5" name="helper-radio" type="radio" value="In Progress" className="w-4 h-4 text-[#2A652E] bg-gray-100 border-gray-300 focus:ring-[#2A652E] dark:focus:ring-[#2A652E] dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-5" className="font-medium text-gray-900 dark:text-gray-900">
                      <div>In Progress</div>
                    </label>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex p-2 rounded-sm hover:bg-[#2A652E] dark:hover:bg-[#2A652E]">
                  <div className="flex items-center h-5">
                    <input onChange={(e) => HandleFilter(e.target.value)} id="helper-radio-6" name="helper-radio" type="radio" value="Completed" className="w-4 h-4 text-[#2A652E] bg-gray-100 border-gray-300 focus:ring-[#2A652E] dark:focus:ring-[#2A652E] dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                  </div>
                  <div className="ms-2 text-sm">
                    <label htmlFor="helper-radio-6" className="font-medium text-gray-900 dark:text-gray-900">
                      <div>Completed</div>
                    </label>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {
        projects.length === 0 ? <div className='flex flex-col justify-center items-center mt-20'>
          <p className='text-2xl'>No projects found</p>
        </div> : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]'>
            {displayProjects.map(project => (
              <div key={project._id} className='flex'>
                <div onClick={() => navigate(`/client-project/${project._id}`)} className='border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1 min-h-[150px] bg-green-100 hover:cursor-pointer hover:shadow-lg'>
                  <h3 className='text-lg font-bold mb-3'>{project.title}</h3>
                  <p className='text-sm mb-2'>{project.description}</p>
                  <p className='text-sm mb-2'>Budget: ₹{project.budget}</p>
                  <p className='text-sm mb-2'>Skills: {project.skills}</p>
                  <p className='text-sm mb-2'>
                    Status:<span className={`text-sm ${project.status === "Available" ? "text-green-500" : project.status === "In Progress" ? "text-yellow-500" : "text-red-500"}`}> {project.status}</span>
                  </p>
                  <div className='text-sm text-gray-500 mt-auto'>{project.postedDate.slice(0, 15)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default Client