import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ExternalLink } from 'lucide-react';

interface ThankYouSectionProps {
  onStartOver: () => void;
}

export function ThankYouSection({ onStartOver }: ThankYouSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Thank You!</h2>
      </div>

      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="p-6 text-center space-y-6">
          {/* Large EYV Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="EYV Logo" 
              className="w-32 h-32 rounded-full object-cover shadow-lg"
              onError={(e) => {
                console.log('Thank you logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Thank You Message */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Heart className="w-10 h-10 text-red-500 fill-current mx-auto mb-3" />
              <h3 className="text-xl font-bold text-deep-purple dark:text-purple-400">
                Thank you for supporting<br />
                Early Years Voice
              </h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
              If you haven't donated already then please go to our donations page on Just Giving
            </p>
            
            {/* Donation Link */}
            <div className="pt-4">
              <Button
                onClick={() => window.open('https://justgiving.com/crowdfunding/eyv', '_blank')}
                className="w-full bg-deep-purple hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 touch-manipulation"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Visit JustGiving Donation Page</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Over Button */}
      <div className="pt-6">
        <Button
          onClick={onStartOver}
          variant="outline"
          className="w-full py-3 px-6 border-2 border-deep-purple dark:border-purple-600 text-deep-purple dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-semibold rounded-lg touch-manipulation"
        >
          Create Another Profile Picture
        </Button>
      </div>
    </div>
  );
}