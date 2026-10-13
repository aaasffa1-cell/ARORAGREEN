import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/BrandLogo';
import { Swords, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <BrandLogo size="lg" className="justify-center mx-auto" />
        <div className="space-y-2">
          <span className="font-heading text-7xl font-extrabold text-neongreen glow-green">
            404
          </span>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-icewhite">
            Sector Out Of Zone
          </h1>
          <p className="text-xs text-subtext leading-relaxed">
            The tournament coordinate or sector you are attempting to drop into does not exist or has been relocated outside the playzone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" icon={<Home className="w-4 h-4" />}>
              Return Base
            </Button>
          </Link>
          <Link to="/tournaments">
            <Button variant="secondary" icon={<Swords className="w-4 h-4" />}>
              Active Tournaments
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
