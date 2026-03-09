import React from 'react'

function PageHeader({ title, description }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text:xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">{title || 'Dashboard'}</h1>
        <p className="text-gray-600 md:text-base text-xs">{description || 'View and manage your data'}</p>
      </div>
    </div>
  )
}

export default PageHeader
