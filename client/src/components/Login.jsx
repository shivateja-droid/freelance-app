import { useContext } from 'react';
import { GeneralContext } from '../context/GeneralContext.jsx';

const Login = ({ setAuthType }) => {
  const { login, setEmail, setPassword } = useContext(GeneralContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login();
  };

  return (
    <div className='min-h-[calc(100vh-5rem)] overflow-auto scrollbar-hide'>
      <section className="theme-auth-shell min-h-[calc(100vh-5rem)]">
        <div className="flex flex-col items-center justify-center px-4 py-8 mx-auto min-h-[calc(100vh-5rem)] sm:px-6 lg:py-0">
          <div className="theme-auth-card w-full rounded-2xl md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="theme-heading text-xl font-bold leading-tight tracking-tight md:text-2xl">
                Sign in to your account
              </h1>
              <form className="space-y-4 md:space-y-6" action="#">
                <div>
                  <label htmlFor="email" className="theme-heading block mb-2 text-sm font-medium">Your email</label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    name="email"
                    id="email"
                    className="theme-input block w-full rounded-xl p-2.5"
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
                    className="theme-input block w-full rounded-xl p-2.5"
                    required=""
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="remember" aria-describedby="remember" type="checkbox" className="theme-checkbox w-4 h-4 rounded border border-gray-300 bg-gray-50" required="" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="remember" className="theme-muted-text">Remember me</label>
                    </div>
                  </div>
                  <a href="#" className="theme-link text-sm font-medium">Forgot password?</a>
                </div>
                <button onClick={handleLogin} type="submit" className="theme-button-primary w-full px-5 py-2.5 text-center text-sm font-medium">Sign in</button>
                <p className="text-sm font-light text-black">
                  Don&apos;t have an account yet? <a onClick={() => setAuthType('register')} className="theme-link cursor-pointer font-medium">Sign up</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
