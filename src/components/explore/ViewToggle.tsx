
import { Button } from '@/components/ui/button';
import { Grid, Rows } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'single' | 'grid';
  setViewMode: (mode: 'single' | 'grid') => void;
}

const ViewToggle = ({ viewMode, setViewMode }: ViewToggleProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Button 
        variant={viewMode === 'single' ? 'default' : 'outline'} 
        onClick={() => setViewMode('single')}
        className="flex items-center gap-2"
      >
        <Rows className="w-4 h-4" />
        Single View
      </Button>
      <Button 
        variant={viewMode === 'grid' ? 'default' : 'outline'} 
        onClick={() => setViewMode('grid')}
        className="flex items-center gap-2"
      >
        <Grid className="w-4 h-4" />
        Grid View
      </Button>
    </div>
  );
};

export default ViewToggle;
