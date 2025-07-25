import React from 'react';

const SearchInput = () => {
  return (
    <div className="p-2 overflow-hidden w-[40px] h-[40px] hover:w-[200px] bg-white shadow-[2px_2px_20px_rgba(0,0,0,0.08)] rounded-full flex group items-center hover:duration-300 duration-300">
      <div className="flex items-center justify-center fill-black w-[24px] h-[24px] flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width={16} height={16}>
          <path d="M18.9,16.776A10.539,10.539,0,1,0,16.776,18.9l5.1,5.1L24,21.88ZM10.5,18A7.5,7.5,0,1,1,18,10.5,7.507,7.507,0,0,1,10.5,18Z" />
        </svg>
      </div>
      <input type="text" className="outline-none text-[16px] bg-transparent w-full text-black font-normal px-3" />
    </div>
  );
}

export default SearchInput; 