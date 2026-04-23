import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewProject = () => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(0);
  const [skills, setSkills] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create New Project - KaamSetu";
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const BASE_URI = import.meta.env.VITE_API_URL;
    axios.post(`${BASE_URI}/new-project`, {
      title: projectName,
      description,
      budget,
      skills,
      clientId: localStorage.getItem('userId'),
      clientName: localStorage.getItem('username'),
      clientEmail: localStorage.getItem('email'),
      status: "Available"
    })
      .then(() => {
        alert("Project created successfully");
        setProjectName('');
        setDescription('');
        setBudget(0);
        setSkills('');
        navigate('/client');
      })
      .catch(() => {
        alert("Error creating project");
      });
  };

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <h2 className='theme-heading mb-4 text-2xl font-bold'>Create New Project</h2>
      <form>
        <div className="mb-6">
          <label htmlFor="small-input" className="theme-heading mb-2 block text-sm font-medium">Project Name</label>
          <input onChange={(e) => setProjectName(e.target.value)} value={projectName} type="text" id="small-input" className="theme-input block w-full rounded-xl p-2 text-xs" />
        </div>
        <div className='mb-6'>
          <label htmlFor="description" className="theme-heading mb-2 block text-sm font-medium">Your description</label>
          <textarea onChange={(e) => setDescription(e.target.value)} value={description} id="description" rows="4" className="theme-textarea block w-full rounded-xl p-2.5 text-sm" placeholder="Write your description here..."></textarea>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <div className='mb-6 w-full sm:w-1/3'>
            <label htmlFor="Budget" className="theme-heading mb-2 block text-sm font-medium">Budget in ₹</label>
            <input onChange={(e) => setBudget(e.target.value)} value={budget} type="number" id="Budget" aria-describedby="helper-text-explanation" className="theme-input block w-full rounded-xl p-2.5 text-sm" placeholder="90210" required />
          </div>
          <div className="mb-6 w-full sm:w-2/3">
            <label htmlFor="default-input" className="theme-heading mb-2 block text-sm font-medium">Required skills (separate by commas)</label>
            <input onChange={(e) => setSkills(e.target.value)} value={skills} type="text" id="default-input" className="theme-input block w-full rounded-xl p-2.5 text-sm" />
          </div>
        </div>
        <div className='flex'>
          <button onClick={handleSubmit} className='theme-button-primary px-4 py-2 font-bold' type="submit">Create Project</button>
        </div>
      </form>
    </div>
  );
};

export default NewProject;
