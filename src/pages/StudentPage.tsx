import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import PollResults from '../components/PollResults';
import { Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { setAnswerCorrect } from '../store/pollSlice';

interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  totalVotes: number;
  totalStudents: number;
  results: Record<string, number>;
  status?: 'active' | 'closed';
}

const StudentPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentPoll, results, timeRemaining, hasAnswered, userAnswer } = useSelector(
    (state: RootState) => state.poll
  );
  const { studentId, studentName } = useSelector((state: RootState) => state.user);
  const { isAnswerCorrect } = useSelector((state: RootState) => state.poll);

  console.log('StudentPage render: currentPoll is', currentPoll ? 'active' : 'null');

  useEffect(() => {
    // This useEffect is primarily for initial connection and logging initial state
    console.log('StudentPage mounted. Initial poll state:', currentPoll);
    console.log('Initial time remaining:', timeRemaining);

    if (socketService && studentId && studentName) {
      console.log('Attempting to join as student:', { studentId, studentName });
      // Only join if socket is not already connected as this student
      if (!socketService.getSocket()?.connected || !socketService.getSocket()?.hasListeners('student:joined')) { // Added condition to prevent re-joining
        socketService.joinAsStudent(studentId, studentName);
      }
    }

    // Cleanup on unmount or when student data changes significantly
    return () => {
      // Only disconnect if studentId is not present (e.g., navigated away from student flow)
      if (!sessionStorage.getItem('studentId')) {
        socketService.disconnect();
      }
    };
  }, [socketService, studentId, studentName]); // Dependencies only for initial connection

  // Add a separate useEffect for logging poll and timer changes without re-joining
  useEffect(() => {
    console.log('Current poll state updated:', currentPoll);
    console.log('Time remaining updated:', timeRemaining);
  }, [currentPoll, timeRemaining]);

  const handleSubmitAnswer = (answer: string) => {
    if (!socketService) return;
    console.log('Submitting answer:', answer);
    socketService.submitAnswer(answer);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToHome = () => {
    // Clear session storage and navigate back
    sessionStorage.removeItem('studentId');
    sessionStorage.removeItem('studentName');
    socketService.disconnect();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          
         
          <h1 className="[font-family:'Sora',Helvetica] text-2xl font-semibold text-gray-900">
            Welcome, {studentName}!
          </h1>
          <p className="[font-family:'Sora',Helvetica] text-gray-600 mt-1">
            Participate in live polls and see real-time results
          </p>
        </div>

        {/* Current Poll */}
        {currentPoll && currentPoll.status === 'active' && !hasAnswered && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="[font-family:'Sora',Helvetica]">Current Poll</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="[font-family:'Sora',Helvetica] text-lg font-semibold">
                  {currentPoll.question}
                </h3>
                
                <div className="space-y-2">
                  {currentPoll.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSubmitAnswer(option)}
                      className="w-full text-left justify-start h-auto p-4 [font-family:'Sora',Helvetica] hover:bg-blue-50 hover:border-blue-300"
                      disabled={timeRemaining <= 0}
                    >
                      <span className="font-medium mr-3 text-gray-500">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </Button>
                  ))}
                </div>

                {timeRemaining <= 10 && timeRemaining > 0 && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span className="[font-family:'Sora',Helvetica]">
                      Hurry up! Only {timeRemaining} seconds left
                    </span>
                  </div>
                )}

                {timeRemaining <= 0 && (
                  <div className="text-center text-gray-600 [font-family:'Sora',Helvetica]">
                    Time's up! Waiting for results...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Submitted */}
        {hasAnswered && userAnswer && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <CheckCircle className={`w-16 h-16 ${isAnswerCorrect ? 'text-green-500' : 'text-yellow-500'} mx-auto mb-4`} />
              <h3 className="[font-family:'Sora',Helvetica] text-xl font-semibold text-gray-900 mb-2">
                Answer Submitted!
              </h3>
              <p className="[font-family:'Sora',Helvetica] text-gray-600 mb-2">
                Your answer: <span className="font-semibold">{userAnswer}</span>
              </p>
              {isAnswerCorrect !== undefined && (
                <p className={`[font-family:'Sora',Helvetica] ${isAnswerCorrect ? 'text-green-600' : 'text-yellow-600'} mb-2`}>
                  {isAnswerCorrect ? 'Correct!' : 'Not the correct answer'}
                </p>
              )}
              <p className="[font-family:'Sora',Helvetica] text-gray-600">
                Waiting for other students to complete...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Poll Results */}
        {results && (hasAnswered || results.status === 'closed') && (
          <PollResults results={results} isTeacher={false} />
        )}

        {/* No Poll Message */}
        {!currentPoll && (
          <Card>
            <CardContent className="text-center py-12">
              {/* <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div> */}
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
              <div className="flex flex-col items-center gap-4 m-4 p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
              </div>
              <p className="[font-family:'Sora',Helvetica] text-2xl font-semibold text-gray-900">
                Wait for your teacher to ask questions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentPage;