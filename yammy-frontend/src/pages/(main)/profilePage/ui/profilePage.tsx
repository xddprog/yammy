import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button/button'
import { ERouteNames } from '@/shared/lib/routeVariables'

const ProfilePage = (): JSX.Element => {
  const navigate = useNavigate()

  return (
    <div className="h-full w-full flex flex-col font-light bg-background text-foreground">
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
        {/* Avatar and Info */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-32 rounded-3xl overflow-hidden mb-3 border-2 border-transparent">
            <img 
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-medium mb-2">Michael, 28</h2>
          <Button 
            variant="default"
            size="sm"
            className="rounded-full px-6 font-medium"
            onClick={() => navigate(`/${ERouteNames.PROFILE_ROUTE}/edit`)}
          >
            Edit profile info
          </Button>
        </div>

        {/* Premium Card */}
        <div className="mt-6 mx-2 relative rounded-3xl bg-primary/10 border border-primary/20 p-5 overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute -bottom-6 -right-2 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
          <div className="absolute -bottom-10 right-12 w-28 h-28 bg-accent/20 rounded-full blur-xl" />
          
          {/* Heart indicator */}
          <div className="absolute top-0 right-0 w-24 h-24 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="absolute w-full h-full fill-primary/20 dark:fill-primary/40 -translate-y-2 translate-x-3">
              <path d="M174.4 39.5c-19.1-19.1-50.1-19.1-69.2 0L100 44.7l-5.2-5.2c-19.1-19.1-50.1-19.1-69.2 0-19.1 19.1-19.1 50.1 0 69.2l74.4 74.4 74.4-74.4c19.1-19.1 19.1-50 0-69.2z" />
            </svg>
            <div className="relative text-foreground flex flex-col items-center mt-0">
              <span className="text-xl font-bold leading-none text-primary">50</span>
              <span className="text-xs font-medium">$/mth</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-start">
            <span className="text-muted-foreground text-xs mb-1">Current plan</span>
            <h3 className="text-foreground text-2xl font-bold mb-4">Premium</h3>
            <Button variant="outline" size="sm" className="rounded-full bg-background border-border">
              Change subscription
            </Button>
          </div>
        </div>

        {/* Profile Settings List */}
        <div className="mt-4 mx-2 flex flex-col gap-2">
          {[
            { label: 'Phone number', value: '+12345678910', hideChevron: false },
            { label: 'Email', value: 'micharls@gmail.com', hideChevron: false },
            { label: 'Notifications', value: 'All', hideChevron: false },
            { label: 'Payment method', value: '', hideChevron: false },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <span className="font-medium text-sm text-foreground">{item.label}</span>
              <div className="flex items-center text-muted-foreground gap-2">
                {item.value && <span className="font-light text-sm">{item.value}</span>}
                {!item.hideChevron && <ChevronRight className="w-4 h-4 text-current opacity-80" />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default ProfilePage
