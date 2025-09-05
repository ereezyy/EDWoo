// This file has been temporarily removed for deployment
// WebSocket functionality will be re-added in a future update

interface NotificationCenterProps {
  token?: string
}

export default function NotificationCenter({ token }: NotificationCenterProps) {
  return (
    <div className="text-gray-500 text-sm">
      Notifications temporarily disabled
    </div>
  )
}
