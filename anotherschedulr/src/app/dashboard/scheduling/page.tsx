"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboardLayout';
import SchedulingPageBuilder from '@/components/schedulingPageBuilder';

const SchedulingPage = () => {
  return (
    <DashboardLayout
      title="Scheduling Page"
      subtitle="Create and customize your public booking page"
    >
      <div className="h-full">
        <SchedulingPageBuilder />
      </div>
    </DashboardLayout>
  );
};

export default SchedulingPage;