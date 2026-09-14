import React from 'react';

const RoleToggle = ({ selectedRole, onRoleChange }) => {
  return (
    <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-xs mx-auto">
      <button
        type="button"
        onClick={() => onRoleChange('patient')}
        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          selectedRole === 'patient'
            ? 'bg-white text-primary shadow-sm'
            : 'text-text-muted hover:text-text-main'
        }`}
      >
        Patient
      </button>
      <button
        type="button"
        onClick={() => onRoleChange('clinic')}
        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          selectedRole === 'clinic'
            ? 'bg-white text-primary shadow-sm'
            : 'text-text-muted hover:text-text-main'
        }`}
      >
        Clinic
      </button>
    </div>
  );
};

export default RoleToggle;
