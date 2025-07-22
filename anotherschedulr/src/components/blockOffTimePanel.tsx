"use client";

import React, { useState } from 'react';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface BlockOffTimePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const BlockOffTimePanel: React.FC<BlockOffTimePanelProps> = ({ isOpen, onClose }) => {
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [blockMultipleDays, setBlockMultipleDays] = useState(false);
  const [notes, setNotes] = useState('');

  const handleBlockOffTime = () => {
    // TODO: Implement block off time logic
    console.log('Blocking off time:', {
      startTime,
      endTime,
      selectedDate,
      blockMultipleDays,
      notes
    });
    onClose();
  };

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
                Block Off Time
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              Going on vacation? Taking some time off? Block off time on your calendar to 
              prevent clients from booking appointments (existing appointments will remain on your calendar).
            </p>
          </div>

          <div className="space-y-6">
            {/* Block Off Time Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  BLOCK OFF TIME
                </label>
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={blockMultipleDays}
                    onChange={(e) => setBlockMultipleDays(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  Block Multiple Days
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <span className="text-gray-500 text-sm">to</span>
                <div className="flex-1">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
                DATE
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* Repeat Section */}
            <div>
              <button className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Repeat</span>
              </button>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this blocked time..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBlockOffTime}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Block Off Time
            </button>

            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockOffTimePanel;