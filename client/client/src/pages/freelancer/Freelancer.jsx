import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const Freelancer = () => {

  const navigate = useNavigate();

  const [freelancerdata, setFreelancerdata] = useState();

  const [skills, setSkills] = useState([]);

  const [description, setDescription] = useState("");

  const [freelancerId, setFreelancerId] = useState("");

  const [updateSkills, setUpdateSkills] = useState("");

  const [updateDescription, setUpdateDescription] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);

  const [applicationscount, setApplicationscount] = useState(0);

  const BASE_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchUserData(localStorage.getItem('userId'));
  }, [])

  useEffect(() => {
    fetchApplications();
  }, [])


  const fetchUserData = async (id) => {
    axios.get(`${BASE_URI}/fetch-freelancer/${id}`).then(
      (response) => {
        setFreelancerdata(response.data);
        if (response.data) {
          setFreelancerId(response.data._id);
          setSkills(response.data.skills);
          setDescription(response.data.description);
          setUpdateSkills(response.data.skills);
          setUpdateDescription(response.data.description);
        }
      }
    )
  }
  const updateUserData = async () => {

    axios.post(`${BASE_URI}/update-freelancer`,
      {
        freelancerId,
        updateSkills: updateSkills,
        description: updateDescription
      }).then(
        (response) => {
          fetchUserData();
          alert("User data updated")
        }
      )
  }

  const fetchApplications = async () => {
    await axios.get(`${BASE_URI}/fetch-applications`).then(
      (response) => {
        setApplicationscount(response.data.filter((application) => application.freelancerId === localStorage.getItem('userId')));
        console.log(response.data);
      }
    ).catch((err) => {
      console.log(err);
    })
  }

  return (
    <div className='h-[90vh] m-5 p-5 border-2 border-[#A9DBAC] shadow-lg rounded-lg overflow-y-scroll flex flex-col gap-5'>
      <div className='flex justify-between gap-5 h-1/2'>
        <div className="max-w-sm p-6 bg-[#A9DBAC] border border-gray-200 rounded-lg shadow-sm dark:bg-bg-[#A9DBAC] dark:border-[#A9DBAC]  h-2/3">
          <a>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-black">Current Projects : <span>{freelancerdata ? freelancerdata.currentProjects.length : 0}</span></h5>
          </a>
          <p className="mb-3 font-normal text-black ">Here are the current projects you are working on.</p>
          <a onClick={() => navigate('/my-projects')} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#2A652E] rounded-lg hover:bg-[#27a832] focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-[#2A652E] dark:hover:bg-[#27a832] dark:focus:ring-blue-800">
            view
            <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </a>
        </div>
        <div className="max-w-sm p-6 bg-[#A9DBAC] border border-gray-200 rounded-lg shadow-sm dark:bg-bg-[#A9DBAC] dark:border-[#A9DBAC]  h-2/3">
          <a>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-black">Completed Projects : <span>{freelancerdata ? freelancerdata.completedProjects.length : 0}</span></h5>
          </a>
          <p className="mb-3 font-normal text-black ">Here are the completed projects you have worked on.</p>
          <a onClick={() => navigate('/my-projects')} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#2A652E] rounded-lg hover:bg-[#27a832] focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-[#2A652E] dark:hover:bg-[#27a832] dark:focus:ring-blue-800">
            view
            <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </a>
        </div>
        <div className="max-w-sm p-6 bg-[#A9DBAC] border border-gray-200 rounded-lg shadow-sm dark:bg-bg-[#A9DBAC] dark:border-[#A9DBAC]  h-2/3">
          <a>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-black">Applications : <span>{applicationscount.length}</span></h5>
          </a>
          <p className="mb-3 font-normal text-black ">Here are the applications you have submitted.</p>
          <a onClick={() => navigate('/myApplications')} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#2A652E] rounded-lg hover:bg-[#27a832] focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-[#2A652E] dark:hover:bg-[#27a832] dark:focus:ring-blue-800">
            view
            <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </a>
        </div>
      </div>
      <div className='flex gap-5 w-full h-1/2'>
        {!isUpdating ?
          <div className="max-w-sm p-6 bg-[#A9DBAC] border border-gray-200 rounded-lg shadow-sm dark:bg-bg-[#A9DBAC] dark:border-[#A9DBAC] h-2/3 w-1/2 ">
            <div>
              My skills: {skills.length > 0 ? (
                <span className='font-bold'>
                  {skills.join(', ')}
                </span>
              ) : (
                <span>No skills provided.</span>
              )}
            </div>
            <div>Description: <span className='font-bold'></span>{description}{description ? "" : "No description provided."} </div>
            <button onClick={() => setIsUpdating(true)} className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#2A652E] rounded-lg hover:bg-[#27a832] focus:ring-4 focus:outline-none focus:ring-white dark:bg-[#2A652E] dark:hover:bg-[#27a832] dark:focus:ring-black">
              Edit Profile
            </button>
          </div>
          :
          <div className='w-1/2'>
            <div className="mb-6 w-full">
              <label htmlFor="default-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Your skills</label>
              <input onChange={(e) => setUpdateSkills(e.target.value)} value={updateSkills} type="text" id="default-input" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>
            <div className="mb-6 w-full">
              <label htmlFor="default-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Your Description</label>
              <input onChange={(e) => setUpdateDescription(e.target.value)} value={updateDescription} type="text" id="default-input" className="bg-[#A9DBAC] border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" />
            </div>
            <button onClick={updateUserData} className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#2A652E] rounded-lg hover:bg-[#27a832] focus:ring-4 focus:outline-none focus:ring-white dark:bg-[#2A652E] dark:hover:bg-[#27a832] dark:focus:ring-black">
              Edit Profile
            </button>
          </div>
        }
        <div className='flex gap-5 justify-end w-full'>
          <div className="max-w-sm p-6 bg-[#A9DBAC] border border-gray-200 rounded-lg shadow-sm dark:bg-bg-[#A9DBAC] dark:border-[#A9DBAC] h-2/3 w-1/2 ">
            <a>
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-black">Total funds : ₹<span >{freelancerdata ? freelancerdata.funds : "₹0"}</span></h5>
            </a>
            <p className="mb-3 font-normal text-black ">Here are the total funds you have earned.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Freelancer