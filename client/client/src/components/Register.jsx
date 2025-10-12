import React from 'react'
import { useState } from 'react'
import { useContext } from 'react';
import { GeneralContext } from '../context/GeneralContext.jsx';

const Register = ({ setAuthType }) => {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setUsername, setEmail, setPassword, usertype, setUsertype, register } = useContext(GeneralContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register();

  };
  return (
    <div className='h-[90vh]'>
      <section className="bg-gray-50 dark:bg-[#A9DBAC] h-full">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-full lg:py-0">
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-[#48AD4F] dark:border-[#61BD67]">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Create an account
              </h1>
              <form className="space-y-4 md:space-y-6" action="#">
                <div>
                  <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Your Username</label>
                  <input onChange={(e) => setUsername(e.target.value)} type="username" name="username" id="username" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="username" required="" />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Your email</label>
                  <input onChange={(e) => setEmail(e.target.value)} type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@gmail.com" required="" />
                </div>
                <div>
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-black">Password</label>
                  <input onChange={(e) => setPassword(e.target.value)} type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-[#A9DBAC] dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" required="" />
                </div>
                {/* dropdown */}
                <div>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} id="dropdownRadioHelperButton" data-dropdown-toggle="dropdownRadioHelper" className="text-white bg-[#2A652E] hover:bg-[#2A652E] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-[#2A652E] dark:hover:bg-[#2A652E] dark:focus:ring-[#2A652E]" type="button">Usertype <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
                  </svg>
                  </button>
                  <div id="dropdownRadioHelper" className={`z-10 ${dropdownOpen ? '' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-60 dark:bg-[#A9DBAC] dark:divide-gray-600 absolute`}>
                    <ul className="p-3 space-y-1 text-sm text-black dark:text-gray-200" aria-labelledby="dropdownRadioHelperButton">
                      <li>
                        <div className="flex p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                          <div className="flex items-center h-5">
                            <input onChange={(e)=> setUsertype(e.target.value)} checked={usertype === "client"} id="helper-radio-4" name="helper-radio" type="radio" value="client" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                          </div>
                          <div className="ms-2 text-sm">
                            <label htmlFor="helper-radio-4" className="font-medium text-gray-900 dark:text-gray-900">
                              <div>client</div>
                            </label>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="flex p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                          <div className="flex items-center h-5">
                            <input onChange={(e)=> setUsertype(e.target.value)} checked={usertype === "freelancer"} id="helper-radio-5" name="helper-radio" type="radio" value="freelancer" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                          </div>
                          <div className="ms-2 text-sm">
                            <label htmlFor="helper-radio-5" className="font-medium text-gray-900 dark:text-gray-900">
                              <div>freelancer</div>
                            </label>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="flex p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                          <div className="flex items-center h-5">
                            <input onChange={(e)=> setUsertype(e.target.value)}  checked={usertype === "admin"} id="helper-radio-6" name="helper-radio" type="radio" value="admin" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-[#A9DBAC] dark:focus:ring-offset-[#A9DBAC] focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                          </div>
                          <div className="ms-2 text-sm">
                            <label htmlFor="helper-radio-6" className="font-medium text-gray-900 dark:text-gray-900">
                              <div>admin</div>
                            </label>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="terms" aria-describedby="terms" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-[#A9DBAC] dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required="" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-light text-gray-500 dark:text-gray-300">I accept the <a className="font-medium text-primary-900 hover:underline dark:text-primary-500" href="#">Terms and Conditions</a></label>
                  </div>
                </div>
                <button onClick={handleSubmit} className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Create an account</button>
                <p className="text-sm font-light text-gray-900 dark:text-gray-900">
                  Already have an account? <a onClick={() => setAuthType('login')} className="font-medium text-primary-900 hover:underline dark:text-primary-900">Login here</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Register