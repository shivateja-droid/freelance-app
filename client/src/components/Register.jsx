import { useState, useContext } from 'react';
import { GeneralContext } from '../context/GeneralContext.jsx';

const Register = ({ setAuthType }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setUsername, setEmail, setPassword, usertype, setUsertype, register } = useContext(GeneralContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register();
  };

  return (
    <div className='min-h-[calc(100vh-5rem)]'>
      <section className="theme-auth-shell min-h-[calc(100vh-5rem)]">
        <div className="flex flex-col items-center justify-center px-4 py-8 mx-auto min-h-[calc(100vh-5rem)] sm:px-6 lg:py-0">
          <div className="theme-auth-card w-full rounded-2xl md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="theme-heading text-xl font-bold leading-tight tracking-tight md:text-2xl">
                Create an account
              </h1>
              <form className="space-y-4 md:space-y-6" action="#">
                <div>
                  <label htmlFor="username" className="theme-heading block mb-2 text-sm font-medium">Your Username</label>
                  <input
                    onChange={(e) => setUsername(e.target.value)}
                    type="username"
                    name="username"
                    id="username"
                    className="theme-input block w-full rounded-xl p-2.5 text-sm"
                    placeholder="username"
                    required=""
                  />
                </div>
                <div>
                  <label htmlFor="email" className="theme-heading block mb-2 text-sm font-medium">Your email</label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    name="email"
                    id="email"
                    className="theme-input block w-full rounded-xl p-2.5 text-sm"
                    placeholder="name@gmail.com"
                    required=""
                  />
                </div>
                <div>
                  <label htmlFor="password" className="theme-heading block mb-2 text-sm font-medium">Password</label>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="theme-input block w-full rounded-xl p-2.5 text-sm"
                    required=""
                  />
                </div>
                <div>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} id="dropdownRadioHelperButton" data-dropdown-toggle="dropdownRadioHelper" className="theme-button-accent theme-dropdown-button inline-flex items-center px-5 py-2.5 text-center text-sm font-medium" type="button">
                    Usertype
                    <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                    </svg>
                  </button>
                  <div id="dropdownRadioHelper" className={`theme-dropdown-panel z-10 ${dropdownOpen ? '' : 'hidden'} w-60 rounded-xl absolute`}>
                    <ul className="p-3 space-y-1 text-sm text-black" aria-labelledby="dropdownRadioHelperButton">
                      <li>
                        <div className="theme-dropdown-option flex p-2 ">
                          <div className="flex items-center h-5">
                            <input onChange={(e) => setUsertype(e.target.value)} checked={usertype === "client"} id="helper-radio-4" name="helper-radio" type="radio" value="client" className="theme-radio w-4 h-4 border-gray-300 bg-gray-100 focus:ring-2" />
                          </div>
                          <div onClick={() => setDropdownOpen(!dropdownOpen)} className="ms-2 text-sm">
                            <label htmlFor="helper-radio-4" className="font-medium text-gray-900">
                              <div>client</div>
                            </label>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div  className="theme-dropdown-option flex p-2">
                          <div className="flex items-center h-5">
                            <input onChange={(e) => setUsertype(e.target.value)} checked={usertype === "freelancer"} id="helper-radio-5" name="helper-radio" type="radio" value="freelancer" className="theme-radio w-4 h-4 border-gray-300 bg-gray-100 focus:ring-2" />
                          </div>
                          <div onClick={() => setDropdownOpen(!dropdownOpen)} className="ms-2 text-sm">
                            <label htmlFor="helper-radio-5" className="font-medium text-gray-900">
                              <div>freelancer</div>
                            </label>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div  className="theme-dropdown-option flex p-2">
                          <div className="flex items-center h-5">
                            <input onChange={(e) => setUsertype(e.target.value)} checked={usertype === "admin"} id="helper-radio-6" name="helper-radio" type="radio" value="admin" className="theme-radio w-4 h-4 border-gray-300 bg-gray-100 focus:ring-2" />
                          </div>
                          <div onClick={() => setDropdownOpen(!dropdownOpen)} className="ms-2 text-sm ">
                            <label htmlFor="helper-radio-6" className="font-medium text-gray-900">
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
                    <input id="terms" aria-describedby="terms" type="checkbox" className="theme-checkbox w-4 h-4 rounded border border-gray-300 bg-gray-50" required="" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="theme-muted-text font-light">I accept the <a className="theme-link font-medium" href="#">Terms and Conditions</a></label>
                  </div>
                </div>
                <button onClick={handleSubmit} className="theme-button-primary w-full px-5 py-2.5 text-center text-sm font-medium">Create an account</button>
                <p className="text-sm font-light text-gray-900">
                  Already have an account? <a onClick={() => setAuthType('login')} className="theme-link cursor-pointer font-medium">Login here</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;
