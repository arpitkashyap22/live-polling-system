import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setTeacher, setRole } from '../store/userSlice';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null);

  const handleRoleSelection = (selectedRole: "student" | "teacher") => {
    if (selectedRole === "student") {
      dispatch(setRole('student'));
      navigate('/student');
    } else {
      console.log('Initializing teacher connection...');
      dispatch(setTeacher());
      const socket = socketService.connect();
      console.log('Socket connected:', socket?.id);
      socketService.joinAsTeacher();
      navigate('/teacher');
    }
  };

  const roleOptions = [
    {
      id: "student",
      title: "I'm a Student",
      description: "Join live polls and see real-time results from your teacher",
    },
    {
      id: "teacher",
      title: "I'm a Teacher",
      description: "Create polls and view live results from your students",
    },
  ];

  return (
    <main className="bg-white flex flex-row justify-center w-full min-h-screen">
      <div className="bg-white w-full max-w-[1440px] relative flex flex-col items-center py-16">
        {/* Badge */}
        <div className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl [background:linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)]">
          <img
            className="relative w-[14.66px] h-[14.65px]"
            alt="Vector"
            src="/vector.svg"
          />
          <span className="[font-family:'Sora',Helvetica] font-semibold text-white text-sm">
            Intervue Poll
          </span>
        </div>

        {/* Welcome Text */}
        <div className="flex flex-col items-center gap-[26px] mt-14 mb-16">
          <div className="flex flex-col w-full max-w-[737px] items-center gap-[5px]">
            <h1 className="[font-family:'Sora',Helvetica] text-[40px] text-center tracking-[0] leading-normal">
              <span className="font-normal">Welcome to the </span>
              <span className="font-semibold">Live Polling System</span>
            </h1>
            <p className="[font-family:'Sora',Helvetica] font-normal text-[#00000080] text-[19px] text-center">
              Please select the role that best describes you to begin using the
              live polling system
            </p>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="flex flex-row gap-8 w-full max-w-[800px] justify-center mb-12">
          {roleOptions.map((roleOption) => (
            <Card
              key={roleOption.id}
              className={`w-[387px] cursor-pointer transition-all hover:shadow-md ${
                selectedRole === roleOption.id
                  ? "border-0 shadow-sm"
                  : "border border-solid border-[#d9d9d9]"
              }`}
              onClick={() => setSelectedRole(roleOption.id as "student" | "teacher")}
            >
              <CardContent className="flex flex-col items-start justify-center gap-[17px] p-[25px]">
                <div className="inline-flex flex-col items-start justify-center gap-[9px]">
                  <div className="inline-flex items-end justify-center gap-[11px]">
                    <h2 className="[font-family:'Sora',Helvetica] font-semibold text-black text-[23px]">
                      {roleOption.title}
                    </h2>
                  </div>
                </div>
                <p className="[font-family:'Sora',Helvetica] font-normal text-[#454545] text-base">
                  {roleOption.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <Button 
          className="w-[234px] h-[58px] rounded-[34px] [background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] [font-family:'Sora',Helvetica] font-semibold text-white text-lg"
          onClick={() => selectedRole && handleRoleSelection(selectedRole)}
          disabled={!selectedRole}
        >
          Continue
        </Button>
      </div>
    </main>
  );
};

export default HomePage;