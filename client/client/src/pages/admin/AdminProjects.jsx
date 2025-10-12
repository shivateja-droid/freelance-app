import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminProjects = () => {

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);

  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchProjects();
  }, [])

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        setProjects(response.data);
        setDisplayProjects(response.data);

        response.data.map((project) => {
          project.skills.map((skill) => {
            if (!allSkills.includes(skill)) {
              allSkills.push(skill);
            }
          })
        })
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  const handleCategoryCheckBox = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setCategoryFilter([...categoryFilter, value]);
    } else {
      setCategoryFilter(categoryFilter.filter(size => size !== value));
    }
  }

  useEffect(() => {
    if (categoryFilter.length > 0) {
      setDisplayProjects(projects.filter(project => categoryFilter.every(skill => project.skills.includes(skill))).reverse());
    } else {
      setDisplayProjects(projects.reverse());
    }
  }, [categoryFilter])

  return (
    <div className='w-full p-5 flex gap-5 h-[90vh] overflow-y-scroll'>
      <div className='w-[15vw] h-full bg-gray-100 rounded-lg border-2 border-[#2A652E] shadow-lg'>
        <div className="p-5">
          <h3 className='text-2xl font-bold'>Filters</h3>
          <hr className='mb-5' />
          <div className="filters">
            <h5 className='text-xl font-bold mb-5'>Skills</h5>

            {allSkills.length > 0 ?
              <div className="filter-options">
                {allSkills.map((skill) => (
                  <div className="flex gap-2" key={skill}>
                    <input className="form-check-input" type="checkbox" value={skill} id="flexCheckDefault" onChange={handleCategoryCheckBox} />
                    <label className="form-check-label" htmlFor="flexCheckDefault">{skill}</label>
                  </div>
                ))}
              </div>
              : ""}
          </div>
        </div>
      </div>
      <div className='w-[85vw] h-full bg-green-100 p-5 rounded-lg border-2 border-[#2A652E] shadow-lg'>
        <div>
          <p className='text-3xl font-bold mb-10'>All Projects</p>
        </div>
        {
          projects.length === 0 ? <div className='flex flex-col justify-center items-center mt-20'>
            <p className='text-2xl'>No projects found</p>
          </div> : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]'>
              {displayProjects.map(project => (
                <div key={project._id} className='flex'>
                  <div onClick={() => navigate(`/project/${project._id}`)} className='border border-[#2A652E] p-4 rounded-lg flex flex-col flex-1 min-h-[150px]'>
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
        }</div>
    </div>
  )
}

export default AdminProjects;