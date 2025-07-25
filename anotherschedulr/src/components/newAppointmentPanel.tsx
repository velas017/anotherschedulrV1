"use client";

import React from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface NewAppointmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewAppointmentPanel: React.FC<NewAppointmentPanelProps> = ({ isOpen, onClose }) => {
  const formSections = [
    {
      id: 'appointment-type',
      label: 'Appointment Type',
      onClick: () => console.log('Appointment Type clicked')
    },
    {
      id: 'date-time',
      label: 'Date & Time',
      onClick: () => console.log('Date & Time clicked')
    },
    {
      id: 'client-name',
      label: 'Client Name',
      onClick: () => console.log('Client Name clicked')
    },
    {
      id: 'forms-notes',
      label: 'Forms, Code and Notes',
      onClick: () => console.log('Forms, Code and Notes clicked')
    }
  ];

  return (
    <>
      {/* Slide-out Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onClose}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center">
              <div className="bg-gray-600 text-white px-4 py-2 rounded-t-lg font-medium text-sm">
                New Appointment
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {formSections.map((section) => (
              <button
                key={section.id}
                onClick={section.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg group"
              >
                <span className="text-gray-900 font-medium text-left">
                  {section.label}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button 
              className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              <span>Schedule Appointment</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>

            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewAppointmentPanel;