import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StudentNameFormProps {
  onSubmit: (name: string) => void;
}

export const StudentNameForm: React.FC<StudentNameFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    onSubmit(name.trim());
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl [background:linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] mx-auto mb-4">
            <img
              className="relative w-[14.66px] h-[14.65px]"
              alt="Vector"
              src="/vector.svg"
            />
            <span className="[font-family:'Sora',Helvetica] font-semibold text-white text-sm">
              Intervue Poll
            </span>
          </div>
          <CardTitle className="[font-family:'Sora',Helvetica] text-2xl font-semibold">
            Welcome, Student!
          </CardTitle>
          <p className="[font-family:'Sora',Helvetica] text-[#00000080] text-base">
            Please enter your name to join the live polling session
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [font-family:'Sora',Helvetica]"
                maxLength={50}
              />
              {error && (
                <p className="text-red-500 text-sm mt-1 [font-family:'Sora',Helvetica]">
                  {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-[48px] rounded-[24px] [background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] [font-family:'Sora',Helvetica] font-semibold text-white"
            >
              Join Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};