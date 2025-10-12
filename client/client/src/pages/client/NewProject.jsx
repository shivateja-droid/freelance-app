import React,{useState} from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewProject = () => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(0);
  const [skills, setSkills] = useState('');
  const navigate = useNavigate();

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
      .then((response) => {
        console.log(response.data);
        alert("Project created successfully");
        setProjectName('');
        setDescription('');
        setBudget(0);
        setSkills('');
        navigate('/client');
      })
      .catch((error) => {
        alert("Error creating project");
      });
  }

  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#2A652E] shadow-lg rounded-lg'>
      <h2 className='text-2xl font-bold mb-4'>Create New Project</h2>
      <form>
        <div className="mb-6">
          <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Project Name</label>
          <input onChange={(e) => setProjectName(e.target.value)} value={projectName} type="text" id="small-input" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-[#A9DBAC]  text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC]  dark:border-gray-600 dark:placeholder-gray-900 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
        </div>
        <div className='mb-6'>
          <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Your description</label>
          <textarea onChange={(e) => setDescription(e.target.value)} value={description} id="description" rows="4" className="block p-2.5 w-full text-sm text-gray-900 bg-[#A9DBAC] rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your description here..."></textarea>
        </div>
        <div className='flex gap-2'>
          <div className='w-1/3 mb-6'>
            <label htmlFor="Budget" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Budget in ₹</label>
            <input onChange={(e) => setBudget(e.target.value)} value={budget} type="number" id="Budget" aria-describedby="helper-text-explanation" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="90210" required />
          </div>
          <div className="mb-6 w-2/3">
            <label htmlFor="default-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Required skills (separate by commas)</label>
            <input onChange={(e) => setSkills(e.target.value)} value={skills} type="text" id="default-input" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
          </div>
        </div>
        <div className='flex '>
        <button onClick={handleSubmit} className='bg-[#40A048] text-white font-bold py-2 px-4 rounded ' type="submit">Create Project</button>
        </div>
      </form>
    </div>
  )
}

export default NewProject