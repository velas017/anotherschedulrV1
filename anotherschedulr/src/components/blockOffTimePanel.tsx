"use client";

import React, { useState } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react';
import TimeInput from '@/components/availability/TimeInput';

interface BlockOffTimePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BlockOffTimePanel: React.FC<BlockOffTimePanelProps> = ({ isOpen, onClose, onSuccess }) => {
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState('');
  const [blockMultipleDays, setBlockMultipleDays] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const handleBlockOffTime = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert date and time to ISO format
      const startDateTime = new Date(`${selectedDate}T${startTime}`);
      const endDateTime = new Date(`${blockMultipleDays && endDate ? endDate : selectedDate}T${endTime}`);

      // Validate times
      if (startDateTime >= endDateTime) {
        throw new Error('End time must be after start time');
      }

      const response = await fetch('/api/blocked-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          reason: notes,
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : null,
          recurrenceEnd: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to block off time');
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
      // Reset form
      setStartTime('11:00');
      setEndTime('12:00');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setBlockMultipleDays(false);
      setNotes('');
      setIsRecurring(false);
      setRecurrenceType('WEEKLY');
      setRecurrenceEndDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Slide-out Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              Going on vacation? Taking some time off? Block off time on your calendar to 
              prevent clients from booking appointments (existing appointments will remain on your calendar).
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Block Off Time Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-800 uppercase tracking-wide">
                  BLOCK OFF TIME
                </label>
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={blockMultipleDays}
                    onChange={(e) => {
                      setBlockMultipleDays(e.target.checked);
                      if (!e.target.checked) {
                        setEndDate('');
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  Block Multiple Days
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Start time
                  </label>
                  <TimeInput
                    value={startTime}
                    onChange={(value) => setStartTime(value)}
                    placeholder="Start time"
                  />
                </div>
                
                <div className="text-center text-gray-600 text-sm" aria-hidden="true">to</div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    End time
                  </label>
                  <TimeInput
                    value={endTime}
                    onChange={(value) => setEndTime(value)}
                    placeholder="End time"
                  />
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div>
              <label className="block text-sm font-medium text-gray-800 uppercase tracking-wide mb-2">
                {blockMultipleDays ? 'START DATE' : 'DATE'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* End Date Section (for multiple days) */}
            {blockMultipleDays && (
              <div>
                <label className="block text-sm font-medium text-gray-800 uppercase tracking-wide mb-2">
                  END DATE
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            )}

            {/* Repeat Section */}
            <div>
              <label className="flex items-center text-sm text-gray-600 mb-3">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked);
                    if (!e.target.checked) {
                      setRecurrenceEndDate('');
                    }
                  }}
                  className="mr-2 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="font-medium">Repeat this blocked time</span>
              </label>

              {isRecurring && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Repeat Type
                    </label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Repeat Until
                    </label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this blocked time..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBlockOffTime}
              disabled={isLoading}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Blocking Time...
                </>
              ) : (
                'Block Off Time'
              )}
            </button>

            <button 
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm disabled:opacity-50"
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