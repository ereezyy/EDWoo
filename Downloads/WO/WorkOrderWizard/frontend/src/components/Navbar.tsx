'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'

export function Navbar() {
  const { userProfile, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">WorkOrderWizard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{userProfile?.name}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {userProfile?.role}
              </span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
