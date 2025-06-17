import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const KickedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center flex flex-col items-center justify-center">
          <div className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl [background:linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] mb-6">
            <img
              className="relative w-[14.66px] h-[14.65px]"
              alt="Vector"
              src="/vector.svg"
            />
            <span className="[font-family:'Sora',Helvetica] font-semibold text-white text-sm">
              Intervue Poll
            </span>
          </div>
          <CardTitle
            className="font-normal text-[40px] leading-[1] tracking-[0] text-center mx-auto "
            style={{ fontFamily: 'Sora, Helvetica, Arial, sans-serif', width: 737, height: 50 }}
          >
            You've been Kicked out!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mt-6 flex flex-col items-center justify-center">
            <p
              className="font-normal text-[19px] leading-[1] tracking-[0] text-center mx-auto mb-6"
              style={{ fontFamily: 'Sora, Helvetica, Arial, sans-serif', width: 737, height: 48, color: '#000000b0' }}
            >
              Looks like the teacher had removed you from the poll system.<br />
              Please try again sometime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KickedPage; 