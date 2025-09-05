'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">WorkOrderWizard</h1>
        <p className="text-gray-600 text-center mb-8">YMCA Maintenance Management System</p>
        
        <div className="bg-blue-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">System Status</h2>
          <p className="text-gray-600 text-sm mb-2">Frontend: <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2"></span> Running</p>
          <p className="text-gray-600 text-sm mb-2">Backend: <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2"></span> Ready</p>
          <p className="text-gray-600 text-sm mb-2">Database: <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2"></span> Connected</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Features</h2>
          <ul className="text-gray-600 text-sm list-none p-0 m-0">
            <li className="mb-2">• Work Order Management</li>
            <li className="mb-2">• SMS Notifications via Twilio</li>
            <li className="mb-2">• Shopify Integration</li>
            <li className="mb-2">• Firebase Authentication</li>
          </ul>
        </div>
        
        <div className="text-center mt-6">
          <a 
            href="/dashboard" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
