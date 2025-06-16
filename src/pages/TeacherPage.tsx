import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import  PollResults  from '../components/PollResults';
import { Plus, Users, Clock, ArrowLeft, X } from 'lucide-react';

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
}

const TeacherPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentPoll, results } = useSelector((state: RootState) => state.poll);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [currentPollState, setCurrentPoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [showStudentListPopup, setShowStudentListPopup] = useState(false);

  useEffect(() => {
    console.log('Teacher page mounted, initializing connection...');
    
    if (!socketService.isConnected()) {
      console.log('Socket not connected, connecting...');
      socketService.connect();
    }

    console.log('Joining as teacher...');
    socketService.joinAsTeacher();

    // Listen for student list updates
    socketService.onStudentListUpdate((list) => {
      console.log('Received student list:', list);
      const students = list.map((student: any) => ({
        id: student.id || student.socketId,
        name: student.name || student.studentName
      }));
      setStudentList(students);
    });

    // Listen for poll updates
    socketService.onNewPoll((poll) => {
      console.log('New poll created:', poll);
      setCurrentPoll(poll);
      setPollResults(null);
    });

    socketService.onPollClosed((results) => {
      console.log('Poll closed with results:', results);
      setPollResults(results);
      setCurrentPoll(null);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleKickStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to kick this student?')) {
      socketService.kickStudent(studentId);
    }
  };

  const canCreateNewPoll = !currentPoll || currentPoll.status === 'closed';

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (options.some(opt => !opt.trim())) {
      setError('Please fill in all options');
      return;
    }

    if (!correctAnswer) {
      setError('Please select the correct answer');
      return;
    }

    const poll = {
      question,
      options,
      timeLimit: 60,
      correctAnswer
    };

    console.log('Creating new poll:', poll);
    await socketService.createPoll(poll);
    
    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setCorrectAnswer(null);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleBackToHome = () => {
    socketService.disconnect();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 relative">
      <div className="max-w-4xl mx-auto">
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
            {canCreateNewPoll && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="[background:linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] [font-family:'Sora',Helvetica] font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Poll
              </Button>
            )}
          </div>
        </div>

        {/* Current Poll Status */}
        {currentPollState && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Sora',Helvetica] flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Current Poll Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="[font-family:'Sora',Helvetica] font-semibold text-lg">
                    {currentPollState.question}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentPollState.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currentPollState.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                  {pollResults && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {pollResults.totalVotes}/{pollResults.totalStudents} responses
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Poll Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Sora',Helvetica]">Create New Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePoll} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 [font-family:'Sora',Helvetica]">
                    Question
                  </label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                    placeholder="Enter your poll question"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [font-family:'Sora',Helvetica]"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 [font-family:'Sora',Helvetica]">
                    Options
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
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === option}
                          onChange={() => setCorrectAnswer(option)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-600">Correct</span>
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleRemoveOption(index)}
                            className="px-3"
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
                      className="mt-2 [font-family:'Sora',Helvetica]"
                    >
                      Add Option
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
                  >
                    Ask Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError('');
                    }}
                    className="[font-family:'Sora',Helvetica]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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

        {/* Student List Pop-up */}
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
                      <span className="[font-family:'Sora',Helvetica] font-medium text-sm">
                        {student.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleKickStudent(student.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
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