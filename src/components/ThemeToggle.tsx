import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/TooltipWrapper';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <TooltipWrapper message='Switch theme'>
            <Button
                variant='outline'
                size='icon'
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label='Theme Button'
                className='cursor-pointer text-foreground'
            >
                {theme === 'dark' ? (
                    <Moon className='h-5 w-5' />
                ) : (
                    <Sun className='h-5 w-5' />
                )}
            </Button>
        </TooltipWrapper>
    );
}
