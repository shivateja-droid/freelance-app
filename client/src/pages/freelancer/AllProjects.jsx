import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AllProjects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [displayProjects, setDisplayProjects] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);

  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "All Projects - KaamSetu";
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        setProjects(response.data);
        setDisplayProjects(response.data);

        response.data.forEach((project) => {
          project.skills.forEach((skill) => {
            if (!allSkills.includes(skill)) {
              allSkills.push(skill);
            }
          });
        });
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const handleCategoryCheckBox = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setCategoryFilter([...categoryFilter, value]);
    } else {
      setCategoryFilter(categoryFilter.filter(size => size !== value));
    }
  };

  useEffect(() => {
    if (categoryFilter.length > 0) {
      setDisplayProjects(projects.filter(project => categoryFilter.every(skill => project.skills.includes(skill))).reverse());
    } else {
      setDisplayProjects(projects.reverse());
    }
  }, [categoryFilter]);

  return (
    <div className='page-fill-scroll flex w-full flex-col gap-5 overflow-hidden p-3 sm:p-5 lg:flex-row'>
      <div className='theme-sidebar-shell w-full rounded-2xl lg:w-64 lg:shrink-0'>
        <div className="p-5">
          <h3 className='theme-heading text-2xl font-bold'>Filters</h3>
          <hr className='theme-panel-divider mb-5' />
          <div className="filters">
            <h5 className='theme-subheading mb-5 text-xl font-bold'>Skills</h5>

            {allSkills.length > 0 ? (
              <div className="filter-options grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {allSkills.map((skill) => (
                  <div className="flex gap-2" key={skill}>
                    <input className="theme-checkbox form-check-input" type="checkbox" value={skill} id="flexCheckDefault" onChange={handleCategoryCheckBox} />
                    <label className="form-check-label" htmlFor="flexCheckDefault">{skill}</label>
                  </div>
                ))}
              </div>
            ) : ""}
          </div>
        </div>
      </div>
      <div className='theme-page-shell w-full min-h-[70vh] overflow-auto rounded-2xl p-4 scrollbar-hide sm:p-5'>
        <div>
          <p className='theme-heading mb-8 text-3xl font-bold sm:mb-10'>All Projects</p>
        </div>
        {projects.length === 0 ? (
          <div className='mt-20 flex flex-col items-center justify-center'>
            <p className='theme-muted-text text-2xl'>No projects found</p>
          </div>
        ) : (
          <div className='grid min-h-[200px] grid-cols-1 gap-4 overflow-auto scrollbar-hide md:grid-cols-2 xl:grid-cols-3'>
            {displayProjects.map(project => (
              <div key={project._id} className='flex items-center justify-center'>
                <div onClick={() => navigate(`/project/${project._id}`)} className='theme-card flex h-[260px] max-w-[260px] flex-1 cursor-pointer flex-col overflow-auto rounded-xl p-4 scrollbar-hide'>
                  <h3 className='mb-3 text-lg font-bold wrap-break-word'>{project.title.slice(0, 50)}...</h3>
                  <p className='mb-2 text-sm text-wrap wrap-break-word'>{project.description.slice(0, 100)}...</p>
                  <p className='mb-2 text-sm'>Budget: ₹{project.budget}</p>
                  <p className='mb-2 text-sm'>Skills: {project.skills}</p>
                  <p className='mb-2 text-sm'>
                    Status:<span className={`text-sm ${project.status === "Available" ? "text-green-500" : project.status === "In Progress" ? "text-yellow-500" : "text-red-500"}`}> {project.status}</span>
                  </p>
                  <div className='theme-muted-text mt-auto text-sm'>{project.postedDate.slice(0, 15)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProjects;
