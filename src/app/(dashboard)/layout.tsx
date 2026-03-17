import { Sidebar } from '@/components/layout/sidebar'
import { SignOutOverlay } from '@/components/layout/sign-out-overlay'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-[240px] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      <SignOutOverlay />
    </div>
  )
}
