import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, RotateCcw, Settings, Trophy, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import soccerBall from '@/assets/soccer-ball.png';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/practice', icon: BookOpen, label: 'Practice' },
    { to: '/review', icon: RotateCcw, label: 'Review' },
    { to: '/progress', icon: Trophy, label: 'Progress' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:relative md:border-t-0 md:border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-around md:justify-start md:gap-6 py-3 items-center">
          <img src={soccerBall} alt="VocabChamp" className="w-8 h-8 hidden md:block mr-2" />
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors',
                location.pathname === to
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs md:text-sm font-medium">{label}</span>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="md:ml-auto flex flex-col md:flex-row items-center gap-1 md:gap-2 text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs md:text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

