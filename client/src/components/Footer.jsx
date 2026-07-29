import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8 border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">CampusEvents</h3>
            <p className="text-sm">Simplifying college event registration and management.</p>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors duration-150">Support Contact</a>
          </div>
        </div>
        <hr className="border-gray-800 my-6" />
        <div className="text-center text-xs">
          &copy; {new Date().getFullYear()} CampusEvents Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
