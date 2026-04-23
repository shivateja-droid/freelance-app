import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    document.title = "Admin Dashboard - KaamSetu";
  }, []);

  const fetchProjects = async () => {
    await axios.get(`${BASE_URI}/fetch-projects`).then(
      (response) => {
        setProjectsCount(response.data.length);
        const comPros = response.data.filter((pro) => pro.status === "Completed");
        setCompletedProsCount(comPros.length);
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const fetchApplications = async () => {
    await axios.get(`${BASE_URI}/fetch-applications`).then(
      (response) => {
        setApplicationsCount(response.data.length);
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  const fetchUsers = async () => {
    await axios.get(`${BASE_URI}/fetch-users`).then(
      (response) => {
        setUsersCount(response.data.length);
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  return (
    <div className="admin-page h-full overflow-hidden">
      <div className="theme-page-shell admin-home-cards page-scroll-frame m-3 grid grid-cols-1 gap-5 rounded-2xl p-4 sm:m-5 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="theme-stat-card theme-panel-divider flex flex-col items-center justify-center gap-4 rounded-2xl border-b p-4 md:border-b-0 md:border-r md:pr-4">
          <h4 className='theme-heading text-2xl'>All Projects</h4>
          <p>{projectsCount}</p>
          <button className='theme-button-primary px-4 py-2' onClick={() => navigate('/admin-projects')}>View projects</button>
        </div>

        <div className="theme-stat-card theme-panel-divider flex flex-col items-center justify-center gap-4 rounded-2xl border-b p-4 md:border-b-0 xl:border-r xl:pr-4">
          <h4 className='theme-heading text-2xl'>Completed projects</h4>
          <p>{completedProsCount}</p>
          <button className='theme-button-primary px-4 py-2' onClick={() => navigate('/admin-projects')}>View projects</button>
        </div>

        <div className="theme-stat-card theme-panel-divider flex flex-col items-center justify-center gap-4 rounded-2xl border-b p-4 md:border-b-0 md:border-r md:pr-4">
          <h4 className='theme-heading text-2xl'>Applications</h4>
          <p>{applicationsCount}</p>
          <button className='theme-button-primary px-4 py-2' onClick={() => navigate('/admin-applications')}>View Applications</button>
        </div>

        <div className="theme-stat-card flex flex-col items-center justify-center gap-4 rounded-2xl p-4">
          <h4 className='theme-heading text-2xl'>Users</h4>
          <p>{usersCount}</p>
          <button className='theme-button-primary px-4 py-2' onClick={() => navigate('/all-users')}>View Users</button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
