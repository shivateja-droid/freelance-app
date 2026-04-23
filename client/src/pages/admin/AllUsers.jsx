import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const BASE_URI = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    await axios.get(`${BASE_URI}/fetch-users`).then(
      (response) => {
        setUsers(response.data);
      }
    ).catch((err) => {
      console.log(err);
    });
  };

  useEffect(() => {
    document.title = "All Users - KaamSetu";
    fetchUsers();
  }, []);

  return (
    <div className='theme-page-shell page-scroll-frame m-3 rounded-2xl p-4 sm:m-5 sm:p-5'>
      <h3 className='theme-heading mb-8 text-3xl font-bold sm:mb-10 sm:text-4xl'>All Users</h3>
      <div className="flex flex-col gap-4">
        {users.map((user) => (
          <div className="theme-card grid min-h-[100px] grid-cols-1 gap-4 rounded-xl p-4 md:grid-cols-2 xl:grid-cols-4" key={user._id}>
            <span>
              <b>User Id</b>
              <p>{user._id}</p>
            </span>
            <span>
              <b>Username</b>
              <p>{user.username}</p>
            </span>
            <span>
              <b>Email</b>
              <p>{user.email}</p>
            </span>
            <span>
              <b>User Role</b>
              <p>{user.usertype}</p>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsers;
