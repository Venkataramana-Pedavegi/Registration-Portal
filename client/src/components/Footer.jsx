import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8 border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center gap-3">
            <img
              src="/sri_vasavi_logo.png"
              alt="Sri Vasavi Engineering College"
              className="h-10 w-10 object-contain rounded-full bg-white p-0.5"
            />
            <div>
              <h3 className="text-white font-bold text-base">Sri Vasavi Engineering College</h3>
              <p className="text-xs text-gray-400">Event Registration & Management Portal</p>
            </div>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Support Contact</a>
          </div>
        </div>
        <hr className="border-gray-800 my-6" />
        <div className="text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Sri Vasavi Engineering College Event Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
