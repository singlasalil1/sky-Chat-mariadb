import React from 'react';
import '../styles/SearchTabs.css';

const SearchTabs = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="search-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SearchTabs;
