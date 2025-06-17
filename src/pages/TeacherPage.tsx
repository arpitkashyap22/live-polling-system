import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import PollResults from '../components/PollResults';
import { Plus, Users, Clock, ArrowLeft, X, AlertCircle } from 'lucide-react';

interface Poll {
  id: string;
  question: string;
  options: string[];
  status: 'active' | 'closed';
  createdAt: string;
  timeLimit?: number;
}

interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  totalVotes: number;
  totalStudents: number;
  results?: Record<string, number>;
  votes?: Record<string, number>;
  status?: 'active' | 'closed';
}

interface Student {
  id: string;
  name: string;
  hasAnswered?: boolean;
}

const TeacherPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentPoll, results, timeRemaining, error: pollError } = useSelector((state: RootState) => state.poll);
  const { isConnected } = useSelector((state: RootState) => state.user);
  
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [currentPollState, setCurrentPoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [showStudentListPopup, setShowStudentListPopup] = useState(false);
  const [customTimeLimit, setCustomTimeLimit] = useState(60);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  useEffect(() => {
    console.log('Teacher page mounted, initializing connection...');

    if (!socketService.isConnected()) {
      console.log('Socket not connected, connecting...');
      socketService.connect();
    }

    // FIX: Wait for connection before joining as teacher
    const initTeacher = () => {
      console.log('Joining as teacher...');
      socketService.joinAsTeacher();
    };

    if (socketService.isConnected()) {
      initTeacher();
    } else {
      // Wait for connection
      const checkConnection = setInterval(() => {
        if (socketService.isConnected()) {
          clearInterval(checkConnection);
          initTeacher();
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkConnection), 10000);
    }

    // Listen for student list updates
    socketService.onStudentListUpdate((list) => {
      console.log('Received student list:', list);
      const students = list.map((student: any) => ({
        id: student.id || student.socketId || student.studentId,
        name: student.name || student.studentName,
        hasAnswered: student.hasAnswered || false
      }));
      setStudentList(students);
    });

    // Listen for poll updates
    socketService.onNewPoll((poll) => {
      console.log('New poll created:', poll);
      setCurrentPoll(poll);
      setPollResults(null);
      
      setError(''); // Clear any errors
    });

    socketService.onPollClosed((results) => {
      console.log('Poll closed with results:', results);
      setPollResults(results);
      setCurrentPoll(null);
      
    });

    // FIX: Listen for live poll results updates
    socketService.onPollError((pollError) => {
      console.error('Poll error received:', pollError);
      setError(pollError.message || 'An error occurred');
      setIsCreatingPoll(false);
    });

    // FIX: Listen for answer updates for live results
    socketService.onNewAnswer((answerData) => {
      console.log('New answer received:', answerData);
      // Request updated results when new answer comes in
      // socketService.getPollResults?.(); // Removed, method does not exist
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // FIX: Sync with Redux store
  useEffect(() => {
    if (currentPoll) {
      setCurrentPoll(currentPoll);
      
    } else {
      setCurrentPoll(null);
      
    }
  }, [currentPoll]);

  useEffect(() => {
    if (results) {
      setPollResults(results);
    }
  }, [results]);

  // FIX: Handle poll errors from Redux
  useEffect(() => {
    if (pollError) {
      setError(pollError);
      setIsCreatingPoll(false);
    }
  }, [pollError]);

  const handleKickStudent = (studentId: string) => {
    const student = studentList.find(s => s.id === studentId);
    if (window.confirm(`Are you sure you want to kick ${student?.name || 'this student'}?`)) {
      socketService.kickStudent(studentId);
    }
  };

  // FIX: Proper logic for when teacher can create new poll
  const canCreateNewPoll = () => {
    // Can create if no current poll OR current poll is closed
    if (!currentPoll && !currentPollState) return true;
    if (currentPoll?.status === 'closed') return true;
    if (currentPollState?.status === 'closed') return true;
    
    // Can create if all students have answered
    if (studentList.length > 0) {
      const allAnswered = studentList.every(student => student.hasAnswered);
      return allAnswered;
    }
    
    return false;
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreatingPoll(true);

    // FIX: Better validation
    if (!question.trim()) {
      setError('Please enter a question');
      setIsCreatingPoll(false);
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options');
      setIsCreatingPoll(false);
      return;
    }

    if (!correctAnswer || !validOptions.includes(correctAnswer)) {
      setError('Please select a valid correct answer');
      setIsCreatingPoll(false);
      return;
    }

    if (!socketService.isConnected()) {
      setError('Not connected to server. Please refresh the page.');
      setIsCreatingPoll(false);
      return;
    }

    const poll = {
      question: question.trim(),
      options: validOptions,
      timeLimit: customTimeLimit,
      correctAnswer
    };

    try {
      console.log('Creating new poll:', poll);
      await socketService.createPoll(poll);

      // Reset form only after successful creation
      setQuestion('');
      setOptions(['', '']);
      setCorrectAnswer(null);
      setCustomTimeLimit(60);
    } catch (error) {
      console.error('Failed to create poll:', error);
      setError('Failed to create poll. Please try again.');
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // FIX: Update correct answer if it was the changed option
    if (correctAnswer === options[index]) {
      setCorrectAnswer(value);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const removedOption = options[index];
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // FIX: Clear correct answer if removed option was selected
      if (correctAnswer === removedOption) {
        setCorrectAnswer(null);
      }
    }
  };

  const handleBackToHome = () => {
    socketService.disconnect();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 relative">
      <div className="max-w-4xl mx-auto">
        {/* FIX: Connection Status Indicator */}
        {!isConnected && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="[font-family:'Sora',Helvetica]">Connection lost. Attempting to reconnect...</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={handleBackToHome}
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>

              <div className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl [background:linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] mb-4">
                <img
                  className="relative w-[14.66px] h-[14.65px]"
                  alt="Vector"
                  src="/vector.svg"
                />
                <span className="[font-family:'Sora',Helvetica] font-semibold text-white text-sm">
                  Intervue Poll
                </span>
              </div>
              <h1 className="[font-family:'Sora',Helvetica] text-3xl font-semibold text-gray-900">
                Let's get started!
              </h1>
              <p className="[font-family:'Sora',Helvetica] text-gray-600 mt-1">
                you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
              </p>
            </div>
            {canCreateNewPoll() && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="[background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] [font-family:'Sora',Helvetica] font-semibold"
                disabled={!isConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Poll
              </Button>
            )}
          </div>
        </div>

        {/* FIX: Better Current Poll Status */}
        {(currentPoll || currentPollState) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Sora',Helvetica] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Current Poll Status
                </div>
                
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="[font-family:'Sora',Helvetica] font-semibold text-lg">
                    {currentPoll?.question || currentPollState?.question}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (currentPoll?.status === 'active' || currentPollState?.status === 'active')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {(currentPoll?.status === 'active' || currentPollState?.status === 'active') ? 'Active' : 'Closed'}
                  </span>
                  {/* FIX: Show time remaining */}
                  {timeRemaining > 0 && (
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-4 h-4" />
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                    </span>
                  )}
                  {pollResults && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {pollResults.totalVotes}/{pollResults.totalStudents} responses
                    </span>
                  )}
                  {/* FIX: Show answered vs total students */}
                  {!pollResults && studentList.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {studentList.filter(s => s.hasAnswered).length}/{studentList.length} answered
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FIX: Only show if teacher can't create new poll */}
        {!canCreateNewPoll() && !showCreateForm && (currentPoll?.status === 'active' || currentPollState?.status === 'active') && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="[font-family:'Sora',Helvetica] text-gray-600">
                  {studentList.length === 0 
                    ? "Waiting for students to join..." 
                    : `Waiting for ${studentList.filter(s => !s.hasAnswered).length} student(s) to answer...`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Poll Form - always visible */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="[font-family:'Sora',Helvetica]">Enter your Question</CardTitle>
              {/* Timer Dropdown - top right */}
              <div>
                <label htmlFor="timer-select" className="mr-2 text-sm font-medium [font-family:'Sora',Helvetica]">Time Limit</label>
                <select
                  id="timer-select"
                  value={customTimeLimit}
                  onChange={e => setCustomTimeLimit(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm [font-family:'Sora',Helvetica] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active')}
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <textarea
                  value={question}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                  placeholder="Enter your poll question"
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-blue-500 
           resize-none [font-family:'Sora',Helvetica]"
                  rows={4}
                  disabled={isCreatingPoll || (currentPoll && currentPoll.status === 'active')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 [font-family:'Sora',Helvetica]">
                  Edit Options
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [font-family:'Sora',Helvetica]"
                      maxLength={100}
                      disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active')}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={correctAnswer === option}
                        onChange={() => setCorrectAnswer(option)}
                        className="w-4 h-4 text-blue-600"
                        disabled={!!isCreatingPoll || !option.trim() || !!(currentPoll && currentPoll.status === 'active')}
                      />
                      <span className="text-sm text-gray-600">Correct</span>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveOption(index)}
                          className="px-3"
                          disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active')}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    className="border border-[#7451B6] text-[11px] px-2.5 py-1 rounded-md font-medium text-center me-2 mb-2 mt-2 [font-family:'Sora',Helvetica] text-[#7451B6] hover:bg-[#7451B6]/10 focus:outline-none focus:ring-1 focus:ring-[#7451B6]"
                    disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active')}
                  >
                    Add More Option
                  </Button>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm [font-family:'Sora',Helvetica] text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="[background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] [font-family:'Sora',Helvetica] font-semibold"
                  disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active') || !isConnected}
                >
                  {isCreatingPoll ? 'Creating...' : 'Ask Question'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  className="[font-family:'Sora',Helvetica]"
                  disabled={!!isCreatingPoll || !!(currentPoll && currentPoll.status === 'active')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Poll Results */}
        {pollResults && <PollResults results={pollResults} isTeacher={true} />}
      </div>

      {/* Floating Student List Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          className="rounded-full w-14 h-14 shadow-lg [background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] flex items-center justify-center"
          onClick={() => setShowStudentListPopup(!showStudentListPopup)}
          aria-label="Toggle Student List"
        >
          <Users className="w-6 h-6 text-white" />
          {studentList.length > 0 && (
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-red-600 text-white text-xs flex items-center justify-center">
              {studentList.length}
            </span>
          )}
        </Button>

        {/* FIX: Enhanced Student List Pop-up */}
        {showStudentListPopup && (
          <Card className="absolute bottom-16 right-0 w-64 shadow-xl z-50">
            <CardHeader className="pb-2">
              <CardTitle className="[font-family:'Sora',Helvetica] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Students ({studentList.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStudentListPopup(false)}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-60 overflow-y-auto">
              {studentList.length > 0 ? (
                <div className="space-y-2">
                  {studentList.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="[font-family:'Sora',Helvetica] font-medium text-sm">
                          {student.name}
                        </span>
                        {/* FIX: Show answer status */}
                        {currentPoll?.status === 'active' && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            student.hasAnswered 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.hasAnswered ? '✓' : '⏳'}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleKickStudent(student.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        title={`Kick ${student.name}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm [font-family:'Sora',Helvetica]">
                  No students connected
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherPage;